-- =====================================================================
-- Tasco Carriers Fleet System — Normalized Schema
-- Replaces: Carriers_Fleet_Information_Reporting_Backup.accdb
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- Reference / lookup tables
-- ---------------------------------------------------------------------

CREATE TABLE roles (
    id          SMALLSERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE  -- Operator, Depot Manager, Administrator
);
INSERT INTO roles (name) VALUES ('Operator'), ('Depot Manager'), ('Administrator');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    username        TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,         -- bcrypt hash, never plaintext
    role_id         SMALLINT NOT NULL REFERENCES roles(id),
    location_id     UUID, -- FK to locations added below, after that table is created
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE locations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_id       TEXT UNIQUE,           -- original Access LocationID, kept for migration traceability
    name            TEXT NOT NULL,
    address         TEXT,
    city            TEXT,
    state           TEXT,
    postcode        TEXT,
    contact         TEXT,
    phone           TEXT,
    location_type   TEXT,
    email           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD CONSTRAINT users_location_fk FOREIGN KEY (location_id) REFERENCES locations(id);

CREATE TABLE vehicle_classes (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_id                  TEXT UNIQUE,
    class                       TEXT,
    description                 TEXT,
    state                       TEXT,
    annual_registration_fee    NUMERIC(12,2),
    quarterly_registration_fee NUMERIC(12,2),
    cost_leasing                NUMERIC(12,2),
    registration_cost           NUMERIC(12,2),
    insurance_cost               NUMERIC(12,2),
    fuel_and_oil_cost            NUMERIC(12,2),
    wage_rate                    NUMERIC(12,2),
    wage_classification         TEXT,
    km_per_litre                 INTEGER,
    last_updated                 TIMESTAMPTZ,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Core vehicle entity (specs only — compliance & finance split out below)
-- ---------------------------------------------------------------------

CREATE TYPE vehicle_status AS ENUM ('active', 'disposed');

CREATE TABLE vehicles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_no            TEXT NOT NULL UNIQUE,   -- legacy FleetNoID, kept as the natural business key
    division            INTEGER,
    vehicle_type        TEXT,                    -- Truck, Trailer
    sub_type            TEXT,
    make                TEXT,
    model                TEXT,
    description          TEXT,
    year                  INTEGER,
    vin                   TEXT,
    class_id             UUID REFERENCES vehicle_classes(id),
    tare_kg              INTEGER,
    gvm_kg               INTEGER,
    gcm_kg               INTEGER,
    wheelbase_mm         INTEGER,
    turntable_offset_mm  INTEGER,
    tyres                INTEGER,
    phone_no             TEXT,
    location_id          UUID REFERENCES locations(id),
    status               vehicle_status NOT NULL DEFAULT 'active',
    acquired_date         DATE,
    acquisition_price      NUMERIC(14,2),
    annual_depreciation    NUMERIC(14,2),
    net_value               NUMERIC(14,2),
    disposal_date           DATE,
    usable_life_years       INTEGER,
    current_kms             INTEGER,
    current_kms_date         DATE,
    action_required           BOOLEAN NOT NULL DEFAULT FALSE,
    action_task                TEXT,
    notes                       TEXT,
    relocation_notes             TEXT,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_location ON vehicles(location_id);

-- ---------------------------------------------------------------------
-- Compliance — RFS, NHVAS, Dangerous Goods, speed limiter, etc.
-- One row per vehicle. Split out so the core vehicle record stays lean
-- and this can be audited/reported on independently for accreditation.
-- ---------------------------------------------------------------------

CREATE TABLE vehicle_compliance (
    vehicle_id                  UUID PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
    registration_no              TEXT,
    registration_state            TEXT,
    registration_expiry            DATE,
    road_friendly_suspension        BOOLEAN NOT NULL DEFAULT FALSE,
    rfs_certificate_no              TEXT,
    nhvas_label_no                  TEXT,
    nhvas_mass                       BOOLEAN NOT NULL DEFAULT FALSE,
    mass_active                      BOOLEAN NOT NULL DEFAULT FALSE,
    nhvas_maintenance                 BOOLEAN NOT NULL DEFAULT FALSE,
    nhvas_joined_date                  DATE,
    nhvas_exit_date                    DATE,
    speed_limiter_speed_kmh             INTEGER,
    speed_limiter_checked_date            DATE,
    slp_no                                INTEGER,
    slp_required                          BOOLEAN NOT NULL DEFAULT FALSE,
    slp_expiry_date                       DATE,
    meters_present                        BOOLEAN NOT NULL DEFAULT FALSE,
    meter_calibration_date                 DATE,
    meter_seal_checked_date                 DATE,
    fatigue_camera                          BOOLEAN NOT NULL DEFAULT FALSE,
    fatigue_camera_data_service_no           TEXT,
    fatigue_system_serial_no                  TEXT,
    dg_licence_required                        BOOLEAN NOT NULL DEFAULT FALSE,
    dg_licence_no                               TEXT,
    dg_licence_state                             TEXT,
    dg_expiry_date                               DATE,
    dg_design_approval_no                        TEXT,
    dg_design_approval_state                     TEXT,
    dg_tank_type_code                            TEXT,
    dg_hydro_test_date                           DATE,
    dg_hatch_vent_test_date                      DATE,
    terminal_access_required                     BOOLEAN NOT NULL DEFAULT FALSE,
    drawings_on_file                             BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at                                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Maintenance contracts (third-party fleet maintenance agreements)
-- ---------------------------------------------------------------------

CREATE TABLE maintenance_contracts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id              UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    contract_no              TEXT,
    registration_no           TEXT,
    chassis_id                TEXT,
    start_date                 DATE,
    expiring_date               DATE,
    current_contract_duration_years NUMERIC(6,2),
    max_mileage_km                   INTEGER,
    total_km_covered                  INTEGER,
    created_at                         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Vehicle location history (depot transfers)
-- ---------------------------------------------------------------------

CREATE TABLE vehicle_location_history (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id             UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    transfer_date            DATE,
    transferring_depot         TEXT,
    location_id                 UUID REFERENCES locations(id),
    recorded_by                  UUID REFERENCES users(id),
    date_recorded                 TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vlh_vehicle ON vehicle_location_history(vehicle_id);

-- ---------------------------------------------------------------------
-- Mass / weighbridge verifications — the actively-used compliance workflow
-- ---------------------------------------------------------------------

CREATE TABLE mass_verifications (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id                   UUID REFERENCES vehicles(id),
    depot                          TEXT,
    trailer_1_id                    UUID REFERENCES vehicles(id),
    trailer_2_id                    UUID REFERENCES vehicles(id),
    trailer_3_id                    UUID REFERENCES vehicles(id),
    weigh_date                       DATE,
    weigh_time                        TIME,
    weighbridge_name                   TEXT,
    weighbridge_address                 TEXT,
    weighbridge_state                    TEXT,
    docket_reference                      TEXT,
    driver_name                            TEXT,
    submitted_by                            UUID REFERENCES users(id),
    steer_axle_weight_kg                     INTEGER,
    drive_axle_weight_kg                      INTEGER,
    trailer_1_axle_weight_kg                   INTEGER,
    trailer_2_axle_weight_kg                    INTEGER,
    trailer_3_axle_weight_kg                     INTEGER,
    total_mass_kg                                 INTEGER,
    created_at                                     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mv_vehicle ON mass_verifications(vehicle_id);
CREATE INDEX idx_mv_weigh_date ON mass_verifications(weigh_date);

-- ---------------------------------------------------------------------
-- Drivers — rebuilt properly with licence/DG tracking
-- ---------------------------------------------------------------------

CREATE TYPE driver_status AS ENUM ('active', 'inactive');

CREATE TABLE drivers (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_code               TEXT UNIQUE,          -- e.g. PAC, kept from legacy where present
    first_name                 TEXT NOT NULL,
    last_name                   TEXT NOT NULL,
    date_of_birth                 DATE,
    licence_no                     TEXT,
    licence_type                    TEXT,             -- e.g. HC, MC, HR
    licence_state                    TEXT,
    licence_expiry                    DATE,
    dg_licence_no                       TEXT,
    dg_licence_expiry                    DATE,
    home_location_id                      UUID REFERENCES locations(id),
    status                                  driver_status NOT NULL DEFAULT 'active',
    phone                                    TEXT,
    notes                                     TEXT,
    created_at                                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Many-to-many: which vehicles a driver is currently/historically assigned to
CREATE TABLE driver_vehicle_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id        UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    vehicle_id        UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    assigned_from       DATE NOT NULL DEFAULT CURRENT_DATE,
    assigned_to          DATE,                       -- null = current assignment
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dva_driver ON driver_vehicle_assignments(driver_id);
CREATE INDEX idx_dva_vehicle ON driver_vehicle_assignments(vehicle_id);

-- ---------------------------------------------------------------------
-- Audit log — the one thing Access never gave you. Every write to a
-- vehicle/driver/compliance record gets tracked: who, when, what changed.
-- ---------------------------------------------------------------------

CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    table_name        TEXT NOT NULL,
    record_id           UUID NOT NULL,
    action                TEXT NOT NULL,   -- insert / update / delete
    changed_by             UUID REFERENCES users(id),
    changed_fields            JSONB,
    changed_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_record ON audit_log(table_name, record_id);
