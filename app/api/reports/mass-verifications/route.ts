import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const fleetNo = p.get("fleetNo");
  const depot = p.get("depot");
  const dateFrom = p.get("dateFrom");
  const dateTo = p.get("dateTo");

  const conditions: string[] = [];
  const params: any[] = [];

  if (fleetNo) {
    params.push(`%${fleetNo}%`);
    conditions.push(`v.fleet_no ILIKE $${params.length}`);
  }
  if (depot) {
    params.push(depot);
    conditions.push(`v.location_id = $${params.length}`);
  }
  if (dateFrom) {
    params.push(dateFrom);
    conditions.push(`m.weigh_date >= $${params.length}`);
  }
  if (dateTo) {
    params.push(dateTo);
    conditions.push(`m.weigh_date <= $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query(
    `SELECT m.id, m.weigh_date, m.weigh_time, m.depot, m.weighbridge_name,
            m.weighbridge_address, m.weighbridge_state, m.docket_reference,
            m.driver_name, m.steer_axle_weight_kg, m.drive_axle_weight_kg,
            m.trailer_1_axle_weight_kg, m.trailer_2_axle_weight_kg,
            m.trailer_3_axle_weight_kg, m.total_mass_kg,
            v.fleet_no, l.name AS location_name
     FROM mass_verifications m
     LEFT JOIN vehicles v ON v.id = m.vehicle_id
     LEFT JOIN locations l ON l.id = v.location_id
     ${where}
     ORDER BY m.weigh_date DESC`,
    params
  );

  return NextResponse.json(rows);
}
