# Face ID implementation handoff

This branch provides a tested fail-closed foundation, not an operational biometric
identity system. No enrollment, daily or order proof can be issued until the explicit
approval blockers are resolved. Legacy timestamps do not authorize online/start work.

- [Status matrix and approvals](limitations-and-blockers.md)
- [Architecture and hotfix reconciliation](architecture.md)
- [API contracts and environment setup](api-contracts.md)
- [Enrollment and encrypted template design](enrollment-design.md)
- [1:1 verification algorithm](verification-design.md)
- [Daily/order proof design](proof-design.md)
- [Database proposal and rollout/rollback](database-proposal.md)
- [PAD sources, license/dependency review and evaluation plan](pad-evaluation.md)
- [Threat model](security-threat-model.md)
- [Executed tests and remaining validation](test-report.md)
- [Worker usage and Android QA checklist](android-qa-checklist.md)
- [Audit synchronization SHA-256 manifest](audit-sync-sha256.json)

No database changes, model downloads, real biometric collection or automatic branch
integration were performed. Customer AI Recommendation code remains outside this work.
