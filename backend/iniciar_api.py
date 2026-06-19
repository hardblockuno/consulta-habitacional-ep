"""Inicia la API local de Consulta Habitacional sin abrir una consola adicional."""

from __future__ import annotations

import logging
import os
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent


def configurar_registro() -> logging.Logger:
    custom_path = os.getenv("CONSULTA_API_LOG", "").strip()
    if custom_path:
        log_path = Path(custom_path)
    else:
        app_data = Path(os.getenv("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
        log_path = app_data / "ConsultaHabitacionalEP" / "api.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        filename=log_path,
        filemode="w",
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    return logging.getLogger("consulta_habitacional.api")


def main() -> int:
    os.environ.setdefault("USE_SQLITE", "1")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    sys.path.insert(0, str(BASE_DIR))
    logger = configurar_registro()

    # pythonw no crea stdout/stderr. Django necesita ambos streams para iniciar
    # runserver, aunque la aplicacion se ejecute silenciosamente.
    null_output = open(os.devnull, "w", encoding="utf-8")
    if sys.stdout is None:
        sys.stdout = null_output
    if sys.stderr is None:
        sys.stderr = null_output

    try:
        from django.core.management import execute_from_command_line

        logger.info("Iniciando API local")
        execute_from_command_line([str(BASE_DIR / "manage.py"), "migrate", "--noinput", "--verbosity", "0"])
        execute_from_command_line(
            [str(BASE_DIR / "manage.py"), "runserver", "127.0.0.1:8000", "--noreload", "--verbosity", "0"]
        )
    except Exception:
        logger.exception("No fue posible iniciar la API local")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
