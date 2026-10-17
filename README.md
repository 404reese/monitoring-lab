# Monitoring Lab

A playground for comparing observability stacks against the same demo apps.

```
monitoring-lab/
├── apps/                  # stack-agnostic demo apps (shared by every stack)
│   ├── fastapi-app/       # FastAPI: /, /slow, /error, /health, /metrics
│   └── nextjs-app/        # Next.js: UI that proxies to FastAPI, /api/metrics
└── stacks/                # one folder per observability stack
    └── grafana-loki-prometheus/
```

## Layout idea

- **`apps/`** contain no stack-specific code. They read backend settings from
  environment variables (e.g. `LOKI_URL`, `FASTAPI_URL`) and enable an integration
  only when its variable is set.
- **`stacks/<name>/`** is a self-contained docker compose project (with a top-level
  `name:` so containers, networks and volumes are isolated). It builds the apps from
  `../../apps/...` and injects the env vars that point at its own backends.

To add a new stack (Tempo, ELK, ...), create `stacks/<new-stack>/docker-compose.yml`
that builds the same apps and sets whatever env vars the stack needs.

## Available stacks

| Stack | Description |
|-------|-------------|
| [grafana-loki-prometheus](stacks/grafana-loki-prometheus/README.md) | Prometheus metrics + Loki logs (app push and Promtail) + Grafana dashboards |

## Running a stack

Run compose commands from inside the stack folder:

```bash
cd stacks/grafana-loki-prometheus
docker compose up --build
```

## Switching stacks

Run **only one stack at a time**: stacks publish the same host ports (3000, 3001, 8000, ...).
Before switching:

```bash
docker compose down        # from the running stack's folder (add -v to also wipe its data)
cd ../other-stack
docker compose up --build
```
