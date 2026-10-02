import os

# Configuracion de produccion de Gunicorn para Render
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
workers = int(os.getenv("WEB_CONCURRENCY", "2"))
timeout = int(os.getenv("GUNICORN_TIMEOUT", "300"))
keepalive = 5
max_requests = 1000
max_requests_jitter = 50
worker_class = "sync"
accesslog = "-"
errorlog = "-"
loglevel = "info"
