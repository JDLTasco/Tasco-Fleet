# Tasco Carriers Fleet System

Replaces `Carriers_Fleet_Information_Reporting_Backup.accdb`. Next.js 14 +
PostgreSQL, same pattern as Depot Controls Calendar / Tasco BSC.

## What's actually built right now

- **Schema** (`schema.sql`) — normalized, with real foreign keys, an
  `audit_log` table (Access never tracked who changed what), and
  `vehicle_compliance` split out from the vehicle master so NHVAS/DG
  fields can be reported on independently.
- **Migration** (`migrate.py`) — tested against your real export.
  214 vehicles (140 active, 74 disposed), 41 locations, 48 vehicle
  classes, 462 location transfers, 382 mass verifications, 25
  maintenance contracts, 3 users all migrated with **zero** unresolved
  foreign keys.
- **Auth** — signed JWT session cookie, bcrypt password hashes, role
  gate (Operator / Depot Manager / Administrator) mapped from your
  existing `UserType` table. Route-level protection via middleware.
- **Vehicles** — list with search/status filter, detail page with
  inline-editable specs and operational fields, location history.
- **Drivers** — rebuilt as requested: licence + DG licence tracking,
  expiry highlighted in red when <30 days out.
- **Mass Verifications** — the field-entry form. A driver/operator
  enters the weighbridge docket directly; total mass is calculated
  server-side, not trusted from the client.

## What's explicitly NOT built yet (be aware before you call this done)

- **Maintenance contracts UI** — migrated into the DB, no screens yet.
- **Vehicle Classes / Locations admin screens** — currently edit-only
  via SQL. Low usage tables (48 and 41 rows respectively), low priority.
- **VehicleImage / Attachments blob fields** — Access stores these as
  embedded OLE objects. `mdb-export` does not extract them as usable
  files. If there are actual photos/documents attached to vehicle or
  location records you care about, that needs a separate extraction
  pass before Access is retired — don't assume migrate.py captured them,
  because it didn't attempt to.
- **Vehicle Expenses** — deliberately dropped per your call; the legacy
  data (8 rows since 2015, one a placeholder test entry) was not migrated.
- **Driver–vehicle assignment UI** — the `driver_vehicle_assignments`
  table exists in the schema but there's no screen to use it yet.
- **Password reset flow** — `set_password.py` is a stopgap for getting
  your 3 existing users working. A real "forgot password" email flow
  isn't built.

## Local setup

```bash
npm install
cp .env.example .env.local   # set DATABASE_URL and AUTH_SECRET
psql $DATABASE_URL -f schema.sql
python3 -m venv venv && source venv/bin/activate
pip install psycopg2-binary bcrypt
python3 migrate.py           # one-time, reads from ./raw/*.csv
python3 set_password.py paul.campbell "<a real password>"
npm run dev
```

## Generating the `raw/` CSVs from the live Access file

On a machine with `mdbtools` (or WSL/Linux):

```bash
for t in "Vehicles" "Drivers" "Vehicle Classes" "Vehicle Locations" \
         "Locations" "Users" "Mass WB Verifications" "Maintenance Contract 2022"; do
  mdb-export YourFile.accdb "$t" > "raw/$(echo $t | tr ' ' '_').csv"
done
```

## Deploying (Railway, matching your existing apps)

1. Push this repo to GitHub.
2. New Railway project → deploy from repo → add a Postgres plugin.
3. Set `AUTH_SECRET` in Railway env vars (generate with `openssl rand -hex 32`).
   `DATABASE_URL` is supplied automatically by the Postgres plugin.
4. Run `schema.sql` and `migrate.py` once against the Railway Postgres
   instance (e.g. via `railway run`), then `set_password.py` for each
   real user.
5. Decide cutover: you said "not sure yet" — my recommendation is a
   **2-week parallel run**. With 3 users and 214 vehicles, the migration
   risk is low, but a hard cutover gives you no fallback if a workflow
   gap shows up in week one. Keep Access read-only and open during that
   window, don't write to both.

## Security notes worth knowing, not just compliance theatre

- Legacy passwords (plaintext 3-digit codes) were intentionally **not**
  migrated. Every migrated user needs `set_password.py` run before they
  can log in.
- `AUTH_SECRET` must be a real random string in production — the
  fallback in code is for local dev only and is not safe to deploy with.
- All writes go through `logAudit()` — if you extend the API routes,
  keep calling it. This is the audit trail Access never gave you, and
  it's only as good as how consistently it's applied.
