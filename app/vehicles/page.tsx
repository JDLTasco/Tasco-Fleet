import Link from "next/link";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import VehicleActions from "@/components/VehicleActions";
import VehicleRowActions from "@/components/VehicleRowActions";

export const dynamic = "force-dynamic";

const VEHICLE_TYPES = ["Prime Mover","Rigid","Trailer","Tanker","B-Double","Road Train","B-Train","Other"];

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; type?: string; depot?: string }>;
}) {
  const { status: statusParam, q: qParam, type: typeParam, depot: depotParam } = await searchParams;
  const session = await getSession();
  const status = statusParam || "active";
  const q = qParam || "";
  const type = typeParam || "";

  const conditions: string[] = [];
  const params: any[] = [];

  if (status !== "all") {
    params.push(status);
    conditions.push(`v.status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(v.fleet_no ILIKE $${params.length} OR v.make ILIKE $${params.length} OR v.model ILIKE $${params.length} OR c.registration_no ILIKE $${params.length})`);
  }
  if (type) {
    params.push(type);
    conditions.push(`v.vehicle_type = $${params.length}`);
  }
  // In depot mode, lock to session depot; in admin mode allow manual depot filter
  if (session?.mode === "depot" && session.depotId) {
    params.push(session.depotId);
    conditions.push(`v.location_id = $${params.length}`);
  } else if (depotParam) {
    params.push(depotParam);
    conditions.push(`v.location_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [vehicles, locations] = await Promise.all([
    query(
      `SELECT v.id, v.fleet_no, v.vehicle_type, v.sub_type, v.make, v.model, v.status,
              v.current_kms, v.location_id, l.name AS location_name,
              c.registration_no, c.registration_expiry
       FROM vehicles v
       LEFT JOIN locations l ON l.id = v.location_id
       LEFT JOIN vehicle_compliance c ON c.vehicle_id = v.id
       ${where}
       ORDER BY v.fleet_no`,
      params
    ),
    query<{ id: string; name: string }>(`SELECT id, name FROM locations ORDER BY name`),
  ]);

  const depotLabel = session?.mode === "depot" && session.depotName
    ? `Depot: ${session.depotName}`
    : "All Depots — Admin View";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Vehicles</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#1B3A6B", fontWeight: 600 }}>{depotLabel}</p>
        </div>
        <VehicleActions locations={locations} />
      </div>

      <form style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 2, minWidth: 180 }}>
          <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 2 }}>Search</label>
          <input name="q" placeholder="Fleet no, make, model, rego…" defaultValue={q} />
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 2 }}>Vehicle Type</label>
          <select name="type" defaultValue={type}>
            <option value="">All types</option>
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {session?.mode !== "depot" && (
          <div style={{ minWidth: 160 }}>
            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 2 }}>Depot</label>
            <select name="depot" defaultValue={depotParam || ""}>
              <option value="">All depots</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}
        <div style={{ minWidth: 130 }}>
          <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 2 }}>Status</label>
          <select name="status" defaultValue={status}>
            <option value="active">Active</option>
            <option value="disposed">Archived</option>
            <option value="all">All</option>
          </select>
        </div>
        <button type="submit" style={{ alignSelf: "flex-end" }}>Filter</button>
        <a href="/vehicles" style={{ alignSelf: "flex-end", fontSize: 13, color: "#888", textDecoration: "none", paddingBottom: 6 }}>Clear</a>
      </form>

      <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px" }}>{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}</p>

      <table>
        <thead>
          <tr>
            <th>Fleet No</th><th>Type</th><th>Make / Model</th>
            <th>Rego</th><th>Rego Expiry</th><th>Kms</th>
            <th>Depot</th><th>Status</th><th>Actions</th>
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
              <td>
                <VehicleRowActions
                  vehicleId={v.id} fleetNo={v.fleet_no}
                  status={v.status} currentDepotId={v.location_id} locations={locations}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {vehicles.length === 0 && <p style={{ color: "#888", marginTop: 16 }}>No vehicles match this filter.</p>}
    </div>
  );
}
