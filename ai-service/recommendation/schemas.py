from typing import List, Optional, Literal
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


class VisualDetection(BaseModel):
    id: str
    kind: Literal['object', 'sign']
    categorySlug: str
    targetSlug: str
    code: str
    confidence: float = Field(ge=0, le=1)
    xyxy: List[float]
    objectId: Optional[str] = None


class VisualAnalysis(BaseModel):
    status: Literal['disabled', 'unavailable', 'no_evidence', 'detected'] = 'disabled'
    modelVersion: Optional[str] = None
    weightsSha256: Optional[str] = None
    detections: List[VisualDetection] = Field(default_factory=list)


class ObservableProposal(BaseModel):
    code: str
    name: str
    definition: str
    confidence: float = Field(ge=0, le=1)
    xyxy: List[float]
    objectId: Optional[str] = None
    modelId: Optional[str] = None
    geometryType: Literal['visible_region', 'device_context'] = 'visible_region'
    relatedServiceGroups: List[str] = Field(default_factory=list)


class ObservableModel(BaseModel):
    id: str
    weightsSha256: str


class ObservableCoverage(BaseModel):
    categorySlug: str
    status: Literal['experimental_sign_proposals', 'no_domain_dataset']
    signCodes: List[str] = Field(default_factory=list)
    availableSignCodes: List[str] = Field(default_factory=list)
    unavailableSignCodes: List[str] = Field(default_factory=list)


class ObservableUnavailableSign(BaseModel):
    code: str
    name: str
    reason: Literal['insufficient_development_quality']


class ObservableAnalysis(BaseModel):
    status: Literal['disabled', 'unavailable', 'no_detection', 'proposed'] = 'disabled'
    labelStatus: Literal['AI_UNVERIFIED'] = 'AI_UNVERIFIED'
    modelSha256: Optional[str] = None
    proposals: List[ObservableProposal] = Field(default_factory=list)
    absenceMeans: Literal['NOT_DETECTED_DOES_NOT_MEAN_NORMAL'] = 'NOT_DETECTED_DOES_NOT_MEAN_NORMAL'
    scoreType: Optional[Literal['UNCALIBRATED_DETECTOR_SCORE']] = None
    modelVersion: Optional[str] = None
    releaseSha256: Optional[str] = None
    models: List[ObservableModel] = Field(default_factory=list)
    coverage: List[ObservableCoverage] = Field(default_factory=list)
    degradedModels: List[str] = Field(default_factory=list)
    qualityStatus: Optional[Literal['PILOT_AI_UNVERIFIED']] = None
    contextStatus: Optional[Literal['unsupported_category', 'category_scoped', 'unscoped']] = None
    suppressedCount: int = Field(default=0, ge=0)
    unavailableSigns: List[ObservableUnavailableSign] = Field(default_factory=list)
    evaluationStatus: Literal['development_only', 'limited_scope_evaluated'] = 'development_only'
    evaluationSampleCount: int = Field(default=0, ge=0)


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
    visualAnalysis: VisualAnalysis = Field(default_factory=VisualAnalysis)
    observableAnalysis: ObservableAnalysis = Field(default_factory=ObservableAnalysis)
    decision_source: str = "unavailable"
    engine: str = "unavailable"
    model_version: str = "fixgo-ai-rec-v1"
    notes: str = ""


class CatalogSyncResponse(BaseModel):
    status: str
    version: str
    categoryCount: int
    targetCount: int
