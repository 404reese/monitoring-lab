# Stack: Grafana + Loki + Prometheus

## Architecture

```
 browser ──> nextjs (:3001) ──proxy──> fastapi (:8000)

 Prometheus ──scrapes every 4s──> fastapi:8000/metrics, nextjs:3000/api/metrics, itself
 fastapi / nextjs ──push logs (label app=...)──> Loki
 Promtail ──reads container stdout via docker.sock──> Loki
 Grafana ──queries──> Prometheus (default) + Loki
```

All services share the compose default network and reach each other by service name.
Data lives in named volumes: `prometheus-data`, `loki-data`, `grafana-data`.

## Run

From this folder:

```bash
docker compose up --build
```

Stop with `docker compose down` (add `-v` to delete stored data). Generate load with
`./scripts/generate-traffic.sh` (or use the buttons on the Next.js page).

## URLs and ports

| Service | Host URL | Container port |
|---------|----------|----------------|
| Grafana (admin/admin) | http://localhost:3000 | 3000 |
| Next.js app | http://localhost:3001 | 3000 |
| FastAPI | http://localhost:8000 | 8000 |
| Prometheus | http://localhost:9090 (targets: /targets) | 9090 |
| Loki | http://localhost:3100/ready | 3100 |
| cAdvisor (host metrics, no host port) | scraped by Prometheus at `cadvisor:8080` | 8080 |

## Example PromQL

```promql
sum by (job) (rate(http_requests_total{job=~"fastapi|nextjs"}[1m]))            # request rate
histogram_quantile(0.95, sum by (le, job) (rate(http_request_duration_seconds_bucket[1m])))  # p95
sum by (job) (rate(http_requests_total{status=~"5.*"}[1m]))                    # 5xx rate
up                                                                              # target health
```

## Example LogQL (Grafana -> Explore -> Loki)

```logql
{app="fastapi"}
{app="nextjs"} | json | level="error"
{app="fastapi"} |= "Slow endpoint"
{job="docker", service="fastapi"}                    # container logs via Promtail
sum by (app) (count_over_time({app=~"fastapi|nextjs"}[1m]))
```

## Troubleshooting

- **Port already allocated**: another stack (or app) uses the port. `docker compose down` in the other stack.
- **A target is DOWN** at http://localhost:9090/targets: check `docker compose logs <service>`; the target must be `host:port` without `http://`.
- **No logs in Loki**: check `curl localhost:3100/ready`, then `docker compose logs loki fastapi nextjs promtail`. App push logs are batched, so wait a few seconds.
- **Promtail sees no containers**: it needs `/var/run/docker.sock`; on Docker Desktop make sure the daemon is running.
- **Dashboard empty**: generate traffic first; rates need a couple of scrapes.
- **Changed a provisioning file**: `docker compose restart grafana`.
- **Start from scratch**: `docker compose down -v`.

## Dashboard

"Monitoring Lab Overview" has sections: Overview (uptime, req/s, error %, p95, host CPU/memory gauges),
Traffic, Process resources (CPU/RSS/FDs, Node heap and event loop, Python GC), Bandwidth (app request/response
bytes, Docker bridge and VM uplink throughput), Docker host (cAdvisor), Prometheus health, and Logs.

Note: on Docker Desktop (WSL2) cAdvisor cannot see per-container cgroups, so CPU/memory/network
panels are host/VM-wide; per-app CPU and memory come from each app's own process metrics instead.
If you edit the dashboard JSON, run `docker compose restart grafana` (bind mounts on Docker Desktop
don't always trigger Grafana's file watcher).
