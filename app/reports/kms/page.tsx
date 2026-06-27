"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Location = { id: string; name: string };
type Row = {
  id: string; kms: number; reading_date: string; notes: string; recorded_at: string;
  fleet_no: string; make: string; model: string; vehicle_type: string; location_name: string;
};

export default function KmsReportPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [depot, setDepot] = useState("");
  const [fleetNo, setFleetNo] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
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
    if (fleetNo) p.set("fleetNo", fleetNo);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const res = await fetch(`/api/reports/kms?${p}`);
    setRows(await res.json());
    setGenerated(true);
    setLoading(false);
  }

  function downloadCSV() {
    const headers = ["Reading Date","Fleet No","Type","Make","Model","Depot","Kilometres","Notes","Recorded"];
    const csvRows = [headers, ...rows.map(r => [
      new Date(r.reading_date).toLocaleDateString("en-AU"),
      r.fleet_no || "", r.vehicle_type || "", r.make || "", r.model || "",
      r.location_name || "", r.kms, r.notes || "",
      new Date(r.recorded_at).toLocaleDateString("en-AU"),
    ])];
    const csv = csvRows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `km-history-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  return (
    <div>
      <div className="no-print">
        <Link href="/reports" style={{ fontSize: 13, color: "#1B3A6B", textDecoration: "none" }}>← All Reports</Link>
        <h2 style={{ margin: "8px 0 16px", color: "#1B3A6B" }}>Kilometre History Report</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, background: "#f0f4fa", padding: 16, borderRadius: 8, marginBottom: 16 }}>
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
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Reading Date From</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Reading Date To</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
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
              <span style={{ fontSize: 13, color: "#666" }}>{rows.length} reading{rows.length !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>
      </div>

      {generated && (
        <>
          <div className="print-only" style={{ marginBottom: 12 }}>
            <strong>Tasco Carriers — Kilometre History Report</strong>
            <span style={{ marginLeft: 16, fontSize: 12, color: "#666" }}>{new Date().toLocaleDateString("en-AU")}</span>
          </div>
          <div style={{ overflowX: "auto", marginTop: 20 }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Fleet No</th><th>Type</th><th>Make / Model</th>
                  <th>Depot</th><th>Kilometres</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{new Date(r.reading_date).toLocaleDateString("en-AU")}</td>
                    <td>{r.fleet_no || "—"}</td>
                    <td>{r.vehicle_type || "—"}</td>
                    <td>{[r.make, r.model].filter(Boolean).join(" ") || "—"}</td>
                    <td>{r.location_name || "—"}</td>
                    <td><strong>{r.kms?.toLocaleString()}</strong></td>
                    <td>{r.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p style={{ color: "#888", marginTop: 16 }}>No KM readings match the selected filters.</p>}
          </div>
        </>
      )}
    </div>
  );
}
