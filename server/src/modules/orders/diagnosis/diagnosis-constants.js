export const STATUS = {
  SUGGESTED: 'suggested',
  NEEDS_MORE_INFO: 'needs_more_info',
  MANUAL_SELECTION: 'manual_selection',
  UNAVAILABLE: 'unavailable',
};

export const DECISION_SOURCE = {
  MODEL: 'model',
  RULES: 'rules',
  MANUAL: 'manual',
  UNAVAILABLE: 'unavailable',
};

export const REASON_CODES = {
  CATEGORY_REQUIRED: 'category_required',
  CATEGORY_DETECTED: 'category_detected',
  TARGET_IDENTIFIED: 'target_candidate_identified',
  TARGET_CONFIRMED: 'target_confirmed',
  SYMPTOM_REQUIRED: 'symptom_required',
  SYMPTOM_CONFIRMED: 'symptom_confirmed',
  CUSTOMER_SELECTED: 'customer_selected',
  IMAGE_UNCERTAIN: 'image_uncertain',
  AI_UNAVAILABLE: 'ai_unavailable',
  NO_ACTIVE_SERVICE: 'no_active_service_match',
};

export const MODEL_VERSION = 'fixgo-ai-rec-v1';
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.6;
