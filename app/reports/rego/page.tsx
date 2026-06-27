"use client";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

type Location = { id: string; name: string };
type Row = {
  id: string; fleet_no: string; vehicle_type: string; make: string; model: string;
  location_name: string; registration_no: string; registration_state: string;
  registration_expiry: string; days_until_expiry: number;
};

const VEHICLE_TYPES = ["Prime Mover","Rigid","Trailer","Tanker","B-Double","Road Train","B-Train","Other"];
const STATES = ["VIC","NSW","QLD","SA","WA","TAS","NT","ACT"];

function urgencyStyle(days: number): { background: string; color: string } {
  if (days < 0) return { background: "#fce8e6", color: "#c5221f" };
  if (days <= 14) return { background: "#fce8e6", color: "#c5221f" };
  if (days <= 30) return { background: "#fef3e2", color: "#e37400" };
  if (days <= 60) return { background: "#fefbe6", color: "#8a6d00" };
  return { background: "#e6f4ea", color: "#137333" };
}

export default function RegoReportPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [depot, setDepot] = useState("");
  const [state, setState] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [fleetNo, setFleetNo] = useState("");
  const [daysAhead, setDaysAhead] = useState("90");
  const [includeExpired, setIncludeExpired] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    fetch("/api/locations").then(r => r.json()).then(setLocations);
  }, []);

  async function generate() {
    setLoading(true);
    const p = new URLSearchParams();
    if (depot) p.set("depot", depot);
    if (state) p.set("state", state);
    if (vehicleType) p.set("vehicleType", vehicleType);
    if (fleetNo) p.set("fleetNo", fleetNo);
    p.set("daysAhead", daysAhead);
    if (includeExpired) p.set("includeExpired", "true");
    const res = await fetch(`/api/reports/rego?${p}`);
    setRows(await res.json());
    setGenerated(true);
    setLoading(false);
  }

  function downloadCSV() {
    const headers = ["Fleet No","Type","Make","Model","Depot","Rego No","State","Expiry","Days Until Expiry"];
    const csvRows = [headers, ...rows.map(r => [
      r.fleet_no || "", r.vehicle_type || "", r.make || "", r.model || "",
      r.location_name || "", r.registration_no || "", r.registration_state || "",
      r.registration_expiry ? new Date(r.registration_expiry).toLocaleDateString("en-AU") : "",
      r.days_until_expiry !== null ? String(r.days_until_expiry) : "",
    ])];
    const csv = csvRows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `rego-expiry-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const expiredCount = rows.filter(r => r.days_until_expiry < 0).length;
  const soonCount = rows.filter(r => r.days_until_expiry >= 0 && r.days_until_expiry <= 30).length;

  return (
    <div>
      <div className="no-print" style={{ marginBottom: 20 }}>
        <button onClick={() => window.history.back()} style={{ background: "transparent", color: "#1B3A6B", border: "1px solid #1B3A6B", marginBottom: 16 }}>
          ← Back
        </button>
        <h2 style={{ margin: "0 0 16px", color: "#1B3A6B" }}>Registration Expiry Report</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, background: "#f0f4fa", padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Depot</span>
            <select value={depot} onChange={e => setDepot(e.target.value)}>
              <option value="">All Depots</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Vehicle Type</span>
            <select value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
              <option value="">All Types</option>
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>State</span>
            <select value={state} onChange={e => setState(e.target.value)}>
              <option value="">All States</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Fleet No</span>
            <input value={fleetNo} onChange={e => setFleetNo(e.target.value)} placeholder="e.g. 503" />
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Expiring within (days)</span>
            <select value={daysAhead} onChange={e => setDaysAhead(e.target.value)}>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
              <option value="9999">All</option>
            </select>
          </label>
          <label style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 8, paddingTop: 20 }}>
            <input type="checkbox" checked={includeExpired} onChange={e => setIncludeExpired(e.target.checked)} style={{ width: "auto" }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Include Already Expired</span>
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={generate} disabled={loading} style={{ background: "#1B3A6B" }}>
            {loading ? "Generating…" : "Generate Report"}
          </button>
          {generated && (
            <>
              <button onClick={() => window.print()} style={{ background: "#fff", color: "#1B3A6B", border: "1px solid #1B3A6B" }}>
                Print / Save PDF
              </button>
              <button onClick={downloadCSV} style={{ background: "#fff", color: "#1B3A6B", border: "1px solid #1B3A6B" }}>
                Download CSV
              </button>
              <span style={{ fontSize: 13, color: "#666" }}>{rows.length} vehicle{rows.length !== 1 ? "s" : ""}</span>
              {expiredCount > 0 && <span style={{ fontSize: 13, color: "#c5221f", fontWeight: 600 }}>{expiredCount} EXPIRED</span>}
              {soonCount > 0 && <span style={{ fontSize: 13, color: "#e37400", fontWeight: 600 }}>{soonCount} within 30 days</span>}
            </>
          )}
        </div>
      </div>

      {generated && (
        <>
          <div className="print-only" style={{ marginBottom: 12 }}>
            <strong>Tasco Carriers — Registration Expiry Report</strong>
            <span style={{ marginLeft: 16, fontSize: 12, color: "#666" }}>{new Date().toLocaleDateString("en-AU")}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Fleet No</th><th>Type</th><th>Make / Model</th><th>Depot</th>
                  <th>Rego No</th><th>State</th><th>Expiry Date</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const style = urgencyStyle(r.days_until_expiry);
                  let label = r.days_until_expiry < 0
                    ? `Expired ${Math.abs(r.days_until_expiry)}d ago`
                    : `${r.days_until_expiry}d remaining`;
                  return (
                    <tr key={r.id}>
                      <td>{r.fleet_no || "—"}</td>
                      <td>{r.vehicle_type || "—"}</td>
                      <td>{[r.make, r.model].filter(Boolean).join(" ") || "—"}</td>
                      <td>{r.location_name || "—"}</td>
                      <td>{r.registration_no || "—"}</td>
                      <td>{r.registration_state || "—"}</td>
                      <td>{r.registration_expiry ? new Date(r.registration_expiry).toLocaleDateString("en-AU") : "—"}</td>
                      <td>
                        <span style={{ ...style, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                          {label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <p style={{ color: "#888", marginTop: 16 }}>No registrations match the selected filters.</p>}
          </div>
        </>
      )}
    </div>
  );
}
