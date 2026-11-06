"""Inicia el motor Streamlit de Ecobarrios para el SIGEP."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT_DIR = Path(__file__).resolve().parent.parent
ECOBARRIOS_DIR = ROOT_DIR / "ecobarrios"
APP_PATH = ECOBARRIOS_DIR / "app.py"
HEALTH_URL = "http://127.0.0.1:8501/_stcore/health"


def ecobarrios_ya_activo(url: str = HEALTH_URL) -> bool:
    try:
        req = Request(url, method="GET")
        with urlopen(req, timeout=1.5) as resp:
            return resp.status in (200, 204)
    except (HTTPError, URLError, TimeoutError, OSError, ValueError):
        return False


def main() -> int:
    app_data = Path(os.getenv("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    log_path = app_data / "ConsultaHabitacionalEP" / "ecobarrios.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)

    if ecobarrios_ya_activo():
        return 0

    log_file = open(log_path, "a", encoding="utf-8", buffering=1)

    cmd = [
        sys.executable,
        "-m",
        "streamlit",
        "run",
        str(APP_PATH),
        "--server.port=8501",
        "--server.headless=true",
        "--server.address=127.0.0.1",
        "--browser.gatherUsageStats=false",
    ]

    subprocess.run(
        cmd,
        stdout=log_file,
        stderr=log_file,
        cwd=str(ECOBARRIOS_DIR),
        check=False,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
