import { NextResponse } from "next/server";
import { logger } from "./logger";
import { instrument } from "./metrics";

const fastapiUrl = () => process.env.FASTAPI_URL || "http://fastapi:8000";

/** Build a route handler that proxies to a FastAPI path. */
export function proxyTo(route, path) {
  return instrument(route, async () => {
    try {
      const upstream = await fetch(`${fastapiUrl()}${path}`, { cache: "no-store" });
      const body = await upstream.json().catch(() => ({}));
      logger.log(upstream.ok ? "info" : "error", `proxy ${path} -> ${upstream.status}`, {
        route,
        upstream: upstream.status,
      });
      return NextResponse.json({ upstreamStatus: upstream.status, body }, { status: upstream.status });
    } catch (err) {
      logger.error(`proxy ${path} failed: ${err.message}`, { route });
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
  });
}
