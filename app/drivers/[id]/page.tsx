"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const LICENCE_TYPES = ["C", "LR", "MR", "HR", "HC", "MC", "RE", "R"];
const STATES = ["VIC", "NSW", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

function expiryColor(dateStr: string | null) {
  if (!dateStr) return undefined;
  const days = (new Date(dateStr).getTime() - Date.now()) / 86400000;
  return days < 0 ? "#c5221f" : days < 30 ? "#e37400" : undefined;
}

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [driver, setDriver] = useState<any>(null);
  const [licenceHistory, setLicenceHistory] = useState<any[]>([]);
  const [form, setForm] = useState({
    licence_no: "", licence_type: "", licence_expiry: "",
    dg_licence_no: "", dg_licence_expiry: "", notes: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function loadHistory() {
    fetch(`/api/drivers/${id}/licence`).then(r => r.json()).then(setLicenceHistory);
  }

  useEffect(() => {
    fetch(`/api/drivers/${id}`)
      .then(r => r.json())
      .then(d => {
        setDriver(d);
        setForm({
          licence_no: d.licence_no || "",
          licence_type: d.licence_type || "",
          licence_expiry: d.licence_expiry?.slice(0, 10) || "",
          dg_licence_no: d.dg_licence_no || "",
          dg_licence_expiry: d.dg_licence_expiry?.slice(0, 10) || "",
          notes: "",
        });
      });
    loadHistory();
  }, [id]);

  if (!driver) return <p>Loading…</p>;
  if (driver.error) return <p className="error">{driver.error}</p>;

  async function submitLicence(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/drivers/${id}/licence`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm(f => ({ ...f, notes: "" }));
    const d = await fetch(`/api/drivers/${id}`).then(r => r.json());
    setDriver(d);
    loadHistory();
  }

  const sectionStyle = { background: "#f8fafd", border: "1px solid #dce6f5", borderRadius: 8, padding: "16px 20px", marginBottom: 16 };
  const h3Style = { margin: "0 0 12px", color: "#1B3A6B", fontSize: 15, borderBottom: "1px solid #dce6f5", paddingBottom: 8 };

  return (
    <div>
      <Link href="/drivers" style={{ fontSize: 13, color: "#1B3A6B", textDecoration: "none" }}>← Drivers</Link>
      <h2 style={{ margin: "8px 0 16px" }}>{driver.first_name} {driver.last_name}
        {driver.driver_code && <span style={{ fontSize: 14, color: "#888", marginLeft: 10 }}>({driver.driver_code})</span>}
      </h2>

      <div style={sectionStyle}>
        <h3 style={h3Style}>Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 13 }}>
          <div><span style={{ color: "#888", fontSize: 11 }}>Phone</span><div>{driver.phone || "—"}</div></div>
          <div><span style={{ color: "#888", fontSize: 11 }}>Status</span>
            <div><span className={`badge ${driver.status === "active" ? "active" : "disposed"}`}>{driver.status}</span></div>
          </div>
          <div><span style={{ color: "#888", fontSize: 11 }}>Home Depot</span><div>{driver.home_location || "—"}</div></div>
        </div>
      </div>

      {/* Licence Section */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ ...h3Style, margin: 0, border: "none", paddingBottom: 0 }}>Licence</h3>
          <button onClick={() => setShowForm(!showForm)}
            style={{ fontSize: 12, background: "#1B3A6B", padding: "4px 12px" }}>
            {showForm ? "Cancel" : "Amend Licence"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, marginBottom: showForm ? 16 : 0 }}>
          <div>
            <span style={{ fontSize: 11, color: "#888" }}>Licence No</span>
            <div style={{ fontWeight: 600 }}>{driver.licence_no || "—"}</div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#888" }}>Type</span>
            <div style={{ fontWeight: 600 }}>{driver.licence_type || "—"}</div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#888" }}>Licence Expiry</span>
            <div style={{ fontWeight: 600, color: expiryColor(driver.licence_expiry) }}>
              {driver.licence_expiry ? new Date(driver.licence_expiry).toLocaleDateString("en-AU") : "—"}
            </div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#888" }}>DG Licence No</span>
            <div style={{ fontWeight: 600 }}>{driver.dg_licence_no || "—"}</div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#888" }}>DG Expiry</span>
            <div style={{ fontWeight: 600, color: expiryColor(driver.dg_licence_expiry) }}>
              {driver.dg_licence_expiry ? new Date(driver.dg_licence_expiry).toLocaleDateString("en-AU") : "—"}
            </div>
          </div>
        </div>

        {showForm && (
          <form onSubmit={submitLicence} style={{ background: "#fff", border: "1px solid #dce6f5", borderRadius: 6, padding: 16 }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#555" }}>Current values will be saved to history automatically.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Licence No</span>
                <input value={form.licence_no} onChange={e => setForm(f => ({ ...f, licence_no: e.target.value }))} />
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Licence Type</span>
                <select value={form.licence_type} onChange={e => setForm(f => ({ ...f, licence_type: e.target.value }))}>
                  <option value="">— Select —</option>
                  {LICENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Expiry Date</span>
                <input type="date" value={form.licence_expiry} onChange={e => setForm(f => ({ ...f, licence_expiry: e.target.value }))} />
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>DG Licence No</span>
                <input value={form.dg_licence_no} onChange={e => setForm(f => ({ ...f, dg_licence_no: e.target.value }))} />
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>DG Expiry</span>
                <input type="date" value={form.dg_licence_expiry} onChange={e => setForm(f => ({ ...f, dg_licence_expiry: e.target.value }))} />
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Notes (optional)</span>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Renewed" />
              </label>
            </div>
            <button type="submit" disabled={saving} style={{ marginTop: 10, background: "#1B3A6B" }}>
              {saving ? "Saving…" : "Save Amendment"}
            </button>
          </form>
        )}

        {licenceHistory.length > 0 && (
          <details style={{ marginTop: 16 }}>
            <summary style={{ fontSize: 13, color: "#1B3A6B", cursor: "pointer", userSelect: "none" }}>
              Licence History ({licenceHistory.length} record{licenceHistory.length !== 1 ? "s" : ""})
            </summary>
            <table style={{ marginTop: 8, fontSize: 12 }}>
              <thead>
                <tr><th>Recorded</th><th>Licence No</th><th>Type</th><th>Expiry</th><th>DG No</th><th>DG Expiry</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {licenceHistory.map(h => (
                  <tr key={h.id}>
                    <td>{new Date(h.recorded_at).toLocaleDateString("en-AU")}</td>
                    <td>{h.licence_no || "—"}</td>
                    <td>{h.licence_type || "—"}</td>
                    <td style={{ color: expiryColor(h.licence_expiry) }}>
                      {h.licence_expiry ? new Date(h.licence_expiry).toLocaleDateString("en-AU") : "—"}
                    </td>
                    <td>{h.dg_licence_no || "—"}</td>
                    <td style={{ color: expiryColor(h.dg_licence_expiry) }}>
                      {h.dg_licence_expiry ? new Date(h.dg_licence_expiry).toLocaleDateString("en-AU") : "—"}
                    </td>
                    <td>{h.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>
    </div>
  );
}
