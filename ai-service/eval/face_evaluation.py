"""FaceID PAD/identity calibration + independent evaluation. Offline, scores only.

Inputs (never images/embeddings/names):
  * manifest: list of samples {sample_id, subject_id (pseudonym), capture_device, attack_type,
    ground_truth, consent_reference, model_version, conditions{...}, media_sha256, split, evaluated_at}
  * trials:   rows {trial_id(=sample_id or pair id), task, label, outcome, score, cpu_inference_ms, end_to_end_ms}
    identity rows also carry {probe_sample_id, reference_sample_id}.

Procedure: thresholds are selected on the `calibration` split ONLY, then applied unchanged to the
subject-disjoint `evaluation` split. Missing/insufficient data yields BLOCKED_DATA, never a number.
Technical errors / timeouts are reported separately from PAD rejections and from failure-to-acquire.
"""
import argparse
import hashlib
import json
import math
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ATTACKS = ('print', 'screen', 'video_replay')
PAD_LABELS = ('bona_fide',) + ATTACKS
OUTCOMES = {'SCORED', 'NO_FACE', 'MULTIPLE_FACES', 'QUALITY_REJECTED', 'INCONCLUSIVE', 'TECHNICAL_ERROR', 'TIMEOUT'}
ACQUISITION_FAILURES = {'NO_FACE', 'MULTIPLE_FACES', 'QUALITY_REJECTED'}
TECHNICAL_FAILURES = {'TECHNICAL_ERROR', 'TIMEOUT', 'INCONCLUSIVE'}
SPLITS = ('calibration', 'evaluation')
CONDITIONS = {'lighting': {'normal', 'low', 'backlit', 'bright'}, 'motion': {'none', 'blur'},
              'occlusion': {'none', 'partial'}, 'faces': {'single', 'multiple', 'none'}}
MANIFEST_FIELDS = {'sample_id', 'subject_id', 'capture_device', 'attack_type', 'ground_truth', 'consent_reference',
                   'model_version', 'conditions', 'media_sha256', 'split', 'evaluated_at'}
TRIAL_FIELDS = {'trial_id', 'task', 'label', 'outcome', 'score', 'cpu_inference_ms', 'end_to_end_ms', 'probe_sample_id', 'reference_sample_id'}
SUBJECT = re.compile(r'S[0-9]{3,6}')
SAMPLE = re.compile(r'[A-Za-z0-9_-]{1,64}')
DEVICE = re.compile(r'[A-Za-z0-9 ._-]{1,48}')
SHA = re.compile(r'[a-f0-9]{64}')

DEFAULT_MINIMUMS = {'bona_fide_trials': 300, 'attack_trials_per_type': 100, 'subjects_per_split': 8,
                    'genuine_pairs': 300, 'impostor_pairs': 3000, 'per_condition': 30}


def wilson(k, n, z=1.96):
    """95% Wilson score interval; None when n == 0."""
    if not n:
        return None
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return [max(0.0, c - h), min(1.0, c + h)]


def rate(k, n):
    return {'k': k, 'n': n, 'rate': k / n if n else None, 'ci95': wilson(k, n)}


def percentile(values, q):
    if not values:
        return None
    v = sorted(values); p = (len(v) - 1) * q; lo, hi = math.floor(p), math.ceil(p)
    return v[lo] + (v[hi] - v[lo]) * (p - lo)


def validate_manifest(entries):
    if not isinstance(entries, list):
        raise ValueError('MANIFEST_LIST_REQUIRED')
    ids, hashes, subjects = set(), {}, defaultdict(set)
    for e in entries:
        if not isinstance(e, dict) or set(e) != MANIFEST_FIELDS:
            raise ValueError('MANIFEST_FIELDS_EXACT: no names/images/embeddings/extra metadata allowed')
        if not SAMPLE.fullmatch(str(e['sample_id'])) or e['sample_id'] in ids:
            raise ValueError('SAMPLE_ID_INVALID_OR_DUPLICATE')
        ids.add(e['sample_id'])
        if not isinstance(e['subject_id'], str) or not SUBJECT.fullmatch(e['subject_id']):
            raise ValueError('SUBJECT_PSEUDONYM_REQUIRED (S###)')
        if not isinstance(e['capture_device'], str) or not DEVICE.fullmatch(e['capture_device']):
            raise ValueError('CAPTURE_DEVICE_INVALID')
        if e['attack_type'] not in PAD_LABELS:
            raise ValueError('ATTACK_TYPE_INVALID')
        if e['ground_truth'] != ('bona_fide' if e['attack_type'] == 'bona_fide' else 'attack'):
            raise ValueError('GROUND_TRUTH_INCONSISTENT')
        if not isinstance(e['consent_reference'], str) or not e['consent_reference'].strip():
            raise ValueError('CONSENT_REFERENCE_REQUIRED')
        if not isinstance(e['model_version'], str) or not e['model_version']:
            raise ValueError('MODEL_VERSION_REQUIRED')
        c = e['conditions']
        if not isinstance(c, dict) or set(c) != set(CONDITIONS) or any(c[k] not in CONDITIONS[k] for k in CONDITIONS):
            raise ValueError('CONDITIONS_INVALID')
        if not isinstance(e['media_sha256'], str) or not SHA.fullmatch(e['media_sha256']):
            raise ValueError('MEDIA_SHA256_INVALID')
        if e['media_sha256'] in hashes:
            raise ValueError('DUPLICATE_MEDIA_ACROSS_SAMPLES')
        hashes[e['media_sha256']] = e['split']
        if e['split'] not in SPLITS:
            raise ValueError('SPLIT_INVALID')
        try:
            datetime.fromisoformat(str(e['evaluated_at']).replace('Z', '+00:00'))
        except ValueError:
            raise ValueError('EVALUATED_AT_ISO8601_REQUIRED')
        subjects[e['split']].add(e['subject_id'])
    overlap = subjects['calibration'] & subjects['evaluation']
    if overlap:
        raise ValueError(f'SUBJECT_OVERLAP_BETWEEN_SPLITS:{len(overlap)}')
    return {s: len(subjects[s]) for s in SPLITS}


def validate_trials(rows, manifest_ids):
    seen = set()
    for r in rows:
        if not isinstance(r, dict) or set(r) - TRIAL_FIELDS:
            raise ValueError('TRIAL_FIELDS: scores/outcomes/latency only')
        if r.get('trial_id') in seen or not isinstance(r.get('trial_id'), str):
            raise ValueError('TRIAL_ID_INVALID_OR_DUPLICATE')
        seen.add(r['trial_id'])
        if r.get('outcome') not in OUTCOMES:
            raise ValueError('OUTCOME_INVALID')
        if r['task'] == 'pad':
            if r.get('label') not in PAD_LABELS or r['trial_id'] not in manifest_ids:
                raise ValueError('PAD_TRIAL_MUST_REFERENCE_MANIFEST_SAMPLE')
            lo = 0
        elif r['task'] == 'identity':
            if r.get('label') not in ('genuine', 'impostor') or r.get('probe_sample_id') not in manifest_ids or r.get('reference_sample_id') not in manifest_ids:
                raise ValueError('IDENTITY_TRIAL_MUST_REFERENCE_TWO_SAMPLES')
            lo = -1
        else:
            raise ValueError('TASK_INVALID')
        s = r.get('score')
        if r['outcome'] == 'SCORED':
            if type(s) not in (int, float) or not math.isfinite(s) or not lo <= s <= 1:
                raise ValueError('FINITE_SCORE_REQUIRED')
        elif s is not None:
            raise ValueError('UNSCORED_TRIAL_MUST_NOT_HAVE_SCORE')


def _split_of(r, man):
    if r['task'] == 'pad':
        return man[r['trial_id']]['split']
    a, b = man[r['probe_sample_id']]['split'], man[r['reference_sample_id']]['split']
    if a != b:
        raise ValueError('IDENTITY_PAIR_CROSSES_SPLITS')
    if r['label'] == 'genuine' and man[r['probe_sample_id']]['subject_id'] != man[r['reference_sample_id']]['subject_id']:
        raise ValueError('GENUINE_PAIR_SUBJECT_MISMATCH')
    if r['label'] == 'impostor' and man[r['probe_sample_id']]['subject_id'] == man[r['reference_sample_id']]['subject_id']:
        raise ValueError('IMPOSTOR_PAIR_SAME_SUBJECT')
    return a


def pad_metrics(rows, threshold, man, minimums):
    """APCER per attack, BPCER, ACER(max APCER), FTA and technical failure separated, by condition."""
    by = {l: [r for r in rows if r['task'] == 'pad' and r['label'] == l] for l in PAD_LABELS}
    out = {'threshold': threshold, 'by_label': {}, 'blocked': []}
    for label, trials in by.items():
        scored = [r for r in trials if r['outcome'] == 'SCORED']
        accepted = sum(r['score'] >= threshold for r in scored)
        out['by_label'][label] = {
            'trials': len(trials), 'scored': len(scored),
            # attack accepted as bona fide → APCER numerator; bona fide rejected → BPCER numerator
            'error': rate(accepted if label != 'bona_fide' else len(scored) - accepted, len(scored)),
            'failure_to_acquire': rate(sum(r['outcome'] in ACQUISITION_FAILURES for r in trials), len(trials)),
            'technical_failure': rate(sum(r['outcome'] in TECHNICAL_FAILURES for r in trials), len(trials)),
            'outcomes': dict(Counter(r['outcome'] for r in trials)),
        }
        need = minimums['bona_fide_trials'] if label == 'bona_fide' else minimums['attack_trials_per_type']
        if len(scored) < need:
            out['blocked'].append(f'{label}:scored {len(scored)} < {need}')
    apcer = {a: out['by_label'][a]['error'] for a in ATTACKS}
    bpcer = out['by_label']['bona_fide']['error']
    worst = max((v['rate'] for v in apcer.values() if v['rate'] is not None), default=None)
    out.update(apcer=apcer, bpcer=bpcer, apcer_max=worst,
               acer=(worst + bpcer['rate']) / 2 if worst is not None and bpcer['rate'] is not None else None,
               acer_definition='(max APCER over attack types + BPCER) / 2, ISO/IEC 30107-3 style')
    lat = [r['cpu_inference_ms'] for r in rows if r['task'] == 'pad' and r.get('cpu_inference_ms') is not None]
    out['latency_ms'] = {'n': len(lat), 'p50': percentile(lat, .5), 'p95': percentile(lat, .95)}
    out['by_condition'] = condition_breakdown([r for r in rows if r['task'] == 'pad'], threshold, man, minimums['per_condition'])
    return out


def condition_breakdown(rows, threshold, man, min_n):
    groups = defaultdict(list)
    for r in rows:
        s = man[r['trial_id']]
        groups[('device', s['capture_device'])].append(r)
        for k, v in s['conditions'].items():
            groups[(k, v)].append(r)
    out = {}
    for (k, v), g in sorted(groups.items()):
        scored = [r for r in g if r['outcome'] == 'SCORED']
        bf = [r for r in scored if r['label'] == 'bona_fide']; at = [r for r in scored if r['label'] != 'bona_fide']
        out[f'{k}={v}'] = ({'status': 'INSUFFICIENT_DATA', 'scored': len(scored)} if len(scored) < min_n else
                           {'status': 'MEASURED', 'bpcer': rate(sum(r['score'] < threshold for r in bf), len(bf)),
                            'apcer_all_attacks': rate(sum(r['score'] >= threshold for r in at), len(at)),
                            'failure_to_acquire': rate(sum(r['outcome'] in ACQUISITION_FAILURES for r in g), len(g))})
    return out


def identity_metrics(rows, threshold, minimums):
    g = [r for r in rows if r['task'] == 'identity' and r['label'] == 'genuine']
    i = [r for r in rows if r['task'] == 'identity' and r['label'] == 'impostor']
    gs, is_ = [r for r in g if r['outcome'] == 'SCORED'], [r for r in i if r['outcome'] == 'SCORED']
    hist = lambda rs: dict(Counter(f'{math.floor(r["score"] * 20) / 20:.2f}' for r in rs))
    out = {'threshold': threshold,
           'fmr': rate(sum(r['score'] >= threshold for r in is_), len(is_)),
           'fnmr': rate(sum(r['score'] < threshold for r in gs), len(gs)),
           'quality_rejection': rate(sum(r['outcome'] in ACQUISITION_FAILURES for r in g + i), len(g + i)),
           'technical_failure': rate(sum(r['outcome'] in TECHNICAL_FAILURES for r in g + i), len(g + i)),
           'genuine_score_histogram': hist(gs), 'impostor_score_histogram': hist(is_), 'blocked': []}
    lat = [r['end_to_end_ms'] for r in g + i if r.get('end_to_end_ms') is not None]
    out['verification_latency_ms'] = {'n': len(lat), 'p50': percentile(lat, .5), 'p95': percentile(lat, .95)}
    if len(gs) < minimums['genuine_pairs']:
        out['blocked'].append(f'genuine:scored {len(gs)} < {minimums["genuine_pairs"]}')
    if len(is_) < minimums['impostor_pairs']:
        out['blocked'].append(f'impostor:scored {len(is_)} < {minimums["impostor_pairs"]}')
    return out


def select_threshold(rows, task, target):
    """Lowest threshold whose calibration error on the security side is <= target.
    PAD: max APCER over attack types (real-score >= t accepted). Identity: FMR."""
    if task == 'pad':
        negatives = {a: [r['score'] for r in rows if r['task'] == 'pad' and r['label'] == a and r['outcome'] == 'SCORED'] for a in ATTACKS}
        if any(not v for v in negatives.values()):
            return None
        # Candidates sit just above each negative score (accept iff score >= t), plus the lower bound.
        candidates = sorted({math.nextafter(x, math.inf) for v in negatives.values() for x in v} | {0.0})
        err = lambda t: max(sum(x >= t for x in v) / len(v) for v in negatives.values())
    else:
        imp = [r['score'] for r in rows if r['task'] == 'identity' and r['label'] == 'impostor' and r['outcome'] == 'SCORED']
        if not imp:
            return None
        candidates = sorted({math.nextafter(x, math.inf) for x in imp} | {-1.0})
        err = lambda t: sum(x >= t for x in imp) / len(imp)
    for t in candidates:
        if err(t) <= target:
            return t
    return None


def calibrate_and_evaluate(trials, manifest, targets, minimums=None):
    minimums = {**DEFAULT_MINIMUMS, **(minimums or {})}
    subjects = validate_manifest(manifest)
    man = {e['sample_id']: e for e in manifest}
    validate_trials(trials, set(man))
    split = defaultdict(list)
    for r in trials:
        split[_split_of(r, man)].append(r)
    report = {'procedure': 'select-on-calibration, evaluate-on-subject-disjoint-evaluation',
              'subjects_per_split': subjects, 'trials_per_split': {s: len(split[s]) for s in SPLITS}, 'blocked': []}
    for s in SPLITS:
        if subjects[s] < minimums['subjects_per_split']:
            report['blocked'].append(f'{s}:subjects {subjects[s]} < {minimums["subjects_per_split"]}')
    for task, key in (('pad', 'pad_max_apcer'), ('identity', 'identity_max_fmr')):
        t = select_threshold(split['calibration'], task, targets[key])
        report[f'{task}_threshold'] = t
        if t is None:
            report['blocked'].append(f'{task}:no calibration data to select threshold')
    pad_t, id_t = report['pad_threshold'], report['identity_threshold']
    if pad_t is not None:
        report['pad'] = pad_metrics(split['evaluation'], pad_t, man, minimums)
        report['blocked'] += [f'pad.{b}' for b in report['pad']['blocked']]
    if id_t is not None:
        report['identity'] = identity_metrics(split['evaluation'], id_t, minimums)
        report['blocked'] += [f'identity.{b}' for b in report['identity']['blocked']]
    report['status'] = 'BLOCKED_DATA' if report['blocked'] else 'EVALUATED_NOT_APPROVED'
    return report


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--trials', required=True); p.add_argument('--manifest', required=True)
    p.add_argument('--protocol', required=True); p.add_argument('--out', required=True)
    a = p.parse_args()
    protocol = json.loads(Path(a.protocol).read_text())
    if protocol.get('approved') is not True or not protocol.get('approval_reference'):
        raise SystemExit('Approved protocol required; this tool does not authorize data collection')
    trials = [json.loads(l) for l in Path(a.trials).read_text().splitlines() if l.strip()]
    manifest = json.loads(Path(a.manifest).read_text())
    rep = calibrate_and_evaluate(trials, manifest, protocol['targets'], protocol.get('minimums'))
    rep['inputs_sha256'] = {k: hashlib.sha256(Path(v).read_bytes()).hexdigest() for k, v in (('trials', a.trials), ('manifest', a.manifest), ('protocol', a.protocol))}
    with open(a.out, 'x') as f:
        json.dump(rep, f, indent=2, allow_nan=False); f.write('\n')
    print(json.dumps({'status': rep['status'], 'blocked': len(rep['blocked'])}))
