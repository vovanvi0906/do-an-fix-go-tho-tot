-- DESTRUCTIVE: disposable test database ONLY. Production rollback is disable/retain.
DROP TABLE biometric_audits;
DROP TABLE biometric_proofs;
DROP TABLE biometric_sessions;
DROP TABLE biometric_templates;
DROP FUNCTION biometric_template_immutable();
DROP TABLE biometric_reviews;
DROP TABLE biometric_states;
