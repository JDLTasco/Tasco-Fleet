import Link from "next/link";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status: statusParam, q: qParam } = await searchParams;
  const status = statusParam || "active";
  const q = qParam || "";

  const conditions: string[] = [];
  const params: any[] = [];
  if (status !== "all") {
    params.push(status);
    conditions.push(`v.status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(v.fleet_no ILIKE $${params.length} OR v.make ILIKE $${params.length} OR v.model ILIKE $${params.length})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const vehicles = await query(
    `SELECT v.id, v.fleet_no, v.vehicle_type, v.sub_type, v.make, v.model, v.status,
            v.current_kms, l.name AS location_name, c.registration_no, c.registration_expiry
     FROM vehicles v
     LEFT JOIN locations l ON l.id = v.location_id
     LEFT JOIN vehicle_compliance c ON c.vehicle_id = v.id
     ${where}
     ORDER BY v.fleet_no`,
    params
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Vehicles</h2>
        <form style={{ display: "flex", gap: 8 }}>
          <input name="q" placeholder="Search fleet no, make, model" defaultValue={q} />
          <select name="status" defaultValue={status}>
            <option value="active">Active</option>
            <option value="disposed">Disposed</option>
            <option value="all">All</option>
          </select>
          <button type="submit">Filter</button>
        </form>
      </div>

      <table>
        <thead>
          <tr>
            <th>Fleet No</th><th>Type</th><th>Make / Model</th><th>Rego</th><th>Rego Expiry</th>
            <th>Current Kms</th><th>Location</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v: any) => (
            <tr key={v.id}>
              <td><Link href={`/vehicles/${v.id}`}>{v.fleet_no}</Link></td>
              <td>{v.vehicle_type}{v.sub_type ? ` — ${v.sub_type}` : ""}</td>
              <td>{[v.make, v.model].filter(Boolean).join(" ")}</td>
              <td>{v.registration_no || "—"}</td>
              <td>{v.registration_expiry ? new Date(v.registration_expiry).toLocaleDateString("en-AU") : "—"}</td>
              <td>{v.current_kms?.toLocaleString() || "—"}</td>
              <td>{v.location_name || "—"}</td>
              <td><span className={`badge ${v.status}`}>{v.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {vehicles.length === 0 && <p style={{ color: "#888", marginTop: 16 }}>No vehicles match this filter.</p>}
    </div>
  );
}
