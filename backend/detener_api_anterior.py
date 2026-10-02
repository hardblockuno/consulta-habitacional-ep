"""Detiene una instancia anterior de esta plataforma que aun ocupa el puerto local."""

from __future__ import annotations

import json
import subprocess
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


STATUS_URL = "http://127.0.0.1:8000/api/rukan/ia-estado/"


def es_api_de_la_plataforma() -> bool:
    try:
        with urlopen(Request(STATUS_URL, method="GET"), timeout=2) as response:
            payload = json.loads(response.read().decode("utf-8"))
        return isinstance(payload, dict) and "provider" in payload
    except (HTTPError, URLError, TimeoutError, OSError, ValueError):
        return False


def proceso_en_puerto_8000() -> str:
    result = subprocess.run(
        ["netstat", "-ano", "-p", "tcp"],
        capture_output=True,
        text=True,
        check=False,
    )
    for line in result.stdout.splitlines():
        parts = line.split()
        if len(parts) >= 5 and parts[1].endswith(":8000") and parts[3].upper() == "LISTENING":
            return parts[-1]
    return ""


def es_proceso_python(process_id: str) -> bool:
    if not process_id or not process_id.isdigit():
        return False
    try:
        result = subprocess.run(
            ["tasklist", "/FI", f"PID eq {process_id}", "/FO", "CSV", "/NH"],
            capture_output=True,
            text=True,
            check=False,
        )
        return "python" in result.stdout.lower()
    except Exception:
        return False


def main() -> int:
    process_id = proceso_en_puerto_8000()
    if not process_id:
        return 0

    # Si responde a la plataforma o si es un proceso Python colgado ocupando el puerto 8000
    if es_api_de_la_plataforma() or es_proceso_python(process_id):
        subprocess.run(["taskkill", "/PID", process_id, "/T", "/F"], check=False, capture_output=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
