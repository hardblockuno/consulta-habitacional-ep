"""Inicia la API local de Consulta Habitacional sin abrir una consola adicional."""

from __future__ import annotations

import logging
import os
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


BASE_DIR = Path(__file__).resolve().parent
STATUS_URL = "http://127.0.0.1:8000/api/rukan/ia-estado/"


def configurar_registro() -> tuple[logging.Logger, Path]:
    custom_path = os.getenv("CONSULTA_API_LOG", "").strip()
    if custom_path:
        log_path = Path(custom_path)
    else:
        app_data = Path(os.getenv("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
        log_path = app_data / "ConsultaHabitacionalEP" / "api.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        filename=log_path,
        filemode="a",
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    return logging.getLogger("consulta_habitacional.api"), log_path


def api_ya_activa(url: str = STATUS_URL) -> bool:
    try:
        req = Request(url, method="GET")
        with urlopen(req, timeout=1.5) as resp:
            return resp.status == 200
    except (HTTPError, URLError, TimeoutError, OSError, ValueError):
        return False


def main() -> int:
    os.environ.setdefault("USE_SQLITE", "1")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    sys.path.insert(0, str(BASE_DIR))
    logger, log_path = configurar_registro()

    if api_ya_activa():
        logger.info("La API local ya se encuentra activa y respondiendo en 127.0.0.1:8000.")
        return 0

    # Redirigir stdout y stderr al archivo de log en vez de devnull para que los
    # tracebacks de Django y errores del servidor queden persistidos.
    try:
        log_file = open(log_path, "a", encoding="utf-8", buffering=1)
    except OSError:
        log_file = open(os.devnull, "w", encoding="utf-8")

    if sys.stdout is None:
        sys.stdout = log_file
    if sys.stderr is None:
        sys.stderr = log_file

    try:
        from django.core.management import execute_from_command_line

        logger.info("Iniciando API local...")
        execute_from_command_line([str(BASE_DIR / "manage.py"), "migrate", "--noinput", "--verbosity", "0"])

        max_reintentos = 3
        for intento in range(1, max_reintentos + 1):
            try:
                logger.info("Ejecutando runserver en 127.0.0.1:8000 (intento %s/%s)", intento, max_reintentos)
                execute_from_command_line(
                    [str(BASE_DIR / "manage.py"), "runserver", "127.0.0.1:8000", "--noreload", "--verbosity", "0"]
                )
                break
            except SystemExit as se:
                if se.code == 0:
                    break
                logger.warning("runserver termino con codigo %s (intento %s/%s)", se.code, intento, max_reintentos)
                if intento < max_reintentos:
                    time.sleep(2)
            except Exception:
                logger.exception("Error inesperado en runserver (intento %s/%s)", intento, max_reintentos)
                if intento < max_reintentos:
                    time.sleep(2)
    except Exception:
        logger.exception("No fue posible iniciar la API local")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
