"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/vehicles/${id}`).then((r) => r.json()).then(setData);
  }, [id]);

  if (!data) return <p>Loading...</p>;
  if (data.error) return <p className="error">{data.error}</p>;

  const v = data.vehicle;

  async function save(field: string, value: any) {
    setSaving(true);
    await fetch(`/api/vehicles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString());
  }

  return (
    <div>
      <h2>Fleet No {v.fleet_no} — {v.make} {v.model}</h2>
      <p style={{ color: "#888", fontSize: 13 }}>
        {saving ? "Saving..." : savedAt ? `Saved at ${savedAt}` : "Edits save automatically on blur"}
      </p>

      <div className="section">
        <h3>Specs</h3>
        <EditableField label="Make" value={v.make} onSave={(val) => save("make", val)} />
        <EditableField label="Model" value={v.model} onSave={(val) => save("model", val)} />
        <EditableField label="Description" value={v.description} onSave={(val) => save("description", val)} />
        <EditableField label="Year" value={v.year} type="number" onSave={(val) => save("year", Number(val))} />
        <EditableField label="VIN" value={v.vin} onSave={(val) => save("vin", val)} />
      </div>

      <div className="section">
        <h3>Operations</h3>
        <EditableField label="Current Kms" value={v.current_kms} type="number" onSave={(val) => save("current_kms", Number(val))} />
        <EditableField label="Current Kms Date" value={v.current_kms_date?.slice(0, 10)} type="date" onSave={(val) => save("current_kms_date", val)} />
        <label>
          Status
          <select defaultValue={v.status} onChange={(e) => save("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="disposed">Disposed</option>
          </select>
        </label>
        <EditableField label="Notes" value={v.notes} multiline onSave={(val) => save("notes", val)} />
      </div>

      {data.compliance && (
        <div className="section">
          <h3>Compliance (read-only in this build)</h3>
          <p>Registration: {data.compliance.registration_no || "—"} ({data.compliance.registration_state || "—"}), expires{" "}
            {data.compliance.registration_expiry ? new Date(data.compliance.registration_expiry).toLocaleDateString("en-AU") : "—"}</p>
          <p>NHVAS Mass: {data.compliance.nhvas_mass ? "Yes" : "No"} · Mass Active: {data.compliance.mass_active ? "Yes" : "No"}</p>
          <p>DG Licence Required: {data.compliance.dg_licence_required ? "Yes" : "No"}</p>
        </div>
      )}

      {data.history?.length > 0 && (
        <div className="section">
          <h3>Location history</h3>
          <table>
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

function EditableField({ label, value, onSave, type = "text", multiline = false }: {
  label: string; value: any; onSave: (v: string) => void; type?: string; multiline?: boolean;
}) {
  const [val, setVal] = useState(value ?? "");
  return (
    <label>
      {label}
      {multiline ? (
        <textarea rows={3} value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => onSave(val)} style={{ width: "100%" }} />
      ) : (
        <input type={type} value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => onSave(val)} />
      )}
    </label>
  );
}
