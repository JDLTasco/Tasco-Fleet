"use client";
import { useEffect, useState } from "react";

type Location = { id: string; name: string };
type ReportRow = {
  fleet_no: string; vehicle_type: string; sub_type: string; make: string; model: string;
  year: number; vin: string; status: string; location_name: string;
  registration_no: string; registration_state: string; registration_expiry: string;
  nhvas_mass: boolean; mass_active: boolean; dg_licence_required: boolean; dg_expiry_date: string;
  current_kms: number; acquired_date: string; acquisition_price: number;
  class_name: string; gvm_kg: number; gcm_kg: number; tare_kg: number;
};

function fmt(v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}
function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-AU");
}
function fmtNum(v: number | null) {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString();
}

function downloadCSV(rows: ReportRow[]) {
  const cols: (keyof ReportRow)[] = [
    "fleet_no","vehicle_type","sub_type","make","model","year","vin","status",
    "location_name","registration_no","registration_state","registration_expiry",
    "nhvas_mass","mass_active","dg_licence_required","dg_expiry_date",
    "current_kms","acquired_date","acquisition_price","class_name","gvm_kg","gcm_kg","tare_kg",
  ];
  const header = [
    "Fleet No","Vehicle Type","Sub Type","Make","Model","Year","VIN","Status",
    "Depot","Rego No","Rego State","Rego Expiry",
    "NHVAS Mass","Mass Active","DG Lic Req","DG Expiry",
    "Current Kms","Acquired Date","Acq Price","Class","GVM (kg)","GCM (kg)","Tare (kg)",
  ];
  const escape = (v: unknown) => {
    const s = fmt(v as string);
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(","), ...rows.map(r => cols.map(c => escape(r[c])).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `tasco-fleet-report-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

export default function ReportsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filters, setFilters] = useState({
    depot: "", vehicleType: "", status: "active", make: "", model: "",
    registrationNo: "", registrationState: "", fleetNo: "", vin: "",
    nhvasMass: false, dgLicenceRequired: false, acquiredFrom: "", acquiredTo: "",
  });
  const [results, setResults] = useState<ReportRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportDate, setReportDate] = useState("");

  useEffect(() => {
    fetch("/api/locations").then(r => r.json()).then(setLocations);
  }, []);

  function set(key: string, val: string | boolean) {
    setFilters(f => ({ ...f, [key]: val }));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "" && v !== false) q.set(k, String(v));
    });
    const res = await fetch(`/api/reports?${q}`);
    const data = await res.json();
    setResults(data);
    setReportDate(new Date().toLocaleString("en-AU"));
    setLoading(false);
  }

  return (
    <>
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          .print-title { display: block !important; }
          body { font-size: 11px; }
          th, td { padding: 4px 6px; }
          table { font-size: 10px; }
        }
        .print-title { display: none; }
        .filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .filter-card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 16px; }
        .results-wrap { overflow-x: auto; }
        .export-bar { display: flex; gap: 10px; margin-bottom: 12px; }
        .btn-export { padding: 7px 14px; border-radius: 4px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; }
        .btn-pdf { background: #1B3A6B; color: #fff; }
        .btn-csv { background: #137333; color: #fff; }
        tr:hover td { background: #f5f8ff; }
      `}</style>

      <div className="print-title">
        <h2 style={{ margin: 0 }}>Tasco Carriers Fleet — Vehicle Report</h2>
        <p style={{ margin: "4px 0 16px", color: "#555", fontSize: 12 }}>Generated: {reportDate}</p>
      </div>

      <div className="no-print">
        <div style={{ background: "#1B3A6B", color: "#fff", padding: "14px 20px", borderRadius: 8, marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Vehicle Reports</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.85 }}>Filter by any combination of fields, then export</p>
        </div>

        <form onSubmit={generate}>
          <div className="filter-grid" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13 }}>
              Depot / Location
              <select value={filters.depot} onChange={e => set("depot", e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }}>
                <option value="">All depots</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              Vehicle Type
              <select value={filters.vehicleType} onChange={e => set("vehicleType", e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }}>
                <option value="">All types</option>
                {["Prime Mover","Rigid","Trailer","Semi Trailer","B-Train","Dog Trailer","Tanker","Crane Truck","Bus","Other"].map(t =>
                  <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              Status
              <select value={filters.status} onChange={e => set("status", e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="disposed">Disposed</option>
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              Make
              <input value={filters.make} onChange={e => set("make", e.target.value)} placeholder="e.g. Kenworth" style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Model
              <input value={filters.model} onChange={e => set("model", e.target.value)} placeholder="e.g. T610" style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Fleet No
              <input value={filters.fleetNo} onChange={e => set("fleetNo", e.target.value)} placeholder="e.g. 503" style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              VIN
              <input value={filters.vin} onChange={e => set("vin", e.target.value)} placeholder="partial match" style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Registration No
              <input value={filters.registrationNo} onChange={e => set("registrationNo", e.target.value)} placeholder="partial match" style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Rego State
              <input value={filters.registrationState} onChange={e => set("registrationState", e.target.value)} placeholder="VIC / NSW / QLD…" style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Acquired From
              <input type="date" value={filters.acquiredFrom} onChange={e => set("acquiredFrom", e.target.value)} style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Acquired To
              <input type="date" value={filters.acquiredTo} onChange={e => set("acquiredTo", e.target.value)} style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={filters.nhvasMass} onChange={e => set("nhvasMass", e.target.checked)} />
                NHVAS Mass accredited only
              </label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={filters.dgLicenceRequired} onChange={e => set("dgLicenceRequired", e.target.checked)} />
                DG Licence required only
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ background: "#1B3A6B", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 5, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {loading ? "Generating…" : "Generate Report"}
          </button>

          {results !== null && (
            <span style={{ marginLeft: 16, fontSize: 13, color: "#555" }}>
              {results.length} vehicle{results.length !== 1 ? "s" : ""} found
            </span>
          )}
        </form>
      </div>

      {results !== null && results.length > 0 && (
        <>
          <div className="export-bar no-print" style={{ marginTop: 20 }}>
            <button className="btn-export btn-pdf" onClick={() => window.print()}>Print / Save PDF</button>
            <button className="btn-export btn-csv" onClick={() => downloadCSV(results)}>Download CSV</button>
          </div>

          <p className="print-title" style={{ fontSize: 12, color: "#555", margin: "0 0 8px" }}>
            {results.length} vehicle{results.length !== 1 ? "s" : ""} — Generated: {reportDate}
          </p>

          <div className="results-wrap">
            <table style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Fleet No</th><th>Type</th><th>Sub Type</th><th>Make</th><th>Model</th>
                  <th>Year</th><th>VIN</th><th>Status</th><th>Depot</th>
                  <th>Rego No</th><th>Rego St</th><th>Rego Expiry</th>
                  <th>NHVAS Mass</th><th>Mass Active</th><th>DG Lic</th><th>DG Expiry</th>
                  <th>Kms</th><th>Acquired</th><th>Acq Price</th>
                  <th>Class</th><th>GVM</th><th>GCM</th><th>Tare</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td>{fmt(r.fleet_no)}</td>
                    <td>{fmt(r.vehicle_type)}</td>
                    <td>{fmt(r.sub_type)}</td>
                    <td>{fmt(r.make)}</td>
                    <td>{fmt(r.model)}</td>
                    <td>{fmt(r.year)}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{fmt(r.vin)}</td>
                    <td><span style={{ padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: r.status === "active" ? "#e6f4ea" : "#fce8e6", color: r.status === "active" ? "#137333" : "#c5221f" }}>{r.status}</span></td>
                    <td>{fmt(r.location_name)}</td>
                    <td>{fmt(r.registration_no)}</td>
                    <td>{fmt(r.registration_state)}</td>
                    <td>{fmtDate(r.registration_expiry)}</td>
                    <td>{fmt(r.nhvas_mass)}</td>
                    <td>{fmt(r.mass_active)}</td>
                    <td>{fmt(r.dg_licence_required)}</td>
                    <td>{fmtDate(r.dg_expiry_date)}</td>
                    <td>{fmtNum(r.current_kms)}</td>
                    <td>{fmtDate(r.acquired_date)}</td>
                    <td>{r.acquisition_price ? `$${fmtNum(r.acquisition_price)}` : "—"}</td>
                    <td>{fmt(r.class_name)}</td>
                    <td>{fmtNum(r.gvm_kg)}</td>
                    <td>{fmtNum(r.gcm_kg)}</td>
                    <td>{fmtNum(r.tare_kg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {results !== null && results.length === 0 && (
        <p style={{ color: "#888", marginTop: 20 }}>No vehicles match the selected filters.</p>
      )}
    </>
  );
}
