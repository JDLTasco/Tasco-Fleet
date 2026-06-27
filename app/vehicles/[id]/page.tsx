"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Rego amendment state
  const [regoHistory, setRegoHistory] = useState<any[]>([]);
  const [regoForm, setRegoForm] = useState({ registration_no: "", registration_state: "", registration_expiry: "", notes: "" });
  const [showRegoForm, setShowRegoForm] = useState(false);
  const [regoSaving, setRegoSaving] = useState(false);

  // KM history state
  const [kmHistory, setKmHistory] = useState<any[]>([]);
  const [kmForm, setKmForm] = useState({ kms: "", reading_date: new Date().toISOString().slice(0, 10), notes: "" });
  const [showKmForm, setShowKmForm] = useState(false);
  const [kmSaving, setKmSaving] = useState(false);

  function loadRegoHistory() {
    fetch(`/api/vehicles/${id}/rego`).then(r => r.json()).then(setRegoHistory);
  }
  function loadKmHistory() {
    fetch(`/api/vehicles/${id}/kms`).then(r => r.json()).then(setKmHistory);
  }

  useEffect(() => {
    fetch(`/api/vehicles/${id}`).then(r => r.json()).then(d => {
      setData(d);
      if (d.compliance) {
        setRegoForm({
          registration_no: d.compliance.registration_no || "",
          registration_state: d.compliance.registration_state || "",
          registration_expiry: d.compliance.registration_expiry?.slice(0, 10) || "",
          notes: "",
        });
      }
    });
    loadRegoHistory();
    loadKmHistory();
  }, [id]);

  if (!data) return <p>Loading…</p>;
  if (data.error) return <p className="error">{data.error}</p>;
  const v = data.vehicle;

  async function save(field: string, value: any) {
    setSaving(true);
    await fetch(`/api/vehicles/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString());
  }

  async function submitRego(e: React.FormEvent) {
    e.preventDefault();
    setRegoSaving(true);
    await fetch(`/api/vehicles/${id}/rego`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regoForm),
    });
    setRegoSaving(false);
    setShowRegoForm(false);
    setRegoForm(f => ({ ...f, notes: "" }));
    const d = await fetch(`/api/vehicles/${id}`).then(r => r.json());
    setData(d);
    loadRegoHistory();
  }

  async function submitKm(e: React.FormEvent) {
    e.preventDefault();
    setKmSaving(true);
    await fetch(`/api/vehicles/${id}/kms`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kms: Number(kmForm.kms), reading_date: kmForm.reading_date, notes: kmForm.notes }),
    });
    setKmSaving(false);
    setShowKmForm(false);
    setKmForm(f => ({ ...f, kms: "", notes: "" }));
    const d = await fetch(`/api/vehicles/${id}`).then(r => r.json());
    setData(d);
    loadKmHistory();
  }

  const STATES = ["VIC", "NSW", "QLD", "SA", "WA", "TAS", "NT", "ACT"];
  const sectionStyle = { background: "#f8fafd", border: "1px solid #dce6f5", borderRadius: 8, padding: "16px 20px", marginBottom: 16 };
  const h3Style = { margin: "0 0 12px", color: "#1B3A6B", fontSize: 15, borderBottom: "1px solid #dce6f5", paddingBottom: 8 };

  function regoExpiryColor(dateStr: string) {
    if (!dateStr) return undefined;
    const days = (new Date(dateStr).getTime() - Date.now()) / 86400000;
    return days < 0 ? "#c5221f" : days < 30 ? "#e37400" : undefined;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <Link href="/vehicles" style={{ fontSize: 13, color: "#1B3A6B", textDecoration: "none" }}>← Vehicles</Link>
      </div>
      <h2 style={{ margin: "0 0 4px" }}>Fleet No {v.fleet_no} — {v.make} {v.model}</h2>
      <p style={{ color: "#888", fontSize: 12, margin: "0 0 16px" }}>
        {saving ? "Saving…" : savedAt ? `Saved at ${savedAt}` : "Fields save on blur"}
      </p>

      <div style={sectionStyle}>
        <h3 style={h3Style}>Vehicle Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
          <EF label="Make" value={v.make} onSave={val => save("make", val)} />
          <EF label="Model" value={v.model} onSave={val => save("model", val)} />
          <EF label="Year" value={v.year} type="number" onSave={val => save("year", Number(val))} />
          <EF label="VIN" value={v.vin} onSave={val => save("vin", val)} />
          <EF label="Description" value={v.description} onSave={val => save("description", val)} />
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Status</span>
            <select defaultValue={v.status} onChange={e => save("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="disposed">Disposed</option>
            </select>
          </label>
        </div>
        <EF label="Notes" value={v.notes} multiline onSave={val => save("notes", val)} />
      </div>

      {/* Registration Section */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ ...h3Style, margin: 0, border: "none", paddingBottom: 0 }}>Registration</h3>
          <button onClick={() => setShowRegoForm(!showRegoForm)}
            style={{ fontSize: 12, background: "#1B3A6B", padding: "4px 12px" }}>
            {showRegoForm ? "Cancel" : "Amend Rego"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: showRegoForm ? 16 : 0 }}>
          <div>
            <span style={{ fontSize: 11, color: "#888" }}>Rego No</span>
            <div style={{ fontWeight: 600 }}>{data.compliance?.registration_no || "—"}</div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#888" }}>State</span>
            <div style={{ fontWeight: 600 }}>{data.compliance?.registration_state || "—"}</div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#888" }}>Expiry</span>
            <div style={{ fontWeight: 600, color: regoExpiryColor(data.compliance?.registration_expiry) }}>
              {data.compliance?.registration_expiry
                ? new Date(data.compliance.registration_expiry).toLocaleDateString("en-AU")
                : "—"}
            </div>
          </div>
        </div>

        {showRegoForm && (
          <form onSubmit={submitRego} style={{ background: "#fff", border: "1px solid #dce6f5", borderRadius: 6, padding: 16 }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#555" }}>Current values will be saved to history automatically.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Rego No</span>
                <input value={regoForm.registration_no} onChange={e => setRegoForm(f => ({ ...f, registration_no: e.target.value }))} />
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>State</span>
                <select value={regoForm.registration_state} onChange={e => setRegoForm(f => ({ ...f, registration_state: e.target.value }))}>
                  <option value="">— Select —</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Expiry Date</span>
                <input type="date" value={regoForm.registration_expiry} onChange={e => setRegoForm(f => ({ ...f, registration_expiry: e.target.value }))} />
              </label>
            </div>
            <label style={{ marginTop: 8, display: "block" }}>
              <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Notes (optional)</span>
              <input value={regoForm.notes} onChange={e => setRegoForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Renewed for 12 months" />
            </label>
            <button type="submit" disabled={regoSaving} style={{ marginTop: 10, background: "#1B3A6B" }}>
              {regoSaving ? "Saving…" : "Save Amendment"}
            </button>
          </form>
        )}

        {regoHistory.length > 0 && (
          <details style={{ marginTop: 16 }}>
            <summary style={{ fontSize: 13, color: "#1B3A6B", cursor: "pointer", userSelect: "none" }}>
              Registration History ({regoHistory.length} record{regoHistory.length !== 1 ? "s" : ""})
            </summary>
            <table style={{ marginTop: 8, fontSize: 12 }}>
              <thead>
                <tr><th>Recorded</th><th>Rego No</th><th>State</th><th>Expiry</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {regoHistory.map(h => (
                  <tr key={h.id}>
                    <td>{new Date(h.recorded_at).toLocaleDateString("en-AU")}</td>
                    <td>{h.registration_no || "—"}</td>
                    <td>{h.registration_state || "—"}</td>
                    <td>{h.expiry_date ? new Date(h.expiry_date).toLocaleDateString("en-AU") : "—"}</td>
                    <td>{h.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>

      {/* KM Section */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ ...h3Style, margin: 0, border: "none", paddingBottom: 0 }}>Kilometres</h3>
          <button onClick={() => setShowKmForm(!showKmForm)}
            style={{ fontSize: 12, background: "#1B3A6B", padding: "4px 12px" }}>
            {showKmForm ? "Cancel" : "+ Record Reading"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: showKmForm ? 16 : 0 }}>
          <div>
            <span style={{ fontSize: 11, color: "#888" }}>Current KMs</span>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{v.current_kms ? v.current_kms.toLocaleString() : "—"}</div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#888" }}>As at</span>
            <div style={{ fontWeight: 600 }}>
              {v.current_kms_date ? new Date(v.current_kms_date).toLocaleDateString("en-AU") : "—"}
            </div>
          </div>
        </div>

        {showKmForm && (
          <form onSubmit={submitKm} style={{ background: "#fff", border: "1px solid #dce6f5", borderRadius: 6, padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12 }}>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Kilometres</span>
                <input type="number" required value={kmForm.kms} onChange={e => setKmForm(f => ({ ...f, kms: e.target.value }))} placeholder="e.g. 245000" />
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Reading Date</span>
                <input type="date" required value={kmForm.reading_date} onChange={e => setKmForm(f => ({ ...f, reading_date: e.target.value }))} />
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Notes (optional)</span>
                <input value={kmForm.notes} onChange={e => setKmForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Service reading" />
              </label>
            </div>
            <button type="submit" disabled={kmSaving} style={{ marginTop: 10, background: "#1B3A6B" }}>
              {kmSaving ? "Saving…" : "Save Reading"}
            </button>
          </form>
        )}

        {kmHistory.length > 0 && (
          <details style={{ marginTop: 16 }} open={kmHistory.length <= 5}>
            <summary style={{ fontSize: 13, color: "#1B3A6B", cursor: "pointer", userSelect: "none" }}>
              KM History ({kmHistory.length} reading{kmHistory.length !== 1 ? "s" : ""})
            </summary>
            <table style={{ marginTop: 8, fontSize: 12 }}>
              <thead>
                <tr><th>Reading Date</th><th>Kilometres</th><th>Notes</th><th>Recorded</th></tr>
              </thead>
              <tbody>
                {kmHistory.map((h, i) => (
                  <tr key={h.id}>
                    <td>{new Date(h.reading_date).toLocaleDateString("en-AU")}</td>
                    <td><strong>{h.kms.toLocaleString()}</strong>
                      {i < kmHistory.length - 1 && kmHistory[i + 1]?.kms
                        ? <span style={{ fontSize: 11, color: "#888", marginLeft: 6 }}>
                            (+{(h.kms - kmHistory[i + 1].kms).toLocaleString()})
                          </span>
                        : null}
                    </td>
                    <td>{h.notes || "—"}</td>
                    <td>{new Date(h.recorded_at).toLocaleDateString("en-AU")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>

      {/* Compliance */}
      {data.compliance && (
        <div style={sectionStyle}>
          <h3 style={h3Style}>Compliance</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 13 }}>
            <div><span style={{ color: "#888", fontSize: 11 }}>NHVAS Mass</span><div>{data.compliance.nhvas_mass ? "Yes" : "No"}</div></div>
            <div><span style={{ color: "#888", fontSize: 11 }}>Mass Active</span><div>{data.compliance.mass_active ? "Yes" : "No"}</div></div>
            <div><span style={{ color: "#888", fontSize: 11 }}>DG Licence Req</span><div>{data.compliance.dg_licence_required ? "Yes" : "No"}</div></div>
          </div>
        </div>
      )}

      {/* Transfer History */}
      {data.history?.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={h3Style}>Transfer History</h3>
          <table style={{ fontSize: 12 }}>
            <thead><tr><th>Date</th><th>From</th><th>To</th></tr></thead>
            <tbody>
              {data.history.map((h: any, i: number) => (
                <tr key={i}>
                  <td>{h.transfer_date ? new Date(h.transfer_date).toLocaleDateString("en-AU") : "—"}</td>
                  <td>{h.transferring_depot || "—"}</td>
                  <td>{h.location_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EF({ label, value, onSave, type = "text", multiline = false }: {
  label: string; value: any; onSave: (v: string) => void; type?: string; multiline?: boolean;
}) {
  const [val, setVal] = useState(value ?? "");
  return (
    <label>
      <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>{label}</span>
      {multiline
        ? <textarea rows={3} value={val} onChange={e => setVal(e.target.value)} onBlur={() => onSave(val)} style={{ width: "100%" }} />
        : <input type={type} value={val} onChange={e => setVal(e.target.value)} onBlur={() => onSave(val)} />}
    </label>
  );
}
