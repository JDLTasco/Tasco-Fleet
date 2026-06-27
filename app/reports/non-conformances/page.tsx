"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Location = { id: string; name: string };
type Vehicle = { id: string; fleet_no: string; make: string; model: string };
type Driver = { id: string; first_name: string; last_name: string; driver_code: string };
type Row = {
  id: string; incident_type: string; description: string; incident_date: string;
  notes: string; created_at: string; fleet_no: string; make: string; model: string;
  driver_name: string; driver_code: string; depot_name: string;
};

const TYPE_LABELS: Record<string, string> = { hours: "Hours", vehicle: "Vehicle", other: "Other" };
const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  hours:   { bg: "#fef3e2", color: "#e37400" },
  vehicle: { bg: "#fce8e6", color: "#c5221f" },
  other:   { bg: "#e8f0fe", color: "#1a73e8" },
};

export default function NCReportPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [incidentType, setIncidentType] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [depot, setDepot] = useState("");
  const [fleetNo, setFleetNo] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [reportDate, setReportDate] = useState("");

  useEffect(() => {
    fetch("/api/locations").then(r => r.json()).then(setLocations);
    fetch("/api/vehicles").then(r => r.json()).then(setVehicles);
    fetch("/api/drivers").then(r => r.json()).then(setDrivers);
  }, []);

  async function generate() {
    setLoading(true);
    const p = new URLSearchParams();
    if (incidentType) p.set("incidentType", incidentType);
    if (vehicleId) p.set("vehicleId", vehicleId);
    if (driverId) p.set("driverId", driverId);
    if (depot) p.set("depot", depot);
    if (fleetNo) p.set("fleetNo", fleetNo);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const res = await fetch(`/api/reports/non-conformances?${p}`);
    setRows(await res.json());
    setReportDate(new Date().toLocaleString("en-AU"));
    setGenerated(true);
    setLoading(false);
  }

  function downloadCSV() {
    const headers = ["Date","Type","Description","Fleet No","Make","Model","Depot","Driver","Driver Code","Notes","Recorded"];
    const csvRows = [headers, ...rows.map(r => [
      new Date(r.incident_date).toLocaleDateString("en-AU"),
      TYPE_LABELS[r.incident_type] || r.incident_type,
      r.description || "",
      r.fleet_no || "", r.make || "", r.model || "", r.depot_name || "",
      r.driver_name?.trim() || "", r.driver_code || "", r.notes || "",
      new Date(r.created_at).toLocaleDateString("en-AU"),
    ])];
    const csv = csvRows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `non-conformances-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  const counts = { hours: 0, vehicle: 0, other: 0 };
  rows.forEach(r => { if (r.incident_type in counts) counts[r.incident_type as keyof typeof counts]++; });

  return (
    <div>
      <style>{`
        @media print { nav, .no-print { display: none !important; } .print-title { display: block !important; } }
        .print-title { display: none; }
      `}</style>

      <div className="print-title">
        <h2 style={{ margin: 0 }}>Tasco Carriers — Non-Conformance Report</h2>
        <p style={{ margin: "4px 0 16px", color: "#555", fontSize: 12 }}>Generated: {reportDate}</p>
      </div>

      <div className="no-print">
        <Link href="/reports" style={{ fontSize: 13, color: "#1B3A6B", textDecoration: "none" }}>← All Reports</Link>
        <h2 style={{ margin: "8px 0 16px", color: "#1B3A6B" }}>Non-Conformance Report</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, background: "#f0f4fa", padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Incident Type</span>
            <select value={incidentType} onChange={e => setIncidentType(e.target.value)}>
              <option value="">All Types</option>
              <option value="hours">Hours</option>
              <option value="vehicle">Vehicle</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Vehicle</span>
            <select value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
              <option value="">All Vehicles</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.fleet_no} {v.make} {v.model}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Driver</span>
            <select value={driverId} onChange={e => setDriverId(e.target.value)}>
              <option value="">All Drivers</option>
              {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Depot</span>
            <select value={depot} onChange={e => setDepot(e.target.value)}>
              <option value="">All Depots</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Fleet No</span>
            <input value={fleetNo} onChange={e => setFleetNo(e.target.value)} placeholder="e.g. 503" />
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Date From</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Date To</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={generate} disabled={loading} style={{ background: "#1B3A6B" }}>
            {loading ? "Generating…" : "Generate Report"}
          </button>
          {generated && (
            <>
              <button onClick={() => window.print()} style={{ background: "#fff", color: "#1B3A6B", border: "1px solid #1B3A6B" }}>Print / Save PDF</button>
              <button onClick={downloadCSV} style={{ background: "#fff", color: "#1B3A6B", border: "1px solid #1B3A6B" }}>Download CSV</button>
              <span style={{ fontSize: 13, color: "#666" }}>{rows.length} record{rows.length !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>

        {generated && rows.length > 0 && (
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            {(["hours","vehicle","other"] as const).map(t => counts[t] > 0 && (
              <span key={t} style={{ ...TYPE_COLORS[t], padding: "4px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
                {TYPE_LABELS[t]}: {counts[t]}
              </span>
            ))}
          </div>
        )}
      </div>

      {generated && (
        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Type</th><th>Description</th><th>Fleet No</th>
                <th>Make / Model</th><th>Depot</th><th>Driver</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(r.incident_date).toLocaleDateString("en-AU")}</td>
                  <td>
                    <span style={{ ...TYPE_COLORS[r.incident_type], padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                      {TYPE_LABELS[r.incident_type] || r.incident_type}
                    </span>
                  </td>
                  <td>{r.description}</td>
                  <td>{r.fleet_no || "—"}</td>
                  <td>{[r.make, r.model].filter(Boolean).join(" ") || "—"}</td>
                  <td>{r.depot_name || "—"}</td>
                  <td>{r.driver_name?.trim() || "—"}</td>
                  <td style={{ fontSize: 12, color: "#666" }}>{r.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p style={{ color: "#888", marginTop: 16 }}>No records match the selected filters.</p>}
        </div>
      )}
    </div>
  );
}
