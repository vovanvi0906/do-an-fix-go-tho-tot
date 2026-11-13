# 1:1 verification — PARTIAL

YuNet → exactly one face → size/crop + brightness + Laplacian sharpness → SFace
alignCrop → finite 128-dimensional feature → cosine against backend-selected template.
Invalid dimensions, nonfinite/zero embeddings, nonfinite/out-of-range scores, missing
models and version mismatch never match. Output distinguishes inconclusive/technical error.
Shared detector and recognizer are serialized with a process-local lock and offloaded
from ASGI event loop. Model hashes correspond to loaded YuNet/SFace weight files.

Size 80px, brightness 40..220 and sharpness 60 are conservative engineering defaults,
NOT evaluated acceptance criteria. Pose/occlusion and camera provenance are not established.
Cannot claim full quality assurance or identity accuracy until authorized evaluation.
Templates must use the same model artifact hash as the loaded matcher; changing model
requires reviewed migration/re-enrollment, not silent recomputation from an avatar.

No actual weights downloaded, no real face inferred, no database touched. Production
MATCH cannot become proof while PAD=NOT_EVALUATED, template provenance or session
persistence are unavailable. Internal token alone does not establish capture freshness.
