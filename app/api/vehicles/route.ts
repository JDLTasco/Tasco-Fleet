import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("q");
  const conditions: string[] = [];
  const params: any[] = [];

  if (status) {
    params.push(status);
    conditions.push(`v.status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(v.fleet_no ILIKE $${params.length} OR v.make ILIKE $${params.length} OR v.model ILIKE $${params.length} OR c.registration_no ILIKE $${params.length})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query(
    `SELECT v.id, v.fleet_no, v.vehicle_type, v.sub_type, v.make, v.model, v.status,
            v.current_kms, l.name AS location_name, c.registration_no, c.registration_expiry
     FROM vehicles v
     LEFT JOIN locations l ON l.id = v.location_id
     LEFT JOIN vehicle_compliance c ON c.vehicle_id = v.id
     ${where}
     ORDER BY v.fleet_no`,
    params
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.fleet_no) {
    return NextResponse.json({ error: "fleet_no is required" }, { status: 400 });
  }
  const rows = await query<{ id: string }>(
    `INSERT INTO vehicles (fleet_no, vehicle_type, sub_type, make, model, description, year, vin, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, 'active') RETURNING id`,
    [body.fleet_no, body.vehicle_type, body.sub_type, body.make, body.model, body.description, body.year, body.vin]
  );
  await query(`INSERT INTO vehicle_compliance (vehicle_id) VALUES ($1)`, [rows[0].id]);
  await logAudit("vehicles", rows[0].id, "insert", null, body);
  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
