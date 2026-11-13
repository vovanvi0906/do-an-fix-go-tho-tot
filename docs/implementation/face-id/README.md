# Face Core — migration hardening and real-model handoff

See the latest [migration audit](migration-review-v3.md), [real-model integration](real-model-integration.md), [v3 tests](test-report-v3.md) and [read-only schema reconciliation plan](schema-reconciliation-plan.md).

Durable backend enrollment and daily/order proof run end-to-end on disposable
PostgreSQL/Nest HTTP with synthetic evidence. Runtime capture remains blocked until
PAD and real-data policies are approved. No fake success flag/provider is shipped. Existing official YuNet/SFace artifacts now have a pinned loader and real HTTP negative smoke; this does not establish real-face/PAD accuracy.

- [Current status, remaining blockers and approvals](limitations-and-blockers.md)
- [v2 executed tests and isolation boundaries](test-report-v2.md)
- [Additive schema diff, compatibility and rollback](schema-diff-v2.md)
- [Current API contracts](api-contracts.md)
- [Enrollment/consent/encryption/deletion](enrollment-design.md)
- [Durable daily/order sessions and atomic proof consumption](proof-design.md)
- [Experimental configuration](experimental-env.example)
- [PAD exact artifact/download experiment proposal](pad-download-proposal.md)
- [PAD evaluation protocol](pad-evaluation.md)
- [Android checklist](android-qa-checklist.md)

Run isolated backend integration: `node server/test/face/run-isolated.cjs`.
It provisions and removes its own PostgreSQL/PostGIS container and never uses the project DB.

Historical v1 references: architecture.md, database-proposal.md, test-report.md and
security-threat-model.md document the f6737fd fail-closed baseline; current behavior is
in the v2 documents above. The original 34-file audit SHA-256 manifest remains intact.
