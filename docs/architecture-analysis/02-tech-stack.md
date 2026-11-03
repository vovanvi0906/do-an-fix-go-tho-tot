# Tech stack và configuration

## Mục lục

- [Stack đã xác nhận](#stack-đã-xác-nhận)
- [Runtime và package management](#runtime-và-package-management)
- [Config và integrations](#config-và-integrations)
- [Build và vận hành](#build-và-vận-hành)

## Stack đã xác nhận

Phiên bản sau là **range khai báo manifest**, không phải phiên bản installed/runtime đã xác minh.

| Thành phần | Stack | Evidence |
|---|---|---|
| Backend | JavaScript ES modules/decorators, NestJS 11, Express platform, Babel 7 | [doan-kltn-backend/package.json:1](../../doan-kltn-backend/package.json#L1) — `dependencies và scripts`, [doan-kltn-backend/.babelrc:1](../../doan-kltn-backend/.babelrc#L1) — `Babel configuration` |
| Persistence | PostgreSQL provider, Prisma client/CLI 6.19.x, PostGIS/btree_gist schema extensions | [doan-kltn-backend/prisma/schema.prisma:1](../../doan-kltn-backend/prisma/schema.prisma#L1) — `generator và datasource` |
| Data containers | PostgreSQL 16 + PostGIS 3.4 image; Redis 7 Alpine | [docker-compose.yml:4](../../docker-compose.yml#L4) — `postgres và redis services` |
| Queue / events | BullMQ 6.x, ioredis 6.x, Socket.IO 4.x | [doan-kltn-backend/package.json:1](../../doan-kltn-backend/package.json#L1) — `dependencies`, [doan-kltn-backend/src/modules/orders/order-queue.service.js:7](../../doan-kltn-backend/src/modules/orders/order-queue.service.js#L7) — `Queue/Worker import` |
| Web | React 18.3, Vite 5.4, React Router 7, Tailwind 4, Axios, Zustand, Recharts, Framer Motion | [doan-kttn-frontend/package.json:1](../../doan-kttn-frontend/package.json#L1) — `dependencies`, [doan-kttn-frontend/vite.config.js:7](../../doan-kttn-frontend/vite.config.js#L7) — `defineConfig` |
| Mobile | React Native 0.76.9, Expo 52, Expo Router 4, React 18.3, JS/JSX và TS/TSX, Axios, Zustand | [doan-kltn-mobile/package.json:1](../../doan-kltn-mobile/package.json#L1) — `dependencies và entry` |
| Mobile server-state library | TanStack React Query 5, có `useQuery/useMutation` trong order screens; provider chưa tìm thấy | [doan-kltn-mobile/src/screens/order/SearchingScreen.jsx:181](../../doan-kltn-mobile/src/screens/order/SearchingScreen.jsx#L181) — `useQuery`, [doan-kltn-mobile/app/_layout.jsx:16](../../doan-kltn-mobile/app/_layout.jsx#L16) — `RootLayout` |
| AI | Python, FastAPI/Pydantic 2/Uvicorn, NumPy/OpenCV, Ultralytics YOLO, transformers/Pillow; torch CPU ở Docker | [ai-service/requirements.txt:1](../../ai-service/requirements.txt#L1) — `requirements`, [ai-service/Dockerfile:21](../../ai-service/Dockerfile#L21) — `pip installation` |
| Auth | Passport JWT, bcrypt, Google Auth, Firebase Admin; client Firebase/Google sign-in | [doan-kltn-backend/src/modules/auth/auth.service.js:8](../../doan-kltn-backend/src/modules/auth/auth.service.js#L8) — `imports`, [doan-kltn-backend/src/modules/auth/strategies/jwt.strategy.js:6](../../doan-kltn-backend/src/modules/auth/strategies/jwt.strategy.js#L6) — `JwtStrategy` |
| Upload | Multer, Cloudinary storage adapter | [doan-kltn-backend/src/modules/orders/orders.controller.js:74](../../doan-kltn-backend/src/modules/orders/orders.controller.js#L74) — `diagnoseUpload`, [doan-kltn-backend/src/config/cloudinary.config.js:29](../../doan-kltn-backend/src/config/cloudinary.config.js#L29) — `incidentStorage` |
| Testing | Backend Jest 29/Babel-Jest/Nest testing/Supertest declared; mobile Jest 30/jest-expo/testing-library | [doan-kltn-backend/package.json:1](../../doan-kltn-backend/package.json#L1) — `jest`, [doan-kltn-mobile/package.json:1](../../doan-kltn-mobile/package.json#L1) — `jest` |

GraphQL, gRPC, Kafka/RabbitMQ, Elasticsearch, separate API gateway product: **NOT FOUND** trong manifests và runtime source đã inventory. Redis được dùng cho OTP/queue/subscription, không đủ bằng chứng về generic response caching.

## Runtime và package management

- **CONFIRMED:** npm script/lockfile tách biệt ba app; Python `requirements.txt` dùng minimum bounds `>=`, chưa có Python lockfile trong inventory. Không chạy npm/pip để xác định dependency tree thực tế.
- Backend Babel target `node: current`, manifest không pin engine. README nhắc Node 24 nhưng hướng dẫn khác lại 18/20/22; workflow tham khảo dùng 20. **NOT VERIFIED** Node deployed. [doan-kltn-backend/.babelrc:6](../../doan-kltn-backend/.babelrc#L6) — `targets.node`, [README.md:1](../../README.md#L1) — `runtime documentation`, [.agents/workflows/backend-ci.yml:25](../../.agents/workflows/backend-ci.yml#L25) — `setup-node`.
- Docker AI pin base `python:3.10-slim`; README ghi 3.13, workflow tham khảo 3.11. Chỉ Docker base là config runnable xác nhận được; không tuyên bố runtime host là 3.13. [ai-service/Dockerfile:1](../../ai-service/Dockerfile#L1) — `FROM`.
- `dotenv/config` được import trong bootstrap nhưng backend không khai báo trực tiếp `dotenv` ở dependencies. **INFERRED:** phụ thuộc transitive resolution; build/runtime sạch **NOT VERIFIED**. [doan-kltn-backend/src/main.js:2](../../doan-kltn-backend/src/main.js#L2) — `dotenv import`, [doan-kltn-backend/package.json:1](../../doan-kltn-backend/package.json#L1) — `dependencies`.

## Config và integrations

| Nhóm | Tên biến được tham chiếu, không có giá trị | Consumer |
|---|---|---|
| API | `PORT`, `DATABASE_URL` | `bootstrap`, Prisma datasource |
| JWT | `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | AuthModule/AuthService/JwtStrategy |
| Redis | `REDIS_URL`; queue riêng dùng `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | RedisService và OrderQueueService |
| AI | `AI_SERVICE_URL`, `FASTAPI_AI_URL`, `AI_CONFIDENCE_THRESHOLD` | FastApiAiClient |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | storage config |
| Identity | `GOOGLE_CLIENT_ID`, Google audience variants; Firebase Admin configuration | AuthService, firebase config |
| Web | `VITE_API_BASE_URL`, `VITE_USE_MOCK_API` | Axios client và customer orderApi |
| Mobile | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SOCKET_URL`, public Google/Firebase config names | API/socket clients |
| AI inference | `CLASSIFIER_MODE`, `CLIP_MIN_CONF`, `CLIP_MIN_MARGIN` | `main.py` module config |

Đây là tên biến từ source, không phải dump environment. Không suy rằng mọi biến có giá trị hợp lệ. [doan-kltn-backend/src/infrastructure/redis/redis.service.js:8](../../doan-kltn-backend/src/infrastructure/redis/redis.service.js#L8) — `RedisService.constructor` và [doan-kltn-backend/src/modules/orders/order-queue.service.js:23](../../doan-kltn-backend/src/modules/orders/order-queue.service.js#L23) — `OrderQueueService.constructor` cho thấy **hai cách resolve Redis khác nhau**: cấu hình URL của OTP/subscriber có thể trỏ khác queue nếu chỉ set một nhóm biến.

**CONFIRMED:** `ConfigModule.forRoot({isGlobal:true})` không có `load` factory trong AppModule, trong khi client có fallback lookup `app.fastApiAiUrl`, queue có `redis.host`. Không giả định các file `registerAs` đã được load chỉ vì tồn tại trong `src/config`. [doan-kltn-backend/src/app.module.js:19](../../doan-kltn-backend/src/app.module.js#L19) — `ConfigModule.forRoot`.

**CONFIRMED:** Backend gọi AI HTTP nhưng client không gắn internal API key; FastAPI không khai báo auth dependency cho ba handler chính. Hướng dẫn `.agents/rules/architecture.md` yêu cầu internal key là **ý định**, chưa phải implementation. [doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js:31](../../doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js#L31) — `diagnoseIncident`, [ai-service/main.py:392](../../ai-service/main.py#L392) — `diagnose`.

## Build và vận hành

Backend build bằng Babel → `dist`, start Node; web `vite build`; mobile Expo/EAS config; AI Docker/Uvicorn. Root Compose chỉ có DB, Redis, AI, không chứa backend/web/mobile. Local script lại chạy AI native và chỉ bật data containers, nên đây là hai cách vận hành lựa chọn, chưa xác nhận deployment production. [dev-local.sh:21](../../dev-local.sh#L21) — `docker startup`, [dev-local.sh:57](../../dev-local.sh#L57) — `concurrently`, [docker-compose.yml:63](../../docker-compose.yml#L63) — `ai-service`.

Khuyến nghị: pin supported runtime/lock strategy và kiểm tra clean build trong CI. Rationale: tránh README/host/container drift; impact vừa, effort nhỏ–vừa; trade-off là cần quy trình cập nhật version định kỳ. Không cần monorepo orchestrator nếu ba build hiện tại vẫn dễ quản lý.
