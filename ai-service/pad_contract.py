"""PAD extension boundary. No evaluated provider is currently enabled."""
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class PadEvidence:
    decision: str
    model_version: str | None = None
    error_code: str | None = None

    def __post_init__(self):
        if self.decision not in ('PASS', 'FAIL', 'NOT_EVALUATED', 'INCONCLUSIVE'):
            raise ValueError('INVALID_PAD_DECISION')
        if self.decision in ('PASS', 'FAIL') and not self.model_version:
            raise ValueError('PAD_MODEL_PROVENANCE_REQUIRED')


class PadProvider(Protocol):
    def assess(self, capture) -> PadEvidence: ...


class UnavailablePad:
    def assess(self, capture) -> PadEvidence:
        return PadEvidence('NOT_EVALUATED', error_code='PAD_PROVIDER_NOT_APPROVED')
