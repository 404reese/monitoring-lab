"""Demo FastAPI app: Prometheus metrics at /metrics, optional logs to Loki.

Stack-agnostic: Loki logging is enabled only when LOKI_URL is set
(e.g. http://loki:3100/loki/api/v1/push).
"""
import logging
import os
import random
import time
from logging.handlers import QueueHandler, QueueListener
from queue import Queue

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

logger = logging.getLogger("fastapi-app")
logger.setLevel(logging.INFO)
_console = logging.StreamHandler()
_console.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
logger.addHandler(_console)

LOKI_URL = os.getenv("LOKI_URL")
if LOKI_URL:
    import logging_loki

    # Queue + listener thread so slow/unavailable Loki never blocks requests.
    _queue: Queue = Queue(-1)
    _loki = logging_loki.LokiHandler(url=LOKI_URL, tags={"app": "fastapi"}, version="1")
    _listener = QueueListener(_queue, _loki)
    _listener.start()
    logger.addHandler(QueueHandler(_queue))
    logger.info("Loki logging enabled -> %s", LOKI_URL)

app = FastAPI(title="FastAPI demo")
Instrumentator().instrument(app).expose(app, endpoint="/metrics")


@app.get("/")
def root():
    logger.info("Root endpoint called")
    return {"message": "Hello from FastAPI"}


@app.get("/slow")
def slow():
    delay = random.uniform(0.2, 2.0)
    time.sleep(delay)
    logger.warning("Slow endpoint took %.2fs", delay)
    return {"message": "slow response", "delay_seconds": round(delay, 2)}


@app.get("/error")
def error():
    try:
        raise RuntimeError("Intentional failure from /error")
    except RuntimeError:
        logger.error("Error endpoint raised an exception", exc_info=True)
        raise


@app.get("/health")
def health():
    return {"status": "ok"}
