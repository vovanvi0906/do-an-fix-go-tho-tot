from typing import List, Optional
from pydantic import BaseModel, Field


class CategoryCandidate(BaseModel):
    id: str
    slug: str
    name: str
    confidence: float
    provenance: str = "ensemble"


class TargetCandidate(BaseModel):
    targetId: str
    targetName: str
    targetCategory: str
    similarity: float
    confidence: float
    provenance: str = "clip_target_similarity"


class DiagnosisV2Request(BaseModel):
    imageUrl: Optional[str] = None
    description: Optional[str] = ""


class DiagnosisV2Response(BaseModel):
    suggestedCategoryId: Optional[str] = None
    suggestedCategoryName: Optional[str] = None
    suggestedTargetId: Optional[str] = None
    suggestedTargetName: Optional[str] = None
    categoryCandidates: List[CategoryCandidate] = Field(default_factory=list)
    targetCandidates: List[TargetCandidate] = Field(default_factory=list)
    confidence: Optional[float] = None
    detectedLabels: List[str] = Field(default_factory=list)
    observableSigns: List[str] = Field(default_factory=list)
    decision_source: str = "unavailable"
    engine: str = "unavailable"
    model_version: str = "fixgo-ai-rec-v1"
    notes: str = ""


class CatalogSyncResponse(BaseModel):
    status: str
    version: str
    categoryCount: int
    targetCount: int
