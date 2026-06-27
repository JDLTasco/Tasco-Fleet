"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Location = { id: string; name: string };

export default function VehicleRowActions({
  vehicleId, fleetNo, status, currentDepotId, locations,
}: {
  vehicleId: string; fleetNo: string; status: string;
  currentDepotId: string | null; locations: Location[];
}) {
  const router = useRouter();
  const [transferring, setTransferring] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function transfer(locationId: string) {
    if (!locationId || locationId === currentDepotId) return;
    if (!confirm(`Transfer ${fleetNo} to new depot?`)) return;
    setTransferring(true);
    await fetch(`/api/vehicles/${vehicleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location_id: locationId }),
    });
    setTransferring(false);
    router.refresh();
  }

  async function toggleArchive() {
    const isArchived = status === "disposed";
    const action = isArchived ? "restore" : "archive";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} vehicle ${fleetNo}?`)) return;
    setArchiving(true);
    await fetch(`/api/vehicles/${vehicleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: isArchived ? "active" : "disposed" }),
    });
    setArchiving(false);
    router.refresh();
  }

  const isArchived = status === "disposed";

  return (
    <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <select
        defaultValue=""
        disabled={transferring}
        onChange={(e) => transfer(e.target.value)}
        style={{ fontSize: 11, padding: "2px 4px", maxWidth: 130 }}
        title={`Transfer ${fleetNo}`}
      >
        <option value="">Transfer…</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
      <button
        onClick={toggleArchive}
        disabled={archiving}
        style={{
          padding: "2px 8px", fontSize: 11,
          background: isArchived ? "#e6f4ea" : "#fce8e6",
          color: isArchived ? "#137333" : "#c5221f",
          border: `1px solid ${isArchived ? "#137333" : "#c5221f"}`,
          borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
        }}
      >
        {isArchived ? "Restore" : "Archive"}
      </button>
    </span>
  );
}
