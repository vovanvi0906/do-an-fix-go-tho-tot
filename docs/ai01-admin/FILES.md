# Danh sách file AI-ADMIN-01

Chỉ danh sách dưới đây thuộc task này. Các thư mục lab đã bị xóa và các artifact TASK 01/03A/03B/03C có sẵn trong working tree trước task không được sửa/khôi phục/xóa bởi task này. Không commit/push.

| File | Thay đổi |
|---|---|
| `client/src/components/layout/Sidebar.jsx` | Sửa |
| `client/src/layouts/AdminLayout.jsx` | Sửa |
| `client/src/pages/ai01-review/Ai01ReviewPage.jsx` | Thêm |
| `client/src/pages/ai01-review/components/ImageReview.jsx` | Thêm |
| `client/src/pages/ai01-review/components/LabelForm.jsx` | Thêm |
| `client/src/pages/ai01-review/components/MappingReview.jsx` | Thêm |
| `client/src/pages/ai01-review/components/PermissionReview.jsx` | Thêm |
| `client/src/pages/ai01-review/components/ReviewPanel.jsx` | Thêm |
| `client/src/pages/ai01-review/components/SourceReview.jsx` | Thêm |
| `client/src/pages/ai01-review/constants.js` | Thêm |
| `client/src/routers/menuConfig.js` | Sửa |
| `client/src/routers/routes.jsx` | Sửa |
| `client/src/services/ai01ReviewService.js` | Thêm |
| `server/config/ai01-review.example.json` | Thêm |
| `server/scripts/ai01/review_bridge.py` | Thêm |
| `server/scripts/ai01/verify_integrity.py` | Thêm |
| `server/src/app.module.js` | Sửa |
| `server/src/modules/ai01-review/ai01-auth-configuration.guard.js` | Thêm |
| `server/src/modules/ai01-review/ai01-permissions.controller.js` | Thêm |
| `server/src/modules/ai01-review/ai01-permissions.service.js` | Thêm |
| `server/src/modules/ai01-review/ai01-policy.js` | Thêm |
| `server/src/modules/ai01-review/ai01-review.controller.js` | Thêm |
| `server/src/modules/ai01-review/ai01-review.module.js` | Thêm |
| `server/src/modules/ai01-review/ai01-review.service.js` | Thêm |
| `server/src/modules/ai01-review/dto/ai01-permission.dto.js` | Thêm |
| `server/src/modules/ai01-review/dto/review-action.dto.js` | Thêm |
| `server/src/modules/ai01-review/review-engine.js` | Thêm |
| `server/test/ai01-admin-harness.cjs` | Thêm |
| `server/test/ai01-admin.e2e-spec.js` | Thêm |
| `server/test/check-ai01-admin-ui.cjs` | Thêm |
| `server/test/jest-ai01-admin.config.cjs` | Thêm |

Tài liệu và bằng chứng mới nằm trong docs/ai01-admin/: README.md, USER-GUIDE.md, environment.example, TEST-RESULTS.md, danh sách/hash file và evidence/*. Các build dist là artifact sinh bởi kiểm tra build, không đổi source production inference hoặc catalog.
