# Pipeline Task Decomposition

## Summary
BizBook is a single deployable service — a React + TypeScript SPA (Vite, React Router, Tailwind) served by an Express + TypeScript API using Prisma over SQLite. It provides a small-business front desk: managing Clients and Services, booking Appointments, viewing a "Today" dashboard, and a Revenue summary. Auth is JWT-based with ADMIN/USER roles (`full_auth`): the first signup becomes ADMIN, subsequent users are USER. Every UI state is deep-linkable (modals and filters bound to query params), and the whole thing ships as one Docker image listening on `$PORT`.

## Surface contract
Backend API routes (mounted under `/api`):
- `POST /api/auth/signup` (public; first user → ADMIN), `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- `GET/POST/PATCH/DELETE /api/clients` (ADMIN) — CRUD.
- `GET/POST/PATCH/DELETE /api/services` (ADMIN) — CRUD.
- `GET /api/appointments` (filter by `status`, `date`), `POST /api/appointments` (USER+ADMIN), `PATCH /api/appointments/:id/status` (ADMIN → COMPLETED/CANCELLED).
- `GET /api/dashboard/today` (USER+ADMIN) — today's appts time-sorted + remaining count.
- `GET /api/revenue/summary` (ADMIN) — week + month COMPLETED totals.
- `GET /api/health`, `GET /api/health/deep` (public).
- `GET /api/admin/settings`, `PATCH /api/admin/settings` (ADMIN) — service/integration credential config.

Frontend routes (all deep-linkable):
- `/login`, `/signup` (public).
- `/today` — Front Desk dashboard (guarded, both roles) — landing after login.
- `/clients` — list; `?modal=create` / `?modal=edit&id=` (ADMIN).
- `/services` — list; `?modal=create` / `?modal=edit&id=` (ADMIN).
- `/appointments` — list; `?status=` & `?date=` filters; `?modal=book` (USER+ADMIN; complete/cancel ADMIN).
- `/revenue` — weekly/monthly summary (ADMIN).
- `/admin/settings` — service & integration credential configuration (ADMIN).
- Unknown paths redirect to `/today`.

Entities: **User** (id, email, passwordHash, name, role, createdAt), **Client** (id, name, phone, email?, notes?, createdAt), **Service** (id, name, durationMinutes, priceCents, createdAt), **Appointment** (id, clientId, serviceId, startTime, status, createdById, createdAt), **SystemSetting** (key, value, updatedAt).

## db_agent tasks
- [ ] Create `server/prisma/schema.prisma` with a SQLite datasource and Prisma client generator.
- [ ] Define `enum UserRole { ADMIN USER }` and `User` model — id, email (unique), passwordHash, name, `role UserRole @default(USER)`, createdAt.
- [ ] Define `Client` model — id, name, phone, email? (optional), notes? (optional), createdAt.
- [ ] Define `Service` model — id, name, durationMinutes (Int), priceCents (Int), createdAt.
- [ ] Define `enum AppointmentStatus { BOOKED COMPLETED CANCELLED }` and `Appointment` model — id, clientId→Client, serviceId→Service, startTime (DateTime), `status @default(BOOKED)`, createdById→User, createdAt; include client + service + createdBy relations.
- [ ] Define `SystemSetting` model — `key String @id`, `value String`, `updatedAt DateTime @updatedAt` (for admin settings / backing-service credential storage).
- [ ] Create the initial Prisma migration for all models.
- [ ] Create `server/prisma/seed.ts` — hash passwords with bcrypt, insert 1 ADMIN + 1 USER, a few sample services and clients, and print `SEED_CREDS_JSON={"admin":{...},"user":{...}}` to stdout.
- [ ] Create `server/src/db.ts` — Prisma client singleton.

## backend_agent tasks
- [ ] Create `server/package.json` (express, @prisma/client, prisma, bcryptjs, jsonwebtoken, zod, cors, dotenv; dev: typescript, tsx, @types/*) and `server/tsconfig.json` (outDir `dist`).
- [ ] Create `server/src/config.ts` — read `JWT_SECRET`, `APP_TZ` (default `UTC`), `PORT` from env.
- [ ] Create `server/src/auth/jwt.ts` — sign/verify JWT carrying `{sub, role}`.
- [ ] Create `server/src/auth/middleware.ts` — `requireAuth` and `requireRole('ADMIN')` guard middleware.
- [ ] Create `server/src/routes/auth.ts` — `POST /signup` (first user → ADMIN, rest → USER), `POST /login` (returns `{token, user}`), `POST /logout`, `GET /me`.
- [ ] Create `server/src/routes/clients.ts` — CRUD (ADMIN) with zod validation.
- [ ] Create `server/src/routes/services.ts` — CRUD (ADMIN, name/durationMinutes/priceCents) with zod validation.
- [ ] Create `server/src/routes/appointments.ts` — list (filter by `status`/`date`, include client+service), create (USER+ADMIN), `PATCH /:id/status` (ADMIN: BOOKED→COMPLETED/CANCELLED).
- [ ] Create `server/src/lib/dates.ts` — `APP_TZ`-aware today / week (Mon–Sun) / month boundary helpers.
- [ ] Create `server/src/routes/dashboard.ts` — `GET /today` returning today's appts (APP_TZ) sorted ascending + remaining (BOOKED, future) count.
- [ ] Create `server/src/routes/revenue.ts` — `GET /summary` (ADMIN) summing `service.priceCents` of COMPLETED appts for current week and month.
- [ ] Create `server/src/routes/health.ts` — `GET /health` and `GET /health/deep` (DB ping), both public.
- [ ] Create `server/src/lib/validate.ts` — shared zod schemas + error helper.
- [ ] Create `server/src/index.ts` — Express bootstrap: cors, mount all routes under `/api/*`, serve `../web/dist` static with SPA catch-all to `index.html`, listen on `process.env.PORT || 8080`.
- [ ] Generate admin guard + `(admin)` route protection: admin routes require ADMIN role via `requireRole('ADMIN')`; admin can always log in through the standard `/login` flow (role checked server-side).
- [ ] Create `server/src/lib/config.ts` with `resolveConfig(key: string): string | null` — reads `process.env[key]` first; if the value equals `PLACEHOLDER_CONFIGURE_IN_SETTINGS` or is absent, reads the matching `SystemSetting` DB row; returns null if neither is set.
- [ ] Create `server/src/routes/admin/settings.ts` — `GET /api/admin/settings` (list backing-service keys for `postgresql` and `minio` with masked values + configured status, ADMIN) and `PATCH /api/admin/settings` (upsert key-value pairs into `SystemSetting`, ADMIN).

## ui_agent tasks
- [ ] Create `web/package.json` (react, react-dom, react-router-dom, axios; dev: vite, typescript, tailwindcss, postcss, autoprefixer, @types/*), `web/vite.config.ts` (dev proxy `/api` → `http://localhost:8080`, build to `dist`), `web/tailwind.config.js`, `web/postcss.config.js`, `web/index.html`, `web/src/main.tsx`, `web/src/index.css`.
- [ ] Create `web/src/App.tsx` — React Router with all routes + guards; unknown paths redirect to `/today`; app shell header renders "BizBook".
- [ ] Create `web/src/auth/RequireAuth.tsx` and `web/src/auth/RequireAdmin.tsx` route guards.
- [ ] Create `web/src/components/AppShell.tsx` — header ("BizBook"), nav (admin-only nav items visible only to admins), logout action.
- [ ] Create `web/src/components/Modal.tsx` — reusable dialog driven by the `?modal=` query param.
- [ ] Create `web/src/pages/Login.tsx` and `web/src/pages/Signup.tsx` — auth forms (part of main app, `full_auth`), with loading/error states.
- [ ] Create `web/src/pages/Today.tsx` — `Front Desk — Today` heading, time-sorted appt list (client + service) and remaining count; empty/loading/error states.
- [ ] Create `web/src/pages/Clients.tsx` — table + create/edit modals (`?modal=create` / `?modal=edit&id=`) + delete (ADMIN); empty/loading/error states.
- [ ] Create `web/src/pages/Services.tsx` — table + create/edit modals + delete (ADMIN); price displayed as formatted currency; empty/loading/error states.
- [ ] Create `web/src/pages/Appointments.tsx` — list with `?status=` / `?date=` filters, `?modal=book` booking dialog, complete/cancel actions (ADMIN); empty/loading/error states.
- [ ] Create `web/src/pages/Revenue.tsx` — weekly & monthly totals as formatted currency (ADMIN); empty/loading/error states.
- [ ] Create `web/src/pages/admin/Settings.tsx` at `/admin/settings` (ADMIN) — list each backing service (`postgresql`, `minio`) with a configured/unconfigured badge and per-service credential form. (No third-party integrations declared, so no integration credential fields.)

## service_agent tasks
- [ ] Create `web/src/api/client.ts` — axios instance that attaches `Authorization: Bearer <token>` and redirects to `/login` on 401.
- [ ] Create `web/src/auth/AuthContext.tsx` — token/user state persisted in localStorage with `login` / `logout` / `me` helpers.
- [ ] Create a typed clients data layer wiring the Clients UI to `/api/clients` (list/create/update/delete).
- [ ] Create a typed services data layer wiring the Services UI to `/api/services` (list/create/update/delete).
- [ ] Create a typed appointments data layer wiring the Appointments UI to `/api/appointments` (list with status/date filters, create, PATCH status).
- [ ] Create typed data hooks for `/api/dashboard/today` and `/api/revenue/summary` feeding the Today and Revenue pages.
- [ ] Create a typed admin-settings data layer wiring the `/admin/settings` page to `GET`/`PATCH /api/admin/settings`.

## tester tasks
- [ ] Auth: seed prints `SEED_CREDS_JSON`; admin login lands on `/today`; a guarded route without a token redirects to `/login`; first signup becomes ADMIN.
- [ ] Clients: POST a client with name+phone → it appears in `GET /api/clients` and in the list UI; edit and delete flows work.
- [ ] Services: POST a service (name/duration/price) → appears in list with formatted price.
- [ ] Appointments: USER books a future slot → status BOOKED; ADMIN `PATCH status=completed` → COMPLETED; status/date filters return correct subsets.
- [ ] Today: appts for today are sorted by time under "Front Desk — Today"; remaining count is correct.
- [ ] Revenue: after completing an appt, the weekly total includes its `priceCents`; monthly total correct.
- [ ] Routing/deep-links: each route plus `?modal=`, `?status=`, `?date=` is directly loadable and restores state; unknown path redirects to `/today`.
- [ ] Admin settings: `/admin/settings` lists `postgresql` and `minio` with configured/unconfigured badges; PATCH persists credentials; page is ADMIN-only.
- [ ] Deploy: `docker build .` succeeds; the container serves the SPA and returns 200 from `/api/health` on `$PORT`.

## Open questions
- Backing services `postgresql` and `minio` are provisioned, but the spec's data model and file list use **Prisma over SQLite** and declare **no object storage** usage. It is unclear whether the app should actually connect to the provisioned Postgres/MinIO or keep SQLite as specified — the admin settings page exposes their credentials, but no spec route consumes them. Downstream agents should confirm the intended datastore before wiring beyond the settings surface.
- The spec declares no third-party integrations ("None"); the `NONE_NO_THIRD_PARTY_APIS_SDKS_API_KEY` placeholder env key is treated as a no-op and no integration client module is generated.
- Colossus expected port/health path (`$PORT` / `/api/health`) is inferred; verify against platform defaults and adjust the Dockerfile `EXPOSE`/env if needed.
- SQLite file persistence depends on the deploy volume; if ephemeral, seed-on-boot keeps demo data but user data won't persist across redeploys.
