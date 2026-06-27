import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const depot = p.get("depot");
  const state = p.get("state");
  const vehicleType = p.get("vehicleType");
  const daysAhead = parseInt(p.get("daysAhead") || "90", 10);
  const includeExpired = p.get("includeExpired") === "true";
  const fleetNo = p.get("fleetNo");

  const conditions: string[] = ["v.status = 'active'"];
  const params: any[] = [];

  if (daysAhead > 0 && !includeExpired) {
    params.push(daysAhead);
    conditions.push(`c.registration_expiry <= (CURRENT_DATE + ($${params.length} || ' days')::interval)`);
    conditions.push(`c.registration_expiry >= CURRENT_DATE`);
  } else if (includeExpired) {
    params.push(daysAhead);
    conditions.push(`c.registration_expiry <= (CURRENT_DATE + ($${params.length} || ' days')::interval)`);
  }

  if (depot) {
    params.push(depot);
    conditions.push(`v.location_id = $${params.length}`);
  }
  if (state) {
    params.push(state.toUpperCase());
    conditions.push(`c.registration_state = $${params.length}`);
  }
  if (vehicleType) {
    params.push(vehicleType);
    conditions.push(`v.vehicle_type = $${params.length}`);
  }
  if (fleetNo) {
    params.push(`%${fleetNo}%`);
    conditions.push(`v.fleet_no ILIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query(
    `SELECT v.id, v.fleet_no, v.vehicle_type, v.make, v.model, l.name AS location_name,
            c.registration_no, c.registration_state, c.registration_expiry,
            (c.registration_expiry::date - CURRENT_DATE) AS days_until_expiry
     FROM vehicles v
     LEFT JOIN locations l ON l.id = v.location_id
     LEFT JOIN vehicle_compliance c ON c.vehicle_id = v.id
     ${where}
     ORDER BY c.registration_expiry ASC NULLS LAST`,
    params
  );

  return NextResponse.json(rows);
}
