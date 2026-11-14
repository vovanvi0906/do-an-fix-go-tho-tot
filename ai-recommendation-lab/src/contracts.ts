export type Entity = {
  id: string;
  name: string;
  slug?: string;
  categoryId?: string;
  targetId?: string;
  isActive?: boolean;
};
export type Service = Entity & {
  basePrice?: number | null;
  maxPrice?: number | null;
  unit?: string;
  reason?: string;
  provenance?: string;
  symptomIds?: string[];
};
export type Symptom = Entity & {
  code: string;
  kind: string;
  reviewStatus?: string;
};
export type Candidate = {
  id?: string;
  slug?: string;
  name?: string;
  targetId?: string;
  targetName?: string;
  confidence?: number;
  similarity?: number;
  provenance?: string;
};
export type ModelResult = {
  engine: string;
  confidence?: number | null;
  model_version?: string;
  suggestedCategoryId?: string | null;
  suggestedTargetId?: string | null;
  decision_source?: string;
  categoryCandidates?: Candidate[];
  targetCandidates?: Candidate[];
  clip_probs?: Record<string, number> | null;
  all_probs?: Record<string, number> | null;
  notes?: string;
};
export type Diagnosis = {
  requestId: string;
  status: string;
  imageUrl: string;
  category: Entity | null;
  target: Entity | null;
  suggestedCategoryId?: string | null;
  suggestedTargetId?: string | null;
  modelVersion?: string;
  confidence?: number | null;
  availableCategories: Entity[];
  availableTargets: Entity[];
  suggestedServices: Service[];
  symptomCatalogEnabled?: boolean;
  reasonCodes?: string[];
  message?: string;
};
export function diagnosisContract(value: unknown): Diagnosis {
  const v = value as Diagnosis;
  if (
    !v ||
    ![
      "suggested",
      "needs_more_info",
      "manual_selection",
      "unavailable",
    ].includes(v.status) ||
    typeof v.imageUrl !== "string" ||
    !Array.isArray(v.availableCategories) ||
    !Array.isArray(v.availableTargets) ||
    !Array.isArray(v.suggestedServices)
  )
    throw new Error("DIAGNOSIS_CONTRACT_INVALID");
  return v;
}
export function modelContract(value: unknown): ModelResult {
  const v = value as ModelResult;
  if (
    !v ||
    !["model", "unavailable"].includes(v.engine) ||
    !Array.isArray(v.categoryCandidates) ||
    !Array.isArray(v.targetCandidates)
  )
    throw new Error("MODEL_CONTRACT_INVALID");
  return v;
}
export function approvedSymptoms(
  items: Symptom[],
  targetId: string,
): Symptom[] {
  if (!Array.isArray(items)) throw new Error("SYMPTOM_CONTRACT_INVALID");
  // Public endpoint guarantees APPROVED/active; reject explicit contradictory metadata.
  if (
    items.some(
      (s) =>
        s.targetId !== targetId ||
        s.isActive === false ||
        (s.reviewStatus !== undefined && s.reviewStatus !== "APPROVED"),
    )
  )
    throw new Error("SYMPTOM_NOT_AVAILABLE");
  return items;
}
export function validServices(
  items: Service[],
  categoryId: string,
  targetId: string,
  symptomIds: string[],
): Service[] {
  if (
    !Array.isArray(items) ||
    items.length > 3 ||
    new Set(items.map((s) => s.id)).size !== items.length ||
    items.some(
      (s) =>
        !s.id ||
        s.categoryId !== categoryId ||
        s.targetId !== targetId ||
        s.isActive !== true ||
        s.provenance !== "confirmed_symptom_catalog" ||
        !s.symptomIds?.some((id) => symptomIds.includes(id)),
    )
  )
    throw new Error("INVALID_SERVICE_RECOMMENDATION");
  return items;
}

export type DebugReport = {
  result: ModelResult;
  debug: {
    requestId: string;
    stagesMs: Record<string, number>;
    stageOutcomes?: Record<string, string>;
    clipScores?: Record<string, number>;
    yoloScores?: Record<string, number>;
    gates: {
      categoryMinConfidence: number;
      categoryMinMargin: number;
      categoryAccepted: boolean;
      confidence: number | null;
      targetMinSimilarity: number;
      targetAccepted: boolean;
    };
    model: Record<string, unknown>;
    catalog: Record<string, unknown>;
    modelsLoaded?: Record<string, boolean>;
  };
  backend: {
    requestId: string;
    confidenceThreshold: number;
    thresholdSource: string;
    categoryThresholdPassed: boolean;
    aiHttpElapsedMs: number;
  };
};
