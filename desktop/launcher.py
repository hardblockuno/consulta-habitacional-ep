"""Lanzador silencioso de la version instalable de Consulta Habitacional EP."""

from __future__ import annotations

import ctypes
import logging
import os
import sys
import threading
import time
import webbrowser
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen
from wsgiref.simple_server import WSGIRequestHandler, WSGIServer, make_server


APP_NAME = "Consulta Habitacional EP"
API_URL = "http://127.0.0.1:8000/api/rukan/ia-estado/"


def install_directory() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parents[1]


def backend_directory() -> Path:
    if getattr(sys, "frozen", False):
        return Path(getattr(sys, "_MEIPASS"))
    return install_directory() / "backend"


def app_data_directory() -> Path:
    root = Path(os.getenv("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    data_dir = root / "ConsultaHabitacionalEP"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def configure_environment() -> tuple[Path, Path]:
    app_dir = install_directory()
    data_dir = app_data_directory()
    backend_dir = backend_directory()
    tesseract_dir = app_dir / "tesseract"

    os.environ["USE_SQLITE"] = "1"
    os.environ["DEBUG"] = "0"
    os.environ["CONSULTA_APP_DATA"] = str(data_dir)
    os.environ["CONSULTA_API_LOG"] = str(data_dir / "api.log")
    os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"
    os.environ["RUKAN_AI_PROVIDER"] = "tesseract"
    os.environ["RUKAN_TESSERACT_LANG"] = "spa+eng"
    if (tesseract_dir / "tesseract.exe").is_file():
        os.environ["RUKAN_TESSERACT_CMD"] = str(tesseract_dir / "tesseract.exe")
        os.environ["TESSDATA_PREFIX"] = str(tesseract_dir / "tessdata")

    sys.path.insert(0, str(backend_dir))
    return app_dir, data_dir


def configure_logging(data_dir: Path) -> logging.Logger:
    logging.basicConfig(
        filename=data_dir / "api.log",
        filemode="a",
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    return logging.getLogger("consulta_habitacional.desktop")


def api_available() -> bool:
    try:
        with urlopen(API_URL, timeout=1) as response:
            return response.status == 200
    except (URLError, OSError, TimeoutError):
        return False


def open_interface(app_dir: Path) -> None:
    page = app_dir / "docs" / "index.html"
    if page.is_file():
        webbrowser.open(page.resolve().as_uri())
    else:
        raise FileNotFoundError("No se encontro la interfaz de Consulta Habitacional EP.")


class SilentRequestHandler(WSGIRequestHandler):
    def log_message(self, format, *args):  # noqa: A003
        logging.getLogger("consulta_habitacional.desktop").info(format, *args)


class LoggingWSGIServer(WSGIServer):
    """Registra fallos HTTP, que en una aplicacion sin consola no son visibles."""

    def handle_error(self, request, client_address):
        logging.getLogger("consulta_habitacional.desktop").exception(
            "Error al atender la solicitud desde %s", client_address
        )


def show_error(message: str) -> None:
    ctypes.windll.user32.MessageBoxW(None, message, APP_NAME, 0x10)


def launch_server(app_dir: Path, logger: logging.Logger) -> None:
    import django
    from django.core.management import call_command
    from django.core.wsgi import get_wsgi_application

    django.setup()
    call_command("migrate", interactive=False, verbosity=0)
    application = get_wsgi_application()
    server = make_server(
        "127.0.0.1",
        8000,
        application,
        server_class=LoggingWSGIServer,
        handler_class=SilentRequestHandler,
    )
    logger.info("API local iniciada")

    def open_when_ready() -> None:
        for _ in range(30):
            if api_available():
                open_interface(app_dir)
                return
            time.sleep(1)
        raise RuntimeError("La API local no respondio dentro del tiempo esperado.")

    threading.Thread(target=open_when_ready, name="AbrirConsultaHabitacional", daemon=True).start()
    server.serve_forever()


def main() -> int:
    app_dir, data_dir = configure_environment()
    logger = configure_logging(data_dir)
    try:
        if api_available():
            open_interface(app_dir)
            return 0
        launch_server(app_dir, logger)
    except Exception as exc:
        logger.exception("No fue posible iniciar la plataforma instalada")
        show_error(
            "No fue posible iniciar Consulta Habitacional EP.\n\n"
            f"Detalle tecnico: {exc}\n\n"
            f"Revisa el archivo: {data_dir / 'api.log'}"
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
