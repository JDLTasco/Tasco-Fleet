import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const depot = p.get("depot");
  const status = p.get("status") || "active";
  const licenceType = p.get("licenceType");
  const dgOnly = p.get("dgOnly") === "true";

  const conditions: string[] = [];
  const params: any[] = [];

  if (status !== "all") {
    params.push(status);
    conditions.push(`d.status = $${params.length}`);
  }
  if (licenceType) {
    params.push(`%${licenceType}%`);
    conditions.push(`d.licence_type ILIKE $${params.length}`);
  }
  if (dgOnly) {
    conditions.push(`d.dg_licence_no IS NOT NULL AND d.dg_licence_no != ''`);
  }
  if (depot) {
    params.push(depot);
    conditions.push(`dl.location_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query(
    `SELECT d.id, d.driver_code, d.first_name, d.last_name, d.licence_no, d.licence_type,
            d.licence_expiry, d.dg_licence_no, d.dg_licence_expiry, d.phone, d.status,
            string_agg(DISTINCT l.name, ', ' ORDER BY l.name) AS depots
     FROM drivers d
     LEFT JOIN driver_locations dl ON dl.driver_id = d.id
     LEFT JOIN locations l ON l.id = dl.location_id
     ${where}
     GROUP BY d.id, d.driver_code, d.first_name, d.last_name, d.licence_no, d.licence_type,
              d.licence_expiry, d.dg_licence_no, d.dg_licence_expiry, d.phone, d.status
     ORDER BY d.last_name, d.first_name`,
    params
  );

  return NextResponse.json(rows);
}
