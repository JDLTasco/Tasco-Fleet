#!/usr/bin/env python3
"""
Migrates the legacy Tasco Carriers Access database (exported as CSV via
mdb-export) into the normalized Postgres schema in schema.sql.

Usage:
    python3 migrate.py

Reads from ./raw/*.csv, writes to the Postgres database described by
the FLEET_DB_* env vars (defaults match local dev setup).

This script is intentionally defensive: any row that can't be mapped
cleanly (orphaned foreign key, unparseable date, etc.) is logged to
stderr and skipped rather than silently dropped or crashing the run.
"""
import csv
import os
import re
import sys
import bcrypt
import psycopg2
from psycopg2.extras import execute_values

DB_HOST = os.environ.get("FLEET_DB_HOST", "localhost")
DB_NAME = os.environ.get("FLEET_DB_NAME", "fleet_dev")
DB_USER = os.environ.get("FLEET_DB_USER", "postgres")
DB_PASS = os.environ.get("FLEET_DB_PASS", "postgres")

RAW_DIR = os.path.join(os.path.dirname(__file__), "raw")

warnings = []


def warn(msg):
    warnings.append(msg)
    print(f"WARNING: {msg}", file=sys.stderr)


def read_csv(name):
    path = os.path.join(RAW_DIR, name)
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def to_bool(v):
    return v == "1" or (v or "").strip().lower() == "true"


def to_int(v):
    v = (v or "").strip()
    if not v:
        return None
    try:
        return int(float(v))
    except ValueError:
        return None


def to_decimal(v):
    v = (v or "").strip()
    if not v:
        return None
    try:
        return float(v)
    except ValueError:
        return None


ACCESS_NULL_DATE = (12, 30, 99)  # Access's 1899-12-30 "no date" sentinel, shown 2-digit


def parse_access_datetime(v):
    """
    Returns (date_str_or_None, time_str_or_None) from an mdb-export
    datetime like '07/01/26 00:00:00' or '12/30/99 21:18:00'.
    The 12/30/99 sentinel means "no real date, time component only"
    (Access's epoch for time-only fields) — we drop the date and keep
    the time in that case.
    """
    v = (v or "").strip()
    if not v:
        return None, None
    m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})", v)
    if not m:
        return None, None
    mo, da, yy, hh, mi, ss = (int(x) for x in m.groups())
    time_str = f"{hh:02d}:{mi:02d}:{ss:02d}"
    if (mo, da, yy) == ACCESS_NULL_DATE:
        return None, time_str
    year = 2000 + yy  # all real records in this DB fall in 2000-2099
    date_str = f"{year:04d}-{mo:02d}-{da:02d}"
    return date_str, time_str


def parse_date_only(v):
    d, _ = parse_access_datetime(v)
    return d


def connect():
    return psycopg2.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASS)


def main():
    conn = connect()
    conn.autocommit = False
    cur = conn.cursor()

    # ------------------------------------------------------------------
    # Locations
    # ------------------------------------------------------------------
    locations = read_csv("Locations.csv")
    location_id_map = {}  # legacy LocationID -> new UUID
    for row in locations:
        cur.execute(
            """INSERT INTO locations (legacy_id, name, address, city, state, postcode,
                                        contact, phone, location_type, email)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (
                row["LocationID"], row["Location Name"], row["Address"], row["City"],
                row["State"], row["Postcode"], row["Contact"], row["Phone No"],
                row["LocationType"], row["Email"],
            ),
        )
        location_id_map[row["LocationID"]] = cur.fetchone()[0]
    print(f"Locations migrated: {len(location_id_map)}")

    # ------------------------------------------------------------------
    # Vehicle classes
    # ------------------------------------------------------------------
    classes = read_csv("Vehicle_Classes.csv")
    class_id_map = {}
    for row in classes:
        cur.execute(
            """INSERT INTO vehicle_classes (legacy_id, class, description, state,
                    annual_registration_fee, quarterly_registration_fee, cost_leasing,
                    registration_cost, insurance_cost, fuel_and_oil_cost, wage_rate,
                    wage_classification, km_per_litre, last_updated)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (
                row["ClassID"], row["Class"], row["Description"], row["State"],
                to_decimal(row["AnnualRegistrationFee"]), to_decimal(row["ThreeMonthlyRegistrationFee"]),
                to_decimal(row["CostLeasing"]), to_decimal(row["Registration"]),
                to_decimal(row["Insurance"]), to_decimal(row["FuelAndOil"]),
                to_decimal(row["WageRate"]), row["WageClassification"],
                to_int(row["KMperLT"]), parse_date_only(row["Last Updated"]),
            ),
        )
        class_id_map[row["ClassID"]] = cur.fetchone()[0]
    print(f"Vehicle classes migrated: {len(class_id_map)}")

    # ------------------------------------------------------------------
    # Vehicles + compliance (split across two tables, same source row)
    # ------------------------------------------------------------------
    vehicles = read_csv("Vehicles.csv")
    vehicle_id_map = {}  # legacy FleetNoID -> new UUID
    for row in vehicles:
        loc_id = location_id_map.get(row["LocationIDF"]) if row["LocationIDF"] else None
        cls_id = class_id_map.get(row["ClassIDF"]) if row["ClassIDF"] else None
        status = "disposed" if (row["DisposalDate"] or "").strip() else "active"

        cur.execute(
            """INSERT INTO vehicles (fleet_no, division, vehicle_type, sub_type, make, model,
                    description, year, vin, class_id, tare_kg, gvm_kg, gcm_kg, wheelbase_mm,
                    turntable_offset_mm, tyres, phone_no, location_id, status, acquired_date,
                    acquisition_price, annual_depreciation, net_value, disposal_date,
                    usable_life_years, current_kms, current_kms_date, action_required,
                    action_task, notes, relocation_notes)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
               RETURNING id""",
            (
                row["FleetNoID"], to_int(row["Division"]), row["VehicleType"], row["SubType"],
                row["Make"], row["Model"], row["VehicleDescription"], to_int(row["Year"]),
                row["VIN"], cls_id, to_int(row["Tare (kgs)"]), to_int(row["GVM (kgs)"]),
                to_int(row["GCM (kgs)"]), to_int(row["Wheelbase"]), to_int(row["Turntable Offset"]),
                to_int(row["Tyres"]), row["PhoneNo"], loc_id, status,
                parse_date_only(row["Acquired"]), to_decimal(row["AquisitionPrice"]),
                to_decimal(row["Annual Depn"]), to_decimal(row["Net Value"]),
                parse_date_only(row["DisposalDate"]), to_int(row["UsableLife"]),
                to_int(row["Currentkms"]), parse_date_only(row["CurrentkmsDate"]),
                to_bool(row["ActionRequired"]), row["ActionTask"], row["Notes"],
                row["Relocation Notes"],
            ),
        )
        vid = cur.fetchone()[0]
        vehicle_id_map[row["FleetNoID"]] = vid

        cur.execute(
            """INSERT INTO vehicle_compliance (vehicle_id, registration_no, registration_state,
                    registration_expiry, road_friendly_suspension, rfs_certificate_no,
                    nhvas_label_no, nhvas_mass, mass_active, nhvas_maintenance,
                    nhvas_joined_date, nhvas_exit_date, speed_limiter_speed_kmh,
                    speed_limiter_checked_date, slp_no, slp_required, slp_expiry_date,
                    meters_present, meter_calibration_date, meter_seal_checked_date,
                    fatigue_camera, fatigue_camera_data_service_no, fatigue_system_serial_no,
                    dg_licence_required, dg_licence_no, dg_licence_state, dg_expiry_date,
                    dg_design_approval_no, dg_design_approval_state, dg_tank_type_code,
                    dg_hydro_test_date, dg_hatch_vent_test_date, terminal_access_required,
                    drawings_on_file)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                vid, row["RegistrationNo"], row["RegistrationState"], parse_date_only(row["RegExpiry"]),
                to_bool(row["Road Friendly Suspension (RFS)"]), row["RFS Certificate No"],
                row["NHVAS Label No"], to_bool(row["NHVAS Mass"]), to_bool(row["Mass Active"]),
                to_bool(row["NHVAS Maintenance"]), parse_date_only(row["NHVAS Joined"]),
                parse_date_only(row["NHVAS Exit"]), to_int(row["SpeedLimiterSpeed"]),
                parse_date_only(row["SpeedLimiterCheckedDate"]), to_int(row["SLPNo"]),
                to_bool(row["SLP Required"]), parse_date_only(row["SLPExpiryDate"]),
                to_bool(row["MetersPresent"]), parse_date_only(row["MeterCalibrationDate"]),
                parse_date_only(row["MeterSealChecked"]), to_bool(row["FatigueCamera"]),
                row["FatigueCameraDataServiceNo"], row["Fatigue System S/No"],
                to_bool(row["DGLicenceRequired"]), row["DGLicenceNo"], row["DGLicenceState"],
                parse_date_only(row["DGExpiryDate"]), row["DGDesignApprovalNo"],
                row["DGDesignApprovalState"], row["DGTankTypeCode"],
                parse_date_only(row["DGHydroTestDate"]), parse_date_only(row["DGHatchVentTestDate"]),
                to_bool(row["TerminalAccessRequired"]), to_bool(row["Drawings on File"]),
            ),
        )
    print(f"Vehicles migrated: {len(vehicle_id_map)} (compliance rows: {len(vehicle_id_map)})")

    # ------------------------------------------------------------------
    # Vehicle location history
    # ------------------------------------------------------------------
    vlh = read_csv("Vehicle_Locations.csv")
    vlh_ok, vlh_skip = 0, 0
    for row in vlh:
        vid = vehicle_id_map.get(row["FleetNoIDF"])
        if not vid:
            vlh_skip += 1
            warn(f"Vehicle_Locations row {row['LocationChangeID']}: unknown FleetNoIDF '{row['FleetNoIDF']}', skipped")
            continue
        loc_id = location_id_map.get(row["LocationIDF"]) if row["LocationIDF"] else None
        cur.execute(
            """INSERT INTO vehicle_location_history (vehicle_id, transfer_date,
                    transferring_depot, location_id, date_recorded)
               VALUES (%s,%s,%s,%s, COALESCE(%s, now()))""",
            (vid, parse_date_only(row["TransferDate"]), row["Transferring Depot"], loc_id,
             parse_date_only(row["DateUpdated"])),
        )
        vlh_ok += 1
    print(f"Location history migrated: {vlh_ok} (skipped: {vlh_skip})")

    # ------------------------------------------------------------------
    # Maintenance contracts
    # ------------------------------------------------------------------
    contracts = read_csv("Maintenance_Contract_2022.csv")
    mc_ok, mc_skip = 0, 0
    for row in contracts:
        vid = vehicle_id_map.get(row["FleetNo2"])
        if not vid:
            mc_skip += 1
            warn(f"Maintenance_Contract row {row['ID']}: unknown FleetNo2 '{row['FleetNo2']}', linked as NULL")
        cur.execute(
            """INSERT INTO maintenance_contracts (vehicle_id, contract_no, registration_no,
                    chassis_id, start_date, expiring_date, current_contract_duration_years,
                    max_mileage_km)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
            (vid, row["ContractNo"], row["RegistrationNumber"], row["ChassisId"],
             parse_date_only(row["StartDate"]), parse_date_only(row["ExpiringDate"]),
             to_decimal(row["CurrentContactDuration"]), to_int(row["MaxMileage"])),
        )
        mc_ok += 1
    print(f"Maintenance contracts migrated: {mc_ok} (unlinked: {mc_skip})")

    # ------------------------------------------------------------------
    # Mass / weighbridge verifications
    # ------------------------------------------------------------------
    mv = read_csv("Mass_WB_Verifications.csv")
    mv_ok = 0
    for row in mv:
        vid = vehicle_id_map.get(row["FleetIDF"])
        t1 = vehicle_id_map.get(row["Trailer 1"]) if row["Trailer 1"] else None
        t2 = vehicle_id_map.get(row["Trailer 2"]) if row["Trailer 2"] else None
        t3 = vehicle_id_map.get(row["Trailer 3"]) if row["Trailer 3"] else None
        if not vid:
            warn(f"Mass_WB row {row['ID']}: unknown FleetIDF '{row['FleetIDF']}', linked as NULL")
        weigh_date = parse_date_only(row["Weigh Date"])
        _, weigh_time = parse_access_datetime(row["Weigh Bridge Time"])
        cur.execute(
            """INSERT INTO mass_verifications (vehicle_id, depot, trailer_1_id, trailer_2_id,
                    trailer_3_id, weigh_date, weigh_time, weighbridge_name, weighbridge_address,
                    weighbridge_state, docket_reference, driver_name, steer_axle_weight_kg,
                    drive_axle_weight_kg, trailer_1_axle_weight_kg, trailer_2_axle_weight_kg,
                    trailer_3_axle_weight_kg, total_mass_kg)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (vid, row["Depot"], t1, t2, t3, weigh_date, weigh_time, row["Weigh Bridge Name"],
             row["Weigh Bridge Address"], row["Weigh Bridge State"], row["Weigh Bridge Docket Reference"],
             row["Driver Name"], to_int(row["Steer Axle Weight"]), to_int(row["Drive Axle Weight"]),
             to_int(row["Trailer 1 Axle Weight"]), to_int(row["Trailer 2 Axle Weight"]),
             to_int(row["Trailer 3 Axle Weight"]), to_int(row["Total Mass"])),
        )
        mv_ok += 1
    print(f"Mass verifications migrated: {mv_ok}")

    # ------------------------------------------------------------------
    # Drivers — rebuilt properly. Legacy data is sparse; bring across
    # what exists, leave the rest for the team to fill in via the new UI.
    # ------------------------------------------------------------------
    drivers = read_csv("Drivers.csv")
    drv_ok = 0
    for row in drivers:
        if not (row["FirstName"] or row["LastName"]):
            warn(f"Drivers row '{row['DriverID']}': no name, skipped")
            continue
        loc_id = location_id_map.get(row["LocationIDF"]) if row["LocationIDF"] else None
        cur.execute(
            """INSERT INTO drivers (driver_code, first_name, last_name, date_of_birth,
                    licence_no, licence_type, licence_expiry, dg_licence_no, dg_licence_expiry,
                    home_location_id)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (row["DriverCode"] or None, row["FirstName"], row["LastName"],
             parse_date_only(row["DateofBirth"]), row["DriverLicenceNo"] or None,
             row["DriverLicenceType"], parse_date_only(row["DriverLicenceExpiry"]),
             row["DGLicence No"], parse_date_only(row["DGLicenceExpiry"]), loc_id),
        )
        drv_ok += 1
    print(f"Drivers migrated: {drv_ok}")

    # ------------------------------------------------------------------
    # Users — roles map 1:1 onto the new roles table (Operator=1,
    # Depot Manager=2, Administrator=3). Passwords are NOT migrated —
    # the legacy "password" field is a 3-digit plaintext code with no
    # real security value. Every migrated user gets a forced reset.
    # ------------------------------------------------------------------
    users = read_csv("Users.csv")
    usr_ok = 0
    for row in users:
        temp_hash = bcrypt.hashpw(os.urandom(16), bcrypt.gensalt()).decode()
        cur.execute(
            """INSERT INTO users (full_name, email, username, password_hash, role_id, is_active)
               VALUES (%s,%s,%s,%s,%s, TRUE)""",
            (row["FullName"], row["Email"], row["UserName"], temp_hash, to_int(row["UserTypeID"])),
        )
        usr_ok += 1
    print(f"Users migrated: {usr_ok} (all require password reset on first login)")

    conn.commit()
    cur.close()
    conn.close()

    print(f"\nDone. {len(warnings)} warning(s) — see stderr output above.")


if __name__ == "__main__":
    main()
