import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const depot = searchParams.get("depot");
  const fleetNo = searchParams.get("fleetNo");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const conditions: string[] = [];
  const vals: any[] = [];

  if (depot) { vals.push(depot); conditions.push(`v.location_id = $${vals.length}`); }
  if (fleetNo) { vals.push(`%${fleetNo}%`); conditions.push(`v.fleet_no ILIKE $${vals.length}`); }
  if (from) { vals.push(from); conditions.push(`k.reading_date >= $${vals.length}`); }
  if (to) { vals.push(to); conditions.push(`k.reading_date <= $${vals.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query(
    `SELECT k.id, k.kms, k.reading_date, k.notes, k.recorded_at,
            v.fleet_no, v.make, v.model, v.vehicle_type,
            l.name AS location_name
     FROM vehicle_km_history k
     JOIN vehicles v ON v.id = k.vehicle_id
     LEFT JOIN locations l ON l.id = v.location_id
     ${where}
     ORDER BY k.reading_date DESC, v.fleet_no`,
    vals
  );

  return NextResponse.json(rows);
}
