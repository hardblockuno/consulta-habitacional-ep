"""Espera a que el backend local de Rukan quede disponible antes de abrir la web."""

from __future__ import annotations

import argparse
import json
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


RUKAN_AI_URL = "http://127.0.0.1:8000/api/rukan/ia-estado/"


def api_disponible(url: str = RUKAN_AI_URL, provider: str = "") -> bool:
    request = Request(url, method="GET")
    try:
        with urlopen(request, timeout=1) as response:
            if not provider:
                return True
            payload = json.loads(response.read().decode("utf-8"))
            return payload.get("provider") == provider
    except (HTTPError, URLError, TimeoutError, OSError, ValueError):
        return False


def esperar_api(segundos: int, provider: str = "") -> bool:
    limite = time.monotonic() + segundos
    while time.monotonic() < limite:
        if api_disponible(provider=provider):
            return True
        time.sleep(1)
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Espera la API local de Consulta Habitacional.")
    parser.add_argument("--segundos", type=int, default=35)
    parser.add_argument("--provider", default="", help="Proveedor local esperado, por ejemplo tesseract.")
    args = parser.parse_args()
    if esperar_api(max(1, args.segundos), args.provider.strip().lower()):
        return 0
    print("La API local no inicio. Vuelve a abrir Consulta Habitacional.bat.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
