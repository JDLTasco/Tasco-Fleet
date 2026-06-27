"use client";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

type Location = { id: string; name: string };
type Row = {
  id: string; weigh_date: string; weigh_time: string; depot: string;
  weighbridge_name: string; weighbridge_address: string; weighbridge_state: string;
  docket_reference: string; driver_name: string;
  steer_axle_weight_kg: number; drive_axle_weight_kg: number;
  trailer_1_axle_weight_kg: number; trailer_2_axle_weight_kg: number;
  trailer_3_axle_weight_kg: number; total_mass_kg: number;
  fleet_no: string; location_name: string;
};

export default function MassVerificationsReportPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [fleetNo, setFleetNo] = useState("");
  const [depot, setDepot] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    fetch("/api/locations").then(r => r.json()).then(setLocations);
  }, []);

  async function generate() {
    setLoading(true);
    const p = new URLSearchParams();
    if (fleetNo) p.set("fleetNo", fleetNo);
    if (depot) p.set("depot", depot);
    if (dateFrom) p.set("dateFrom", dateFrom);
    if (dateTo) p.set("dateTo", dateTo);
    const res = await fetch(`/api/reports/mass-verifications?${p}`);
    setRows(await res.json());
    setGenerated(true);
    setLoading(false);
  }

  function downloadCSV() {
    const headers = ["Date","Time","Fleet No","Depot","Weighbridge","WB Address","WB State","Docket","Driver",
      "Steer (kg)","Drive (kg)","Trailer 1 (kg)","Trailer 2 (kg)","Trailer 3 (kg)","Total Mass (kg)"];
    const csvRows = [headers, ...rows.map(r => [
      r.weigh_date ? new Date(r.weigh_date).toLocaleDateString("en-AU") : "",
      r.weigh_time || "",
      r.fleet_no || "",
      r.location_name || r.depot || "",
      r.weighbridge_name || "",
      r.weighbridge_address || "",
      r.weighbridge_state || "",
      r.docket_reference || "",
      r.driver_name || "",
      r.steer_axle_weight_kg ?? "",
      r.drive_axle_weight_kg ?? "",
      r.trailer_1_axle_weight_kg ?? "",
      r.trailer_2_axle_weight_kg ?? "",
      r.trailer_3_axle_weight_kg ?? "",
      r.total_mass_kg ?? "",
    ])];
    const csv = csvRows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `mass-verifications-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  return (
    <div>
      <div className="no-print" style={{ marginBottom: 20 }}>
        <button onClick={() => window.history.back()} style={{ background: "transparent", color: "#1B3A6B", border: "1px solid #1B3A6B", marginBottom: 16 }}>
          ← Back
        </button>
        <h2 style={{ margin: "0 0 16px", color: "#1B3A6B" }}>Mass Verification Report</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, background: "#f0f4fa", padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Fleet No</span>
            <input value={fleetNo} onChange={e => setFleetNo(e.target.value)} placeholder="e.g. 503" />
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Depot</span>
            <select value={depot} onChange={e => setDepot(e.target.value)}>
              <option value="">All Depots</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Date From</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Date To</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
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
              <span style={{ fontSize: 13, color: "#666" }}>{rows.length} record{rows.length !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>
      </div>

      {generated && (
        <>
          <div className="print-only" style={{ marginBottom: 12 }}>
            <strong>Tasco Carriers — Mass Verification Report</strong>
            <span style={{ marginLeft: 16, fontSize: 12, color: "#666" }}>{new Date().toLocaleDateString("en-AU")}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Fleet No</th><th>Depot</th><th>Weighbridge</th>
                  <th>State</th><th>Docket</th><th>Driver</th>
                  <th>Steer (kg)</th><th>Drive (kg)</th><th>T1 (kg)</th><th>T2 (kg)</th><th>T3 (kg)</th>
                  <th>Total (kg)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.weigh_date ? new Date(r.weigh_date).toLocaleDateString("en-AU") : "—"}</td>
                    <td>{r.fleet_no || "—"}</td>
                    <td>{r.location_name || r.depot || "—"}</td>
                    <td>{r.weighbridge_name || "—"}</td>
                    <td>{r.weighbridge_state || "—"}</td>
                    <td>{r.docket_reference || "—"}</td>
                    <td>{r.driver_name || "—"}</td>
                    <td>{r.steer_axle_weight_kg?.toLocaleString() ?? "—"}</td>
                    <td>{r.drive_axle_weight_kg?.toLocaleString() ?? "—"}</td>
                    <td>{r.trailer_1_axle_weight_kg?.toLocaleString() ?? "—"}</td>
                    <td>{r.trailer_2_axle_weight_kg?.toLocaleString() ?? "—"}</td>
                    <td>{r.trailer_3_axle_weight_kg?.toLocaleString() ?? "—"}</td>
                    <td><strong>{r.total_mass_kg?.toLocaleString() ?? "—"}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p style={{ color: "#888", marginTop: 16 }}>No records match the selected filters.</p>}
          </div>
        </>
      )}
    </div>
  );
}
