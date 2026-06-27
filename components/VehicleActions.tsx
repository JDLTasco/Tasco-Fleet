"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Location = { id: string; name: string };

export default function VehicleActions({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({});
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed to save");
    }
  }

  function field(name: string, label: string, type = "text", required = false) {
    return (
      <label style={{ display: "block", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 3 }}>
          {label}{required && " *"}
        </span>
        <input
          type={type}
          required={required}
          value={form[name] || ""}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          style={{ width: "100%", boxSizing: "border-box" }}
        />
      </label>
    );
  }

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        style={{ background: "#1B3A6B", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}
      >
        {showForm ? "Cancel" : "+ Add Vehicle"}
      </button>

      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", borderRadius: 10, padding: 32, width: 560,
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}>
            <h3 style={{ margin: "0 0 20px", color: "#1B3A6B" }}>Add New Vehicle</h3>
            <form onSubmit={addVehicle}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                {field("fleet_no", "Fleet No", "text", true)}
                {field("year", "Year", "number")}
                {field("make", "Make")}
                {field("model", "Model")}
                <label style={{ display: "block", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 3 }}>Vehicle Type</span>
                  <select value={form.vehicle_type || ""} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} style={{ width: "100%", boxSizing: "border-box" }}>
                    <option value="">Select type…</option>
                    {["Prime Mover","Rigid","Trailer","Tanker","B-Double","Road Train","B-Train","Other"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </label>
                {field("sub_type", "Sub Type")}
                {field("vin", "VIN")}
                {field("description", "Description")}
                <label style={{ display: "block", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 3 }}>Depot</span>
                  <select value={form.location_id || ""} onChange={(e) => setForm({ ...form, location_id: e.target.value })} style={{ width: "100%", boxSizing: "border-box" }}>
                    <option value="">No depot</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </label>
                {field("acquired_date", "Date Acquired", "date")}
              </div>
              {error && <p style={{ color: "#c5221f", fontSize: 13 }}>{error}</p>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: "#eee", color: "#333", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ background: "#1B3A6B", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}>
                  {saving ? "Saving…" : "Add Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
