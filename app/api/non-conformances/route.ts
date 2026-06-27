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

  const conditions: string[] = [];
  const vals: any[] = [];

  if (vehicleId) { vals.push(vehicleId); conditions.push(`nc.vehicle_id = $${vals.length}`); }
  if (driverId) { vals.push(driverId); conditions.push(`nc.driver_id = $${vals.length}`); }
  if (incidentType) { vals.push(incidentType); conditions.push(`nc.incident_type = $${vals.length}`); }
  if (from) { vals.push(from); conditions.push(`nc.incident_date >= $${vals.length}`); }
  if (to) { vals.push(to); conditions.push(`nc.incident_date <= $${vals.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query(
    `SELECT nc.id, nc.incident_type, nc.description, nc.incident_date, nc.notes, nc.created_at,
            v.fleet_no, v.make, v.model,
            d.first_name || ' ' || d.last_name AS driver_name, d.driver_code,
            l.name AS depot_name
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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { vehicle_id, driver_id, incident_type, description, incident_date, notes } = body;

  if (!incident_type || !description || !incident_date) {
    return NextResponse.json({ error: "incident_type, description and incident_date are required" }, { status: 400 });
  }
  if (description.length > 50) {
    return NextResponse.json({ error: "Description must be 50 characters or fewer" }, { status: 400 });
  }

  const rows = await query<{ id: string }>(
    `INSERT INTO non_conformances (vehicle_id, driver_id, incident_type, description, incident_date, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [vehicle_id || null, driver_id || null, incident_type, description, incident_date, notes || null]
  );
  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
