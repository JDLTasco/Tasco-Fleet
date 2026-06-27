import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const rows = await query(
    `SELECT m.id, m.weigh_date, m.weighbridge_name, m.depot, m.docket_reference, m.total_mass_kg,
            v.fleet_no
     FROM mass_verifications m LEFT JOIN vehicles v ON v.id = m.vehicle_id
     ORDER BY m.weigh_date DESC LIMIT 50`
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const b = await req.json();
  if (!b.fleet_no || !b.weigh_date) {
    return NextResponse.json({ error: "Fleet number and weigh date are required" }, { status: 400 });
  }

  const vehicleRows = await query<{ id: string }>("SELECT id FROM vehicles WHERE fleet_no = $1", [b.fleet_no]);
  if (!vehicleRows[0]) {
    return NextResponse.json({ error: `No vehicle found with fleet number ${b.fleet_no}` }, { status: 400 });
  }

  const totalMass =
    (Number(b.steer_axle_weight_kg) || 0) +
    (Number(b.drive_axle_weight_kg) || 0) +
    (Number(b.trailer_1_axle_weight_kg) || 0) +
    (Number(b.trailer_2_axle_weight_kg) || 0) +
    (Number(b.trailer_3_axle_weight_kg) || 0);

  const rows = await query<{ id: string }>(
    `INSERT INTO mass_verifications (vehicle_id, depot, weigh_date, weigh_time, weighbridge_name,
            weighbridge_address, weighbridge_state, docket_reference, driver_name, submitted_by,
            steer_axle_weight_kg, drive_axle_weight_kg, trailer_1_axle_weight_kg,
            trailer_2_axle_weight_kg, trailer_3_axle_weight_kg, total_mass_kg)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
    [vehicleRows[0].id, b.depot, b.weigh_date, b.weigh_time || null, b.weighbridge_name,
     b.weighbridge_address, b.weighbridge_state, b.docket_reference, b.driver_name, session.userId,
     b.steer_axle_weight_kg || null, b.drive_axle_weight_kg || null, b.trailer_1_axle_weight_kg || null,
     b.trailer_2_axle_weight_kg || null, b.trailer_3_axle_weight_kg || null, totalMass]
  );
  await logAudit("mass_verifications", rows[0].id, "insert", session.userId, b);
  return NextResponse.json({ id: rows[0].id, total_mass_kg: totalMass }, { status: 201 });
}
