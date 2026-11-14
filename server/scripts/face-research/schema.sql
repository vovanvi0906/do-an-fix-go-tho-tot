-- Disposable research database ONLY. Not a project Prisma migration.
CREATE SCHEMA face_research;
CREATE TABLE face_research.environment (id text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TABLE face_research.sessions (
 id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 worker_id text NOT NULL REFERENCES worker_profiles(id) ON DELETE RESTRICT,
 purpose text NOT NULL CHECK(purpose IN ('ENROLLMENT','DAILY','ORDER')),
 order_id text REFERENCES orders(id) ON DELETE RESTRICT,
 request_key text NOT NULL, nonce_hash text NOT NULL,
 model_version text NOT NULL, pad_version text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), expires_at timestamptz NOT NULL,
 state text NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','PROCESSING','DONE','REVOKED')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3),
 claim_id text, capture_digest text, result jsonb,
 CHECK ((purpose='ORDER' AND order_id IS NOT NULL) OR (purpose<>'ORDER' AND order_id IS NULL)),
 UNIQUE(worker_id,request_key)
);
CREATE INDEX research_sessions_worker_created ON face_research.sessions(worker_id,created_at);
