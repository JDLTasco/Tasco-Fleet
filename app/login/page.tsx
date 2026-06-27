"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/select-view");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Invalid credentials");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#1B3A6B",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "48px 40px",
        width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "#1B3A6B", margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>T</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1B3A6B" }}>
            Tasco Carriers
          </h1>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>Fleet Management System</p>
        </div>

        <form onSubmit={onSubmit}>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 4 }}>
              Username
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 15 }}
            />
          </label>
          <label style={{ display: "block", marginBottom: 24 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 4 }}>
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 15 }}
            />
          </label>
          {error && (
            <p style={{ color: "#c5221f", fontSize: 13, margin: "-12px 0 16px", textAlign: "center" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px", fontSize: 15, fontWeight: 600,
              background: loading ? "#6b8fc7" : "#1B3A6B", color: "#fff",
              border: "none", borderRadius: 6, cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
