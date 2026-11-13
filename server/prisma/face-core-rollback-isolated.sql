-- DESTRUCTIVE: disposable test database ONLY. Production rollback is disable/retain.
DROP TABLE biometric_audits;
DROP TABLE biometric_proofs;
DROP TABLE biometric_sessions;
DROP TABLE biometric_templates;
DROP FUNCTION biometric_template_immutable();
DROP TABLE biometric_reviews;
DROP TABLE biometric_states;

DROP FUNCTION IF EXISTS biometric_validate_review();
DROP FUNCTION IF EXISTS biometric_validate_template_insert();
DROP FUNCTION IF EXISTS biometric_session_immutable();
DROP FUNCTION IF EXISTS biometric_proof_guard();
DROP FUNCTION IF EXISTS biometric_state_monotonic();
DROP INDEX IF EXISTS biometric_worker_identity_key;

DROP FUNCTION IF EXISTS biometric_validate_session_insert();
