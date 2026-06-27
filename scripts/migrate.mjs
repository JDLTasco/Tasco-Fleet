import pg from "pg";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomBytes } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, "../raw");

const warnings = [];
function warn(msg) {
  warnings.push(msg);
  process.stderr.write("WARNING: " + msg + "\n");
}

// ---------------------------------------------------------------------------
// CSV parser — handles quoted fields with embedded commas/newlines
// ---------------------------------------------------------------------------
function parseCSV(text) {
  const rows = [];
  let headers = null;
  let i = 0;
  const n = text.length;

  function parseField() {
    if (i < n && text[i] === '"') {
      i++; // opening quote
      let val = "";
      while (i < n) {
        if (text[i] === '"') {
          i++;
          if (i < n && text[i] === '"') { val += '"'; i++; } // escaped quote
          else break; // closing quote
        } else {
          val += text[i++];
        }
      }
      return val;
    } else {
      let val = "";
      while (i < n && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
        val += text[i++];
      }
      return val;
    }
  }

  function parseLine() {
    const fields = [];
    while (i < n && text[i] !== "\n" && text[i] !== "\r") {
      fields.push(parseField());
      if (i < n && text[i] === ",") i++;
    }
    // consume line ending
    if (i < n && text[i] === "\r") i++;
    if (i < n && text[i] === "\n") i++;
    return fields;
  }

  while (i < n) {
    if (text[i] === "\r" || text[i] === "\n") { // blank line
      if (text[i] === "\r") i++;
      if (i < n && text[i] === "\n") i++;
      continue;
    }
    const line = parseLine();
    if (!headers) {
      headers = line;
    } else {
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = j < line.length ? line[j] : "";
      }
      rows.push(obj);
    }
  }
  return rows;
}

function readCSV(name) {
  const text = readFileSync(join(RAW_DIR, name), "utf8");
  return parseCSV(text);
}

// ---------------------------------------------------------------------------
// Type coercions matching migrate.py exactly
// ---------------------------------------------------------------------------
function toBool(v) {
  return v === "1" || (v || "").trim().toLowerCase() === "true";
}

function toInt(v) {
  v = (v || "").trim();
  if (!v) return null;
  const n = parseInt(parseFloat(v), 10);
  return isNaN(n) ? null : n;
}

function toDecimal(v) {
  v = (v || "").trim();
  if (!v) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

const ACCESS_NULL = { mo: 12, da: 30, yy: 99 };

function parseAccessDatetime(v) {
  v = (v || "").trim();
  if (!v) return [null, null];
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (!m) return [null, null];
  const [, mo, da, yy, hh, mi, ss] = m.map(Number);
  const timeStr = `${String(hh).padStart(2,"0")}:${String(mi).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
  if (mo === ACCESS_NULL.mo && da === ACCESS_NULL.da && yy === ACCESS_NULL.yy) {
    return [null, timeStr];
  }
  const year = 2000 + yy;
  const dateStr = `${year}-${String(mo).padStart(2,"0")}-${String(da).padStart(2,"0")}`;
  return [dateStr, timeStr];
}

function parseDateOnly(v) {
  return parseAccessDatetime(v)[0];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

await client.connect();
await client.query("BEGIN");

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------
const locations = readCSV("Locations.csv");
const locationIdMap = {};
for (const row of locations) {
  const res = await client.query(
    `INSERT INTO locations (legacy_id, name, address, city, state, postcode,
        contact, phone, location_type, email)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [
      row["LocationID"], row["Location Name"], row["Address"], row["City"],
      row["State"], row["Postcode"], row["Contact"], row["Phone No"],
      row["LocationType"], row["Email"],
    ]
  );
  locationIdMap[row["LocationID"]] = res.rows[0].id;
}
console.log(`Locations migrated: ${Object.keys(locationIdMap).length}`);

// ---------------------------------------------------------------------------
// Vehicle classes
// ---------------------------------------------------------------------------
const classes = readCSV("Vehicle_Classes.csv");
const classIdMap = {};
for (const row of classes) {
  const res = await client.query(
    `INSERT INTO vehicle_classes (legacy_id, class, description, state,
        annual_registration_fee, quarterly_registration_fee, cost_leasing,
        registration_cost, insurance_cost, fuel_and_oil_cost, wage_rate,
        wage_classification, km_per_litre, last_updated)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
    [
      row["ClassID"], row["Class"], row["Description"], row["State"],
      toDecimal(row["AnnualRegistrationFee"]), toDecimal(row["ThreeMonthlyRegistrationFee"]),
      toDecimal(row["CostLeasing"]), toDecimal(row["Registration"]),
      toDecimal(row["Insurance"]), toDecimal(row["FuelAndOil"]),
      toDecimal(row["WageRate"]), row["WageClassification"],
      toInt(row["KMperLT"]), parseDateOnly(row["Last Updated"]),
    ]
  );
  classIdMap[row["ClassID"]] = res.rows[0].id;
}
console.log(`Vehicle classes migrated: ${Object.keys(classIdMap).length}`);

// ---------------------------------------------------------------------------
// Vehicles + compliance
// ---------------------------------------------------------------------------
const vehicles = readCSV("Vehicles.csv");
const vehicleIdMap = {};
for (const row of vehicles) {
  const locId = row["LocationIDF"] ? locationIdMap[row["LocationIDF"]] ?? null : null;
  const clsId = row["ClassIDF"] ? classIdMap[row["ClassIDF"]] ?? null : null;
  const status = (row["DisposalDate"] || "").trim() ? "disposed" : "active";

  const vRes = await client.query(
    `INSERT INTO vehicles (fleet_no, division, vehicle_type, sub_type, make, model,
        description, year, vin, class_id, tare_kg, gvm_kg, gcm_kg, wheelbase_mm,
        turntable_offset_mm, tyres, phone_no, location_id, status, acquired_date,
        acquisition_price, annual_depreciation, net_value, disposal_date,
        usable_life_years, current_kms, current_kms_date, action_required,
        action_task, notes, relocation_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
             $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)
     RETURNING id`,
    [
      row["FleetNoID"], toInt(row["Division"]), row["VehicleType"], row["SubType"],
      row["Make"], row["Model"], row["VehicleDescription"], toInt(row["Year"]),
      row["VIN"], clsId, toInt(row["Tare (kgs)"]), toInt(row["GVM (kgs)"]),
      toInt(row["GCM (kgs)"]), toInt(row["Wheelbase"]), toInt(row["Turntable Offset"]),
      toInt(row["Tyres"]), row["PhoneNo"], locId, status,
      parseDateOnly(row["Acquired"]), toDecimal(row["AquisitionPrice"]),
      toDecimal(row["Annual Depn"]), toDecimal(row["Net Value"]),
      parseDateOnly(row["DisposalDate"]), toInt(row["UsableLife"]),
      toInt(row["Currentkms"]), parseDateOnly(row["CurrentkmsDate"]),
      toBool(row["ActionRequired"]), row["ActionTask"], row["Notes"],
      row["Relocation Notes"],
    ]
  );
  const vid = vRes.rows[0].id;
  vehicleIdMap[row["FleetNoID"]] = vid;

  await client.query(
    `INSERT INTO vehicle_compliance (vehicle_id, registration_no, registration_state,
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
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
             $19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34)`,
    [
      vid, row["RegistrationNo"], row["RegistrationState"], parseDateOnly(row["RegExpiry"]),
      toBool(row["Road Friendly Suspension (RFS)"]), row["RFS Certificate No"],
      row["NHVAS Label No"], toBool(row["NHVAS Mass"]), toBool(row["Mass Active"]),
      toBool(row["NHVAS Maintenance"]), parseDateOnly(row["NHVAS Joined"]),
      parseDateOnly(row["NHVAS Exit"]), toInt(row["SpeedLimiterSpeed"]),
      parseDateOnly(row["SpeedLimiterCheckedDate"]), toInt(row["SLPNo"]),
      toBool(row["SLP Required"]), parseDateOnly(row["SLPExpiryDate"]),
      toBool(row["MetersPresent"]), parseDateOnly(row["MeterCalibrationDate"]),
      parseDateOnly(row["MeterSealChecked"]), toBool(row["FatigueCamera"]),
      row["FatigueCameraDataServiceNo"], row["Fatigue System S/No"],
      toBool(row["DGLicenceRequired"]), row["DGLicenceNo"], row["DGLicenceState"],
      parseDateOnly(row["DGExpiryDate"]), row["DGDesignApprovalNo"],
      row["DGDesignApprovalState"], row["DGTankTypeCode"],
      parseDateOnly(row["DGHydroTestDate"]), parseDateOnly(row["DGHatchVentTestDate"]),
      toBool(row["TerminalAccessRequired"]), toBool(row["Drawings on File"]),
    ]
  );
}
console.log(`Vehicles migrated: ${Object.keys(vehicleIdMap).length} (compliance rows: ${Object.keys(vehicleIdMap).length})`);

// ---------------------------------------------------------------------------
// Vehicle location history
// ---------------------------------------------------------------------------
const vlh = readCSV("Vehicle_Locations.csv");
let vlhOk = 0, vlhSkip = 0;
for (const row of vlh) {
  const vid = vehicleIdMap[row["FleetNoIDF"]];
  if (!vid) {
    vlhSkip++;
    warn(`Vehicle_Locations row ${row["LocationChangeID"]}: unknown FleetNoIDF '${row["FleetNoIDF"]}', skipped`);
    continue;
  }
  const locId = row["LocationIDF"] ? locationIdMap[row["LocationIDF"]] ?? null : null;
  await client.query(
    `INSERT INTO vehicle_location_history (vehicle_id, transfer_date,
        transferring_depot, location_id, date_recorded)
     VALUES ($1,$2,$3,$4, COALESCE($5, now()))`,
    [vid, parseDateOnly(row["TransferDate"]), row["Transferring Depot"], locId,
     parseDateOnly(row["DateUpdated"])]
  );
  vlhOk++;
}
console.log(`Location history migrated: ${vlhOk} (skipped: ${vlhSkip})`);

// ---------------------------------------------------------------------------
// Maintenance contracts
// ---------------------------------------------------------------------------
const contracts = readCSV("Maintenance_Contract_2022.csv");
let mcOk = 0, mcSkip = 0;
for (const row of contracts) {
  const vid = vehicleIdMap[row["FleetNo2"]] ?? null;
  if (!vid) {
    mcSkip++;
    warn(`Maintenance_Contract row ${row["ID"]}: unknown FleetNo2 '${row["FleetNo2"]}', linked as NULL`);
  }
  await client.query(
    `INSERT INTO maintenance_contracts (vehicle_id, contract_no, registration_no,
        chassis_id, start_date, expiring_date, current_contract_duration_years,
        max_mileage_km)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [vid, row["ContractNo"], row["RegistrationNumber"], row["ChassisId"],
     parseDateOnly(row["StartDate"]), parseDateOnly(row["ExpiringDate"]),
     toDecimal(row["CurrentContactDuration"]), toInt(row["MaxMileage"])]
  );
  mcOk++;
}
console.log(`Maintenance contracts migrated: ${mcOk} (unlinked: ${mcSkip})`);

// ---------------------------------------------------------------------------
// Mass / weighbridge verifications
// ---------------------------------------------------------------------------
const mv = readCSV("Mass_WB_Verifications.csv");
let mvOk = 0;
for (const row of mv) {
  const vid = vehicleIdMap[row["FleetIDF"]] ?? null;
  const t1 = row["Trailer 1"] ? vehicleIdMap[row["Trailer 1"]] ?? null : null;
  const t2 = row["Trailer 2"] ? vehicleIdMap[row["Trailer 2"]] ?? null : null;
  const t3 = row["Trailer 3"] ? vehicleIdMap[row["Trailer 3"]] ?? null : null;
  if (!vid) {
    warn(`Mass_WB row ${row["ID"]}: unknown FleetIDF '${row["FleetIDF"]}', linked as NULL`);
  }
  const weighDate = parseDateOnly(row["Weigh Date"]);
  const [, weighTime] = parseAccessDatetime(row["Weigh Bridge Time"]);
  await client.query(
    `INSERT INTO mass_verifications (vehicle_id, depot, trailer_1_id, trailer_2_id,
        trailer_3_id, weigh_date, weigh_time, weighbridge_name, weighbridge_address,
        weighbridge_state, docket_reference, driver_name, steer_axle_weight_kg,
        drive_axle_weight_kg, trailer_1_axle_weight_kg, trailer_2_axle_weight_kg,
        trailer_3_axle_weight_kg, total_mass_kg)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [vid, row["Depot"], t1, t2, t3, weighDate, weighTime, row["Weigh Bridge Name"],
     row["Weigh Bridge Address"], row["Weigh Bridge State"], row["Weigh Bridge Docket Reference"],
     row["Driver Name"], toInt(row["Steer Axle Weight"]), toInt(row["Drive Axle Weight"]),
     toInt(row["Trailer 1 Axle Weight"]), toInt(row["Trailer 2 Axle Weight"]),
     toInt(row["Trailer 3 Axle Weight"]), toInt(row["Total Mass"])]
  );
  mvOk++;
}
console.log(`Mass verifications migrated: ${mvOk}`);

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------
const drivers = readCSV("Drivers.csv");
let drvOk = 0;
for (const row of drivers) {
  if (!row["FirstName"] && !row["LastName"]) {
    warn(`Drivers row '${row["DriverID"]}': no name, skipped`);
    continue;
  }
  const locId = row["LocationIDF"] ? locationIdMap[row["LocationIDF"]] ?? null : null;
  await client.query(
    `INSERT INTO drivers (driver_code, first_name, last_name, date_of_birth,
        licence_no, licence_type, licence_expiry, dg_licence_no, dg_licence_expiry,
        home_location_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [row["DriverCode"] || null, row["FirstName"], row["LastName"],
     parseDateOnly(row["DateofBirth"]), row["DriverLicenceNo"] || null,
     row["DriverLicenceType"], parseDateOnly(row["DriverLicenceExpiry"]),
     row["DGLicence No"], parseDateOnly(row["DGLicenceExpiry"]), locId]
  );
  drvOk++;
}
console.log(`Drivers migrated: ${drvOk}`);

// ---------------------------------------------------------------------------
// Users — passwords NOT migrated (plaintext 3-digit codes), all get a
// random locked hash requiring reset via set_password.py
// ---------------------------------------------------------------------------
const users = readCSV("Users.csv");
let usrOk = 0;
for (const row of users) {
  const tempHash = bcrypt.hashSync(randomBytes(16).toString("hex"), 10);
  await client.query(
    `INSERT INTO users (full_name, email, username, password_hash, role_id, is_active)
     VALUES ($1,$2,$3,$4,$5, TRUE)`,
    [row["FullName"], row["Email"], row["UserName"], tempHash, toInt(row["UserTypeID"])]
  );
  usrOk++;
}
console.log(`Users migrated: ${usrOk} (all require password reset on first login)`);

await client.query("COMMIT");
await client.end();

console.log(`\nDone. ${warnings.length} warning(s) — see stderr output above.`);
