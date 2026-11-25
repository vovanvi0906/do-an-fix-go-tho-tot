"""Annotation contract. Null = unannotated; [] = reviewed absence."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid')


class Labels(Strict):
    category: str | None
    target: str | None
    visibleFault: list[str] | None
    symptom: list[str] | None
    recommendedService: list[str] | None
    unknown: bool | None
    needsInspection: bool | None


class Provenance(Strict):
    origin: Literal['field_photo', 'licensed_external', 'synthetic', 'unverified']
    source: str
    licenseOrConsent: str
    capturedAt: str | None
    deviceId: str | None
    sessionId: str | None
    siteId: str | None
    duplicateGroup: str | None


class Answers(Strict):
    categoryId: str | None = None
    targetId: str | None = None
    symptom: str | None = None
    symptomId: str | None = None
    symptomIds: list[str] | None = None
    # serviceId intentionally excluded: answer would give away service truth.


class Observation(Strict):
    text: str
    confirmedAnswers: Answers = Field(default_factory=Answers)


class Review(Strict):
    status: Literal['unverified', 'double_reviewed', 'adjudicated']
    annotatorIds: list[str]
    adjudicatorId: str | None
    annotatedAt: str | None
    evidence: str


class Sample(Strict):
    id: str = Field(min_length=1)
    image: str = Field(min_length=1)
    sha256: str = Field(pattern=r'^[0-9a-f]{64}$')
    split: Literal['train', 'validation', 'test', 'quarantine', 'smoke']
    provenance: Provenance
    observation: Observation
    labels: Labels
    review: Review


if __name__ == '__main__':
    import json
    print(json.dumps(Sample.model_json_schema(), ensure_ascii=False, indent=2))
