"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Location = { id: string; name: string };

export default function SelectViewPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [mode, setMode] = useState<"admin" | "depot" | null>(null);
  const [depotId, setDepotId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/locations").then((r) => r.json()).then(setLocations);
  }, []);

  async function proceed() {
    if (!mode) return;
    if (mode === "depot" && !depotId) return;
    setLoading(true);
    const depot = locations.find((l) => l.id === depotId);
    await fetch("/api/auth/select-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, depotId: depot?.id, depotName: depot?.name }),
    });
    router.push("/vehicles");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#1B3A6B",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "48px 40px",
        width: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      }}>
        <h2 style={{ margin: "0 0 8px", color: "#1B3A6B", fontSize: 20 }}>Select Access Mode</h2>
        <p style={{ color: "#666", fontSize: 14, margin: "0 0 28px" }}>How would you like to view the fleet?</p>

        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <ModeCard
            title="Admin"
            description="All vehicles across all depots"
            selected={mode === "admin"}
            onClick={() => { setMode("admin"); setDepotId(""); }}
          />
          <ModeCard
            title="Depot"
            description="Filter to a specific depot"
            selected={mode === "depot"}
            onClick={() => setMode("depot")}
          />
        </div>

        {mode === "depot" && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>
              Select Depot
            </label>
            <select
              value={depotId}
              onChange={(e) => setDepotId(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", fontSize: 14 }}
            >
              <option value="">— Choose a depot —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={proceed}
          disabled={!mode || (mode === "depot" && !depotId) || loading}
          style={{
            width: "100%", padding: "12px", fontSize: 15, fontWeight: 600,
            background: (!mode || (mode === "depot" && !depotId)) ? "#ccc" : "#1B3A6B",
            color: "#fff", border: "none", borderRadius: 6,
            cursor: (!mode || (mode === "depot" && !depotId)) ? "default" : "pointer",
          }}
        >
          {loading ? "Loading..." : "Enter Fleet System"}
        </button>
      </div>
    </div>
  );
}

function ModeCard({ title, description, selected, onClick }: {
  title: string; description: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, padding: "20px 16px", border: `2px solid ${selected ? "#1B3A6B" : "#ddd"}`,
        borderRadius: 8, background: selected ? "#eef2f9" : "#fafafa",
        cursor: "pointer", textAlign: "left",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1B3A6B", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: "#666" }}>{description}</div>
    </button>
  );
}
