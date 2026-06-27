import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  const driverId = searchParams.get("driverId");
  const incidentType = searchParams.get("incidentType");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const fleetNo = searchParams.get("fleetNo");
  const depot = searchParams.get("depot");

  const conditions: string[] = [];
  const vals: any[] = [];

  if (vehicleId) { vals.push(vehicleId); conditions.push(`nc.vehicle_id = $${vals.length}`); }
  if (driverId) { vals.push(driverId); conditions.push(`nc.driver_id = $${vals.length}`); }
  if (incidentType) { vals.push(incidentType); conditions.push(`nc.incident_type = $${vals.length}`); }
  if (from) { vals.push(from); conditions.push(`nc.incident_date >= $${vals.length}`); }
  if (to) { vals.push(to); conditions.push(`nc.incident_date <= $${vals.length}`); }
  if (fleetNo) { vals.push(`%${fleetNo}%`); conditions.push(`v.fleet_no ILIKE $${vals.length}`); }
  if (depot) { vals.push(depot); conditions.push(`v.location_id = $${vals.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query(
    `SELECT nc.id, nc.incident_type, nc.description, nc.incident_date, nc.notes, nc.created_at,
            v.fleet_no, v.make, v.model, l.name AS depot_name,
            d.first_name || ' ' || d.last_name AS driver_name, d.driver_code
     FROM non_conformances nc
     LEFT JOIN vehicles v ON v.id = nc.vehicle_id
     LEFT JOIN locations l ON l.id = v.location_id
     LEFT JOIN drivers d ON d.id = nc.driver_id
     ${where}
     ORDER BY nc.incident_date DESC, nc.created_at DESC`,
    vals
  );
  return NextResponse.json(rows);
}
