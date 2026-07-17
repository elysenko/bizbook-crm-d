# Test Specification

> ⚠️ **Warning:** `.pipeline/surface.json` was not found. The API surface below
> was derived from `requirements`/`spec` and the "Surface contract" section of
> `.pipeline/tasks.md`. Treat the endpoint list as authoritative-by-derivation;
> regenerate `surface.json` upstream if this list drifts from the implementation.

## Coverage summary
- Total cases: 78
- API endpoints covered: 21 / 21 (derived surface, no surface.json)
- User journeys covered: 10

Derived endpoint inventory (all mounted under `/api`):
`POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`,
`GET /clients`, `POST /clients`, `PATCH /clients/:id`, `DELETE /clients/:id`,
`GET /services`, `POST /services`, `PATCH /services/:id`, `DELETE /services/:id`,
`GET /appointments`, `POST /appointments`, `PATCH /appointments/:id/status`,
`GET /dashboard/today`, `GET /revenue/summary`, `GET /health`, `GET /health/deep`,
`GET /admin/settings`, `PATCH /admin/settings`.

Role legend: **PUBLIC** = no token; **USER** = any authenticated role; **ADMIN** = admin role only.

---

## API tests

### `POST /api/auth/signup`
- **Happy path**: on an empty user table, `{email, password, name}` → `201/200` with `{token, user}`; `user.role === "ADMIN"` (first user becomes ADMIN). A second signup with a new email → `user.role === "USER"`.
- **Validation failures**: missing `email`/`password`/`name`, malformed email, empty password → `400` with zod error body. Duplicate email (already registered) → `409` (or `400`) and no second user created.
- **Auth failures**: n/a (public route).
- **Idempotency / edge cases**: password is stored hashed (bcrypt) — response never echoes `passwordHash`; token is a valid JWT carrying `{sub, role}`.

### `POST /api/auth/login`
- **Happy path**: seeded admin creds from `SEED_CREDS_JSON.admin` → `200` `{token, user}` with `user.role === "ADMIN"`. Seeded user creds → `200` with `user.role === "USER"`.
- **Validation failures**: missing `email` or `password` → `400`.
- **Auth failures**: unknown email → `401`; correct email + wrong password → `401`. Response body reveals neither which field was wrong.
- **Idempotency / edge cases**: returned token authenticates a subsequent `GET /api/auth/me`.

### `POST /api/auth/logout`
- **Happy path**: authenticated request → `200` (stateless JWT; client discards token).
- **Auth failures**: no token → still resolves gracefully (`200`/`204`) per stateless design; document actual behavior.
- **Idempotency / edge cases**: after logout the client-side token is cleared; server does not blacklist (documented, not a bug).

### `GET /api/auth/me`
- **Happy path**: valid token → `200` with current `{id, email, name, role}`; no `passwordHash` field.
- **Auth failures**: no `Authorization` header → `401`; malformed/expired token → `401`.

### `GET /api/clients`
- **Happy path**: ADMIN token → `200` array of clients including seeded sample clients; each item has `{id, name, phone, email?, notes?, createdAt}`.
- **Auth failures**: no token → `401`; USER token → `403` (ADMIN-only resource).

### `POST /api/clients`
- **Happy path**: ADMIN, `{name, phone}` (email/notes optional) → `201` with created client; it then appears in `GET /api/clients`.
- **Validation failures**: missing `name` or `phone`, wrong types → `400` zod error; malformed optional `email` → `400`.
- **Auth failures**: no token → `401`; USER → `403`.

### `PATCH /api/clients/:id`
- **Happy path**: ADMIN updates `name`/`phone`/`notes` → `200` with updated record; change reflected in `GET`.
- **Validation failures**: invalid field types → `400`; unknown `:id` → `404`.
- **Auth failures**: no token → `401`; USER → `403`.

### `DELETE /api/clients/:id`
- **Happy path**: ADMIN deletes an existing client → `200`/`204`; absent from subsequent `GET`.
- **Validation / edge cases**: unknown `:id` → `404`; deleting a client referenced by an appointment → document behavior (either blocked `409` or cascrestricted); test asserts a consistent, non-500 response.
- **Auth failures**: no token → `401`; USER → `403`.

### `GET /api/services`
- **Happy path**: ADMIN → `200` array; each item `{id, name, durationMinutes:int, priceCents:int, createdAt}`; seeded services present.
- **Auth failures**: no token → `401`; USER → `403`.

### `POST /api/services`
- **Happy path**: ADMIN, `{name, durationMinutes, priceCents}` → `201`; appears in `GET /api/services`.
- **Validation failures**: missing any field, non-integer `durationMinutes`/`priceCents`, negative price → `400`.
- **Auth failures**: no token → `401`; USER → `403`.

### `PATCH /api/services/:id`
- **Happy path**: ADMIN updates name/duration/price → `200` updated record.
- **Validation failures**: non-integer price/duration → `400`; unknown `:id` → `404`.
- **Auth failures**: no token → `401`; USER → `403`.

### `DELETE /api/services/:id`
- **Happy path**: ADMIN deletes existing service → `200`/`204`; absent afterward.
- **Validation / edge cases**: unknown `:id` → `404`; service referenced by appointment → consistent non-500 response (documented).
- **Auth failures**: no token → `401`; USER → `403`.

### `GET /api/appointments`
- **Happy path**: authenticated (USER or ADMIN) → `200` array; each appointment includes joined `client` and `service` objects and `status`.
- **Filter cases**:
  - `?status=BOOKED` → only BOOKED appts.
  - `?status=COMPLETED` → only COMPLETED appts.
  - `?date=YYYY-MM-DD` → only appts whose `startTime` falls on that calendar date in `APP_TZ`.
  - `?status=BOOKED&date=YYYY-MM-DD` combined → intersection.
  - Invalid `status` value or malformed `date` → `400` (or documented ignore-and-return-all; test asserts consistent behavior).
- **Auth failures**: no token → `401`.

### `POST /api/appointments`
- **Happy path**: USER (and ADMIN) posts `{clientId, serviceId, startTime}` (future) → `201` with `status === "BOOKED"` and `createdById` = caller.
- **Validation failures**: missing `clientId`/`serviceId`/`startTime` → `400`; non-existent `clientId`/`serviceId` → `400`/`404`; unparseable `startTime` → `400`.
- **Auth failures**: no token → `401`.
- **Idempotency / edge cases**: default status is `BOOKED` even if a status is supplied in the body (status not client-settable on create).

### `PATCH /api/appointments/:id/status`
- **Happy path**: ADMIN sends `{status:"COMPLETED"}` on a BOOKED appt → `200`, status `COMPLETED`. Sending `{status:"CANCELLED"}` → status `CANCELLED`.
- **Validation failures**: status not in `{COMPLETED, CANCELLED}` (e.g. `BOOKED`, junk) → `400`; unknown `:id` → `404`; transition from an already-terminal status → documented (`409`/`400`).
- **Auth failures**: no token → `401`; USER → `403` (complete/cancel is ADMIN-only).

### `GET /api/dashboard/today`
- **Happy path**: authenticated (USER or ADMIN) → `200` `{appointments:[...], remaining:<int>}`. `appointments` are today's (in `APP_TZ`) sorted by `startTime` ascending; `remaining` counts BOOKED appts with `startTime` in the future.
- **Edge cases**: no appts today → `{appointments:[], remaining:0}`. COMPLETED/CANCELLED appts are excluded from `remaining`.
- **Auth failures**: no token → `401`.

### `GET /api/revenue/summary`
- **Happy path**: ADMIN → `200` `{week:<cents>, month:<cents>}`. Values equal the sum of `service.priceCents` over COMPLETED appts within the current Mon–Sun week and current calendar month (in `APP_TZ`).
- **Edge cases**: appt COMPLETED this week increases `week` (and `month`) by exactly its `service.priceCents`; BOOKED/CANCELLED appts contribute `0`; no completed appts → `{week:0, month:0}`.
- **Auth failures**: no token → `401`; USER → `403`.

### `GET /api/health`
- **Happy path**: PUBLIC, no token → `200` (used by Colossus). Body indicates ok.

### `GET /api/health/deep`
- **Happy path**: PUBLIC → `200` after a successful DB ping.
- **Edge cases**: if DB is unreachable → `503` with failure indicator (documented; not asserted in normal run).

### `GET /api/admin/settings`
- **Happy path**: ADMIN → `200` listing backing-service keys (`postgresql`, `minio`) each with a masked value and a configured/unconfigured status.
- **Auth failures**: no token → `401`; USER → `403`.
- **Edge cases**: secret values are masked, never returned in cleartext.

### `PATCH /api/admin/settings`
- **Happy path**: ADMIN upserts `{key:value}` pairs → `200`; a subsequent `GET /api/admin/settings` shows the key as configured.
- **Validation failures**: unknown/unsupported key or malformed body → `400`.
- **Auth failures**: no token → `401`; USER → `403`.

---

## UI / journey tests

### Journey: Signup — first user becomes ADMIN
- **Steps**: On a fresh DB, load `/signup` (deep-link, no token) → fill name/email/password → submit.
- **Expected outcomes**: request to `POST /api/auth/signup` succeeds; token persisted in localStorage; redirected to `/today`; header shows **"BizBook"**; admin-only nav items (Clients, Services, Revenue, Admin Settings) are visible.
- **Negative path**: submitting a duplicate email or invalid form shows an inline error and stays on `/signup`.

### Journey: Login → lands on Today
- **Steps**: Load `/login` → enter seeded admin creds (`SEED_CREDS_JSON.admin`) → submit.
- **Expected outcomes**: redirected to `/today`; `Front Desk — Today` heading visible; token stored.
- **Negative path**: wrong password → visible error message, remains on `/login`, no token stored.

### Journey: Auth guard / deep-link protection
- **Steps**: With no token in localStorage, directly navigate to `/today` (and `/clients`, `/appointments`).
- **Expected outcomes**: redirected to `/login` for each.
- **Negative path**: USER (non-admin) navigating to `/clients`, `/services`, `/revenue`, `/admin/settings` → blocked (redirect to `/today` or a not-authorized view via `RequireAdmin`); `/appointments` and `/today` remain accessible.

### Journey: Clients CRUD (ADMIN)
- **Steps**: As admin go to `/clients` → open `?modal=create` → enter name+phone → save; then open `?modal=edit&id=<id>` → change a field → save; then delete a client.
- **Expected outcomes**: new client appears in the table and via `GET /api/clients`; edit persists and re-renders; delete removes the row; deep-linking `/clients?modal=create` and `/clients?modal=edit&id=<id>` opens the corresponding dialog directly.
- **Negative path**: saving with an empty required field shows validation error and does not close the modal.

### Journey: Services CRUD (ADMIN)
- **Steps**: As admin go to `/services` → `?modal=create` → enter name/durationMinutes/priceCents → save; edit via `?modal=edit&id=<id>`; delete.
- **Expected outcomes**: service appears in list; price rendered as formatted currency (e.g. `priceCents` 4500 → `$45.00`); edit/delete reflected.
- **Negative path**: non-numeric duration/price shows validation error; modal stays open.

### Journey: Appointments — book then complete/cancel
- **Steps**: As USER go to `/appointments` → `?modal=book` → select client + service + future startTime → book. Then as ADMIN, complete (and separately cancel) an appointment via row action.
- **Expected outcomes**: booked appt shows status BOOKED; admin complete action moves it to COMPLETED, cancel to CANCELLED; UI updates without full reload. USER does not see complete/cancel actions.
- **Negative path**: booking with missing fields shows error; booking blocked while required data absent.

### Journey: Appointments filters (deep-linkable)
- **Steps**: Load `/appointments?status=BOOKED`, then `/appointments?date=YYYY-MM-DD`, then `/appointments?status=COMPLETED&date=YYYY-MM-DD` directly.
- **Expected outcomes**: filter controls reflect the query params on load; the list shows only the matching subset; changing a filter updates the URL query string.
- **Negative path**: an empty result set renders an empty-state message, not an error.

### Journey: Today dashboard
- **Steps**: As admin or user load `/today`.
- **Expected outcomes**: `Front Desk — Today` heading; appointments for today listed sorted by time ascending, each showing client + service; a remaining count is displayed and matches BOOKED-future count.
- **Negative path**: no appointments today → empty state; API error → error state, not a blank crash.

### Journey: Revenue summary (ADMIN)
- **Steps**: Complete an appointment (admin), then load `/revenue`.
- **Expected outcomes**: weekly and monthly totals rendered as formatted currency; the completed appt's `service.priceCents` is included in the weekly total; USER cannot reach the page.
- **Negative path**: no completed appts → totals show `$0.00`.

### Journey: Admin settings (ADMIN)
- **Steps**: As admin load `/admin/settings` → view backing-service list → enter credentials for `postgresql`/`minio` → save.
- **Expected outcomes**: each backing service (`postgresql`, `minio`) shows a configured/unconfigured badge; saving persists via `PATCH /api/admin/settings` and flips the badge to configured; secret values shown masked.
- **Negative path**: USER navigating to `/admin/settings` is blocked; invalid input shows a validation error.

### Journey: Routing / unknown-path redirect
- **Steps**: Navigate to an unknown path such as `/does-not-exist` while authenticated.
- **Expected outcomes**: redirected to `/today`. All named routes plus their `?modal=`/`?status=`/`?date=` query params are directly loadable (deep-link restores the state).

---

## Data integrity tests
- After `POST /api/auth/signup` on an empty table, exactly one User exists and its `role === "ADMIN"`; every subsequent signup yields `role === "USER"`.
- User `email` is unique — a duplicate signup does not create a second row.
- Passwords are persisted only as bcrypt `passwordHash`; cleartext password never stored or returned.
- New appointments persist with `status = "BOOKED"` (default), a valid `createdById` FK to User, and valid `clientId`/`serviceId` FKs.
- `PATCH /appointments/:id/status` only ever leaves an appointment in one of `{BOOKED, COMPLETED, CANCELLED}`; no invalid status is persisted.
- `Service.priceCents` and `Service.durationMinutes` are always integers (no floats/strings).
- `GET /revenue/summary` totals equal the exact sum of `priceCents` over COMPLETED appointments within the APP_TZ Mon–Sun week / calendar month — no double counting, no inclusion of BOOKED/CANCELLED.
- `dashboard/today` `remaining` count never includes COMPLETED or CANCELLED or past appointments.
- `PATCH /api/admin/settings` upserts (not duplicates) `SystemSetting` rows keyed by `key`; `updatedAt` advances on change.

## Out of scope
- **Actual connection to provisioned `postgresql`/`minio`** — the spec's data model is Prisma+SQLite and no spec route consumes these backing services; only the admin-settings credential surface is tested (open question in `tasks.md`). Live connectivity to those services is not asserted.
- **Third-party integrations** — spec declares none; no integration client is generated, so none is tested.
- **JWT/session expiry & refresh timing** — spec does not define token TTL or refresh; expiry behavior is only smoke-checked (malformed/expired → 401), not exhaustively verified.
- **Concurrency / double-booking rules** — spec defines no slot-conflict constraint, so overlapping appointments are not treated as errors.
- **SQLite persistence across redeploys** — deploy-volume durability is an infra concern flagged as a risk; not under functional test.
- **Deploy/Docker build** — `docker build .` succeeding and the container serving SPA + `/api/health` on `$PORT` is validated by the deploy stage, not enumerated as an app-level case here (health endpoints themselves are covered above).
- **Exact styling/Tailwind visual appearance** — only functional/text assertions (headings, "BizBook", formatted currency) are checked, not pixel layout.
