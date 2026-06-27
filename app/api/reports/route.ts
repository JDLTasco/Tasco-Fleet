import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const conditions: string[] = [];
  const params: unknown[] = [];

  function add(col: string, val: string | null, op = "ILIKE") {
    if (!val) return;
    params.push(op === "ILIKE" ? `%${val}%` : val);
    conditions.push(`${col} ${op} $${params.length}`);
  }

  const depot = p.get("depot");
  if (depot) { params.push(depot); conditions.push(`l.id = $${params.length}`); }

  add("v.vehicle_type", p.get("vehicleType"), "ILIKE");
  add("v.make",        p.get("make"),        "ILIKE");
  add("v.model",       p.get("model"),       "ILIKE");
  add("v.fleet_no",    p.get("fleetNo"),     "ILIKE");
  add("v.vin",         p.get("vin"),         "ILIKE");
  add("c.registration_no",    p.get("registrationNo"),    "ILIKE");
  add("c.registration_state", p.get("registrationState"), "ILIKE");

  const status = p.get("status");
  if (status && status !== "all") { params.push(status); conditions.push(`v.status = $${params.length}`); }

  if (p.get("nhvasMass") === "true")          conditions.push("c.nhvas_mass = true");
  if (p.get("dgLicenceRequired") === "true")  conditions.push("c.dg_licence_required = true");

  const acquiredFrom = p.get("acquiredFrom");
  if (acquiredFrom) { params.push(acquiredFrom); conditions.push(`v.acquired_date >= $${params.length}`); }
  const acquiredTo = p.get("acquiredTo");
  if (acquiredTo)   { params.push(acquiredTo);   conditions.push(`v.acquired_date <= $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query(
    `SELECT
       v.fleet_no, v.vehicle_type, v.sub_type, v.make, v.model, v.year, v.vin, v.status,
       v.tare_kg, v.gvm_kg, v.gcm_kg, v.current_kms, v.acquired_date, v.acquisition_price,
       l.name  AS location_name,
       cl.class AS class_name,
       c.registration_no, c.registration_state, c.registration_expiry,
       c.nhvas_mass, c.mass_active,
       c.dg_licence_required, c.dg_expiry_date
     FROM vehicles v
     LEFT JOIN locations          l  ON l.id  = v.location_id
     LEFT JOIN vehicle_classes    cl ON cl.id = v.class_id
     LEFT JOIN vehicle_compliance c  ON c.vehicle_id = v.id
     ${where}
     ORDER BY v.fleet_no`,
    params
  );

  return NextResponse.json(rows);
}
