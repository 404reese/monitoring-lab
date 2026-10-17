"use client";

import { useState } from "react";

const ENDPOINTS = [
  { label: "Call / (info)", path: "/api/proxy/root" },
  { label: "Call /slow (warning)", path: "/api/proxy/slow" },
  { label: "Call /error (error)", path: "/api/proxy/error" },
];

export default function Home() {
  const [result, setResult] = useState("Click a button to generate traffic.");

  async function call(path) {
    setResult(`GET ${path} ...`);
    const started = performance.now();
    const res = await fetch(path);
    const json = await res.json().catch(() => ({}));
    const ms = Math.round(performance.now() - started);
    setResult(`GET ${path} -> ${res.status} in ${ms}ms\n${JSON.stringify(json, null, 2)}`);
  }

  return (
    <main style={{ maxWidth: 640, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Monitoring Lab</h1>
      <p>Each button hits a Next.js API route that proxies to the FastAPI app.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {ENDPOINTS.map((e) => (
          <button key={e.path} onClick={() => call(e.path)} style={{ padding: "0.6rem 1rem", cursor: "pointer" }}>
            {e.label}
          </button>
        ))}
      </div>
      <pre style={{ background: "#f4f4f4", padding: "1rem", marginTop: "1rem", overflow: "auto" }}>{result}</pre>
    </main>
  );
}
