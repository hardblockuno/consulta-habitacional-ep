"""Herramienta de diagnóstico de red y conectividad local para SIGEP."""

from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def verificar_puerto(host: str, puerto: int, timeout: float = 1.0) -> bool:
    try:
        with socket.create_connection((host, puerto), timeout=timeout):
            return True
    except (OSError, TimeoutError):
        return False


def test_http(url: str, timeout: float = 2.0, headers: dict | None = None) -> tuple[int, str, dict]:
    req = Request(url, headers=headers or {})
    try:
        with urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            resp_headers = dict(resp.headers)
            return resp.status, body, resp_headers
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace") if hasattr(e, "read") else ""
        return e.code, body, dict(e.headers)
    except URLError as e:
        return 0, str(e.reason), {}
    except Exception as e:
        return 0, str(e), {}


def test_cors(url: str, origin: str = "http://localhost:5173") -> tuple[bool, str]:
    req = Request(
        url,
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
        method="OPTIONS",
    )
    try:
        with urlopen(req, timeout=2.0) as resp:
            allow_origin = resp.headers.get("Access-Control-Allow-Origin", "")
            if allow_origin == "*" or allow_origin == origin:
                return True, f"OK (Access-Control-Allow-Origin: {allow_origin})"
            return False, f"Cabecera inesperada: {allow_origin}"
    except HTTPError as e:
        allow_origin = e.headers.get("Access-Control-Allow-Origin", "")
        if allow_origin == "*" or allow_origin == origin:
            return True, f"OK en preflight con status {e.code}"
        return False, f"HTTP {e.code} sin cabecera CORS adecuada"
    except Exception as e:
        return False, str(e)


def main() -> int:
    print("=" * 65)
    print("  DIAGNÓSTICO DE RED Y CONECTIVIDAD LOCAL - SIGEP")
    print("=" * 65)

    # 1. Verificar configuración de Django
    print("\n[1/5] Verificando settings de Django (backend/config/settings.py)...")
    try:
        base_dir = Path(__file__).resolve().parent
        sys.path.insert(0, str(base_dir))
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
        os.environ.setdefault("USE_SQLITE", "1")
        import django
        django.setup()
        from django.conf import settings

        print(f"  - DEBUG: {settings.DEBUG}")
        print(f"  - CORS_ALLOW_ALL_ORIGINS: {getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', None)}")
        data_max = getattr(settings, "DATA_UPLOAD_MAX_MEMORY_SIZE", None)
        file_max = getattr(settings, "FILE_UPLOAD_MAX_MEMORY_SIZE", None)
        print(f"  - DATA_UPLOAD_MAX_MEMORY_SIZE: {data_max} bytes ({data_max / (1024*1024):.1f} MB)")
        print(f"  - FILE_UPLOAD_MAX_MEMORY_SIZE: {file_max} bytes ({file_max / (1024*1024):.1f} MB)")
        print(f"  - ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")

        cors_ok = getattr(settings, "CORS_ALLOW_ALL_ORIGINS", False) is True
        upload_ok = data_max and data_max >= 50 * 1024 * 1024
        if cors_ok and upload_ok:
            print("  -> Configuración Django: CORRECTA (CORS permisivo y límites 50MB OK)")
        else:
            print("  -> ADVERTENCIA: Revise parámetros de CORS o tamaño de subida.")
    except Exception as exc:
        print(f"  -> Error al cargar Django: {exc}")

    # 2. Verificar puerto 8000 (Backend)
    print("\n[2/5] Verificando conectividad Backend en puerto 8000...")
    p8000_127 = verificar_puerto("127.0.0.1", 8000)
    p8000_loc = verificar_puerto("localhost", 8000)
    print(f"  - Socket TCP 127.0.0.1:8000 -> {'CONECTADO' if p8000_127 else 'NO RESPONDE'}")
    print(f"  - Socket TCP localhost:8000 -> {'CONECTADO' if p8000_loc else 'NO RESPONDE'}")

    if p8000_127:
        status, body, _ = test_http("http://127.0.0.1:8000/api/rukan/ia-estado/")
        print(f"  - HTTP GET 127.0.0.1:8000/api/rukan/ia-estado/ -> Código {status}")
        cors_ok, cors_msg = test_cors("http://127.0.0.1:8000/api/importar/excel/")
        print(f"  - CORS Preflight desde http://localhost:5173 -> {cors_msg}")
    else:
        print("  -> El backend no está corriendo en el puerto 8000.")

    # 3. Verificar puerto 5173 (Frontend Vite)
    print("\n[3/5] Verificando Frontend Vite en puerto 5173...")
    p5173 = verificar_puerto("localhost", 5173) or verificar_puerto("127.0.0.1", 5173)
    print(f"  - Socket TCP puerto 5173 -> {'CONECTADO' if p5173 else 'NO RESPONDE'}")
    if p5173:
        status, _, _ = test_http("http://localhost:5173/")
        print(f"  - HTTP GET http://localhost:5173/ -> Código {status}")
        status_proxy, _, _ = test_http("http://localhost:5173/api/rukan/ia-estado/")
        print(f"  - Proxy Vite http://localhost:5173/api/... -> Código {status_proxy}")
    else:
        print("  -> Vite dev server no está en ejecución (inicie con 'npm run dev').")

    # 4. Procesos activos en puertos
    print("\n[4/5] Procesos del sistema en puertos 8000 y 5173...")
    try:
        res = subprocess.run(["netstat", "-ano", "-p", "tcp"], capture_output=True, text=True, check=False)
        for line in res.stdout.splitlines():
            if ":8000" in line or ":5173" in line:
                print(f"  {line.strip()}")
    except Exception as exc:
        print(f"  -> Error consultando netstat: {exc}")

    # 5. Resumen
    print("\n[5/5] Resumen de diagnóstico:")
    if p8000_127:
        print("  [OK] Backend Django operacional.")
    else:
        print("  [AVISO] Backend Django NO iniciado. Ejecute 'iniciar_api.py' o 'Consulta Habitacional.bat'.")
    if p5173:
        print("  [OK] Frontend Vite operacional.")
    else:
        print("  [INFO] Frontend Vite en espera. Ejecute 'npm run dev' en carpeta frontend para desarrollo.")

    print("=" * 65)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
