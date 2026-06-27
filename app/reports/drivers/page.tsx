"use client";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

type Location = { id: string; name: string };
type Row = {
  id: string; driver_code: string; first_name: string; last_name: string;
  licence_no: string; licence_type: string; licence_expiry: string;
  dg_licence_no: string; dg_licence_expiry: string; phone: string;
  status: string; depots: string;
};

function expiryColor(dateStr: string | null): string | undefined {
  if (!dateStr) return undefined;
  const days = (new Date(dateStr).getTime() - Date.now()) / 86400000;
  if (days < 0) return "#c5221f";
  if (days < 30) return "#e37400";
  return undefined;
}

export default function DriversReportPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [depot, setDepot] = useState("");
  const [status, setStatus] = useState("active");
  const [licenceType, setLicenceType] = useState("");
  const [dgOnly, setDgOnly] = useState(false);
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
    p.set("status", status);
    if (licenceType) p.set("licenceType", licenceType);
    if (dgOnly) p.set("dgOnly", "true");
    const res = await fetch(`/api/reports/drivers?${p}`);
    setRows(await res.json());
    setGenerated(true);
    setLoading(false);
  }

  function downloadCSV() {
    const headers = ["Code", "First Name", "Last Name", "Licence No", "Licence Type", "Licence Expiry",
      "DG Licence No", "DG Expiry", "Phone", "Status", "Depots"];
    const csvRows = [headers, ...rows.map(r => [
      r.driver_code || "", r.first_name || "", r.last_name || "",
      r.licence_no || "", r.licence_type || "",
      r.licence_expiry ? new Date(r.licence_expiry).toLocaleDateString("en-AU") : "",
      r.dg_licence_no || "",
      r.dg_licence_expiry ? new Date(r.dg_licence_expiry).toLocaleDateString("en-AU") : "",
      r.phone || "", r.status || "", r.depots || "",
    ])];
    const csv = csvRows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `drivers-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div>
      <div className="no-print" style={{ marginBottom: 20 }}>
        <button onClick={() => window.history.back()} style={{ background: "transparent", color: "#1B3A6B", border: "1px solid #1B3A6B", marginBottom: 16 }}>
          ← Back
        </button>
        <h2 style={{ margin: "0 0 16px", color: "#1B3A6B" }}>Driver Report</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, background: "#f0f4fa", padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Depot</span>
            <select value={depot} onChange={e => setDepot(e.target.value)}>
              <option value="">All Depots</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Status</span>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Archived</option>
              <option value="all">All</option>
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Licence Type</span>
            <input value={licenceType} onChange={e => setLicenceType(e.target.value)} placeholder="e.g. HC, MC" />
          </label>
          <label style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 8, paddingTop: 20 }}>
            <input type="checkbox" checked={dgOnly} onChange={e => setDgOnly(e.target.checked)} style={{ width: "auto" }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>DG Licence Only</span>
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
              <span style={{ fontSize: 13, color: "#666" }}>{rows.length} driver{rows.length !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>
      </div>

      {generated && (
        <>
          <div className="print-only" style={{ marginBottom: 12 }}>
            <strong>Tasco Carriers — Driver Report</strong>
            <span style={{ marginLeft: 16, fontSize: 12, color: "#666" }}>{new Date().toLocaleDateString("en-AU")}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Code</th><th>Name</th><th>Licence</th><th>Licence Expiry</th>
                  <th>DG Licence</th><th>DG Expiry</th><th>Phone</th><th>Status</th><th>Depots</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.driver_code || "—"}</td>
                    <td>{r.first_name} {r.last_name}</td>
                    <td>{r.licence_type} {r.licence_no}</td>
                    <td style={{ color: expiryColor(r.licence_expiry), fontWeight: expiryColor(r.licence_expiry) ? 600 : undefined }}>
                      {r.licence_expiry ? new Date(r.licence_expiry).toLocaleDateString("en-AU") : "—"}
                    </td>
                    <td>{r.dg_licence_no || "—"}</td>
                    <td style={{ color: expiryColor(r.dg_licence_expiry), fontWeight: expiryColor(r.dg_licence_expiry) ? 600 : undefined }}>
                      {r.dg_licence_expiry ? new Date(r.dg_licence_expiry).toLocaleDateString("en-AU") : "—"}
                    </td>
                    <td>{r.phone || "—"}</td>
                    <td><span className={`badge ${r.status === "active" ? "active" : "disposed"}`}>{r.status}</span></td>
                    <td>{r.depots || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p style={{ color: "#888", marginTop: 16 }}>No drivers match the selected filters.</p>}
          </div>
        </>
      )}
    </div>
  );
}
