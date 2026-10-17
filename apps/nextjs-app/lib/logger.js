import winston from "winston";
import LokiTransport from "winston-loki";

// Keep one logger per process (survives hot reload / duplicate module instances).
const KEY = Symbol.for("monitoring-lab.logger");

function create() {
  const transports = [new winston.transports.Console()];
  const lokiUrl = process.env.LOKI_URL;
  if (lokiUrl) {
    transports.push(
      new LokiTransport({
        // winston-loki wants the base URL and appends /loki/api/v1/push itself.
        host: lokiUrl.replace(/\/loki\/api\/v1\/push\/?$/, ""),
        labels: { app: "nextjs" },
        json: true,
        batching: true,
        interval: 2,
        replaceTimestamp: true,
        onConnectionError: (err) => console.error("Loki connection error", err.message),
      })
    );
  }
  return winston.createLogger({
    level: "info",
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports,
  });
}

export const logger = (globalThis[KEY] ??= create());
