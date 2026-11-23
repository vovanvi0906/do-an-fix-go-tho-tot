"""Metrics from fresh outputs only. Errors stay in denominators, not abstentions."""
import math


def ratio(a, b):
    return a / b if b else None


def percentile(values, q):
    if not values:
        return None
    s = sorted(values)
    x = (len(s)-1)*q
    lo = math.floor(x)
    return s[lo] + (s[math.ceil(x)]-s[lo])*(x-lo)


def classification(pairs):
    classes = sorted({truth for truth, _ in pairs})
    per_class = {}
    for label in classes:
        tp = sum(t == label and p == label for t, p in pairs)
        fp = sum(t != label and p == label for t, p in pairs)
        fn = sum(t == label and p != label for t, p in pairs)
        per_class[label] = {'support': sum(t == label for t, _ in pairs),
                            'precision': ratio(tp, tp+fp), 'recall': ratio(tp, tp+fn),
                            'f1': ratio(2*tp, 2*tp+fp+fn)}
    return {'n': len(pairs), 'top1': ratio(sum(t == p for t, p in pairs), len(pairs)),
            'macroF1': ratio(sum(x['f1'] or 0 for x in per_class.values()), len(classes)),
            'perClass': per_class}


def summarize(records, catalog):
    slug = {r['id']: r['slug'] for key in ('categories', 'targets', 'services') for r in catalog[key]}
    canonical = lambda x: slug.get(x, x)
    result = {}
    for mode in sorted({r['modality'] for r in records}):
        rows = [r for r in records if r['modality'] == mode and r['scorable']]
        if not rows:
            result[mode] = {'n': 0, 'qualityMetrics': None, 'reason': 'no reviewed independent ground truth'}
            continue
        out = {'n': len(rows), 'errorRate': ratio(sum(bool(r.get('error')) for r in rows), len(rows))}
        for label, suggested, candidates, idkey in (
            ('category', 'suggestedCategoryId', 'categoryCandidates', 'id'),
            ('target', 'suggestedTargetId', 'targetCandidates', 'targetId')):
            pairs, hit3 = [], 0
            for r in rows:
                truth = r['groundTruth'][label]
                if truth is None:
                    continue
                pred = r.get('prediction', {})
                # Final resolver acceptance is reported separately from raw candidate retrieval.
                pairs.append((canonical(truth), canonical(pred.get(suggested))))
                hit3 += canonical(truth) in [canonical(c[idkey]) for c in pred.get(candidates, [])[:3]]
            out[label] = {**classification(pairs), 'top3': ratio(hit3, len(pairs))}
        success = [r for r in rows if not r.get('error')]
        accepted = [r for r in success if r.get('resolver', {}).get('suggestedCategoryId')]
        final_pairs = [(canonical(r['groundTruth']['category']), canonical(r.get('resolver', {}).get('suggestedCategoryId')))
                       for r in rows if r['groundTruth']['category'] is not None]
        out['resolverCategory'] = classification(final_pairs)
        out['acceptedCategoryAccuracy'] = ratio(sum(t == p for t, p in final_pairs if p is not None),
                                                sum(p is not None for _, p in final_pairs))
        out['categoryCoverage'] = ratio(len(accepted), len(rows))
        out['categoryAbstentionRate'] = ratio(sum(not r.get('resolver', {}).get('suggestedCategoryId') for r in success), len(rows))
        for stage in ('resolver', 'assistedResolver'):
            eligible = [r for r in rows if r['groundTruth']['recommendedService'] is not None
                        and (stage == 'resolver' or r.get('hasConfirmedAnswers'))]
            emitted, false, hit1, hit3 = 0, 0, 0, 0
            for r in eligible:
                res = r.get(stage, {})
                ids = [x['id'] for x in res.get('suggestedServices', [])]
                if not ids and res.get('suggestedServiceId'):
                    ids = [res['suggestedServiceId']]
                ids = [canonical(x) for x in ids]
                truth = {canonical(x) for x in r['groundTruth']['recommendedService']}
                emitted += bool(ids)
                false += bool(ids) and (r['groundTruth']['unknown'] is True or
                          r['groundTruth']['needsInspection'] is True or any(x not in truth for x in ids[:3]))
                hit1 += bool(ids) and ids[0] in truth
                hit3 += bool(truth.intersection(ids[:3]))
            out[stage+'Service'] = {'n': len(eligible), 'top1': ratio(hit1, len(eligible)),
                'top3': ratio(hit3, len(eligible)), 'coverage': ratio(emitted, len(eligible)),
                'falseRecommendationPerCase': ratio(false, len(eligible)),
                'falseRecommendationPerEmission': ratio(false, emitted)}
        out['latencyMs'] = {key: {'n': len(v := [r[key] for r in rows if key in r]),
                                'p50': percentile(v, .5), 'p95': percentile(v, .95)}
                            for key in ('inferenceMs', 'resolverMs', 'totalMs')}
        out['unknownCases'] = sum(r['groundTruth']['unknown'] is True for r in rows)
        out['needsInspectionCases'] = sum(r['groundTruth']['needsInspection'] is True for r in rows)
        out['visibleFault'] = out['symptom'] = {'metric': None, 'reason': 'production model has no fault/symptom predictions'}
        result[mode] = out
    a, b = result.get('image+text', {}), result.get('text-only', {})
    result['pairedAblation'] = {'comparison': 'image+text minus text-only on same cases; text branch is keyword heuristic',
        'categoryTop1Delta': (a['category']['top1']-b['category']['top1'])
            if a.get('category', {}).get('top1') is not None and b.get('category', {}).get('top1') is not None else None,
        'interpretation': 'requires nonempty original user descriptions; no causal image claim from smoke or empty text'}
    return result
