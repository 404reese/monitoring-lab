import client from "prom-client";

// Singleton registry: Next may bundle route handlers separately, so stash on globalThis.
const KEY = Symbol.for("monitoring-lab.metrics");

function create() {
  const register = new client.Registry();
  client.collectDefaultMetrics({ register });
  const httpRequestsTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total HTTP requests handled by the Next.js app",
    labelNames: ["method", "route", "status"],
    registers: [register],
  });
  const httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status"],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
  });
  return { register, httpRequestsTotal, httpRequestDuration };
}

export const metrics = (globalThis[KEY] ??= create());

/** Wrap a route handler to record request count and duration. */
export function instrument(route, handler) {
  return async (request) => {
    const end = metrics.httpRequestDuration.startTimer();
    let status = 500;
    try {
      const response = await handler(request);
      status = response.status;
      return response;
    } finally {
      const labels = { method: request.method, route, status: String(status) };
      metrics.httpRequestsTotal.inc(labels);
      end(labels);
    }
  };
}
