import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession, roleAtLeast, ROLE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const rows = await query(
    `SELECT d.id, d.driver_code, d.first_name, d.last_name, d.licence_no, d.licence_type,
            d.licence_expiry, d.dg_licence_no, d.dg_licence_expiry, d.status, l.name AS home_location
     FROM drivers d LEFT JOIN locations l ON l.id = d.home_location_id
     ORDER BY d.last_name, d.first_name`
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!roleAtLeast(session, ROLE.DEPOT_MANAGER)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const body = await req.json();
  if (!body.first_name || !body.last_name) {
    return NextResponse.json({ error: "First and last name required" }, { status: 400 });
  }
  const rows = await query<{ id: string }>(
    `INSERT INTO drivers (driver_code, first_name, last_name, licence_no, licence_type,
            licence_state, licence_expiry, dg_licence_no, dg_licence_expiry, phone, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active') RETURNING id`,
    [body.driver_code, body.first_name, body.last_name, body.licence_no, body.licence_type,
     body.licence_state, body.licence_expiry, body.dg_licence_no, body.dg_licence_expiry, body.phone]
  );
  await logAudit("drivers", rows[0].id, "insert", session!.userId, body);
  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
