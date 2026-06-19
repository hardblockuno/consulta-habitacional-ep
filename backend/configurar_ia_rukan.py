"""Prepara la lectura local de Rukan y conserva OpenAI como alternativa."""

from __future__ import annotations

import argparse
import os
import re
import sys
import tkinter as tk
import webbrowser
from pathlib import Path
from tkinter import messagebox
from tkinter import ttk


BACKEND_DIR = Path(__file__).resolve().parent
ENV_FILE = BACKEND_DIR / ".env"
ENV_EXAMPLE_FILE = BACKEND_DIR / ".env.example"
OPENAI_KEY_PAGE = "https://platform.openai.com/api-keys"
KEY_PATTERN = re.compile(r"^(\s*OPENAI_API_KEY\s*=).*$", re.IGNORECASE)
PROVIDER_PATTERN = re.compile(r"^\s*RUKAN_AI_PROVIDER\s*=\s*(.+?)\s*$", re.IGNORECASE)


def api_key_configurada(env_file: Path = ENV_FILE) -> bool:
    """Comprueba una clave local sin mostrarla ni registrarla."""
    if os.getenv("OPENAI_API_KEY", "").strip():
        return True
    if not env_file.exists():
        return False
    for line in env_file.read_text(encoding="utf-8").splitlines():
        if KEY_PATTERN.match(line):
            return bool(line.partition("=")[2].strip())
    return False


def proveedor_ia(env_file: Path = ENV_FILE) -> str:
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            match = PROVIDER_PATTERN.match(line)
            if match:
                return match.group(1).strip().lower()
    return os.getenv("RUKAN_AI_PROVIDER", "tesseract").strip().lower()


def habilitar_ocr_local(env_file: Path = ENV_FILE) -> None:
    """Migra la configuracion local anterior de Ollama al OCR liviano."""
    if not env_file.exists() and ENV_EXAMPLE_FILE.exists():
        env_file.write_text(ENV_EXAMPLE_FILE.read_text(encoding="utf-8"), encoding="utf-8")

    lines = env_file.read_text(encoding="utf-8").splitlines() if env_file.exists() else []
    replaced = False
    updated_lines = []
    for line in lines:
        match = PROVIDER_PATTERN.match(line)
        if match and match.group(1).strip().lower() in {"", "ollama"}:
            updated_lines.append("RUKAN_AI_PROVIDER=tesseract")
            replaced = True
        else:
            updated_lines.append(line)

    if not any(PROVIDER_PATTERN.match(line) for line in updated_lines):
        if updated_lines and updated_lines[-1].strip():
            updated_lines.append("")
        updated_lines.append("RUKAN_AI_PROVIDER=tesseract")
        replaced = True

    if replaced:
        env_file.write_text("\n".join(updated_lines) + "\n", encoding="utf-8")


def configuracion_ia_lista(env_file: Path = ENV_FILE) -> bool:
    """Ollama local no necesita clave; OpenAI si requiere una."""
    return proveedor_ia(env_file) != "openai" or api_key_configurada(env_file)


def guardar_api_key(api_key: str, env_file: Path = ENV_FILE) -> None:
    """Actualiza solo OPENAI_API_KEY y conserva las demas preferencias."""
    clean_key = api_key.strip()
    if not clean_key:
        raise ValueError("La clave no puede estar vacia.")

    if not env_file.exists() and ENV_EXAMPLE_FILE.exists():
        env_file.write_text(ENV_EXAMPLE_FILE.read_text(encoding="utf-8"), encoding="utf-8")

    lines = env_file.read_text(encoding="utf-8").splitlines() if env_file.exists() else []
    replaced = False
    updated_lines = []
    for line in lines:
        if KEY_PATTERN.match(line):
            updated_lines.append(f"OPENAI_API_KEY={clean_key}")
            replaced = True
        else:
            updated_lines.append(line)

    if not replaced:
        if updated_lines and updated_lines[-1].strip():
            updated_lines.append("")
        updated_lines.append("# Clave local para la lectura automatica de Rukan. No subir a GitHub.")
        updated_lines.append(f"OPENAI_API_KEY={clean_key}")

    env_file.write_text("\n".join(updated_lines) + "\n", encoding="utf-8")


def abrir_asistente(forzar: bool = False) -> bool:
    """Muestra un formulario grafico solo si aun no hay una clave configurada."""
    if not forzar and configuracion_ia_lista():
        return True

    root = tk.Tk()
    root.title("Configurar IA para Rukan")
    root.geometry("610x410")
    root.minsize(560, 380)
    root.resizable(True, True)

    style = ttk.Style(root)
    if "clam" in style.theme_names():
        style.theme_use("clam")

    frame = ttk.Frame(root, padding=24)
    frame.pack(fill="both", expand=True)

    ttk.Label(frame, text="Configurar lectura IA de Rukan", font=("Segoe UI", 16, "bold")).pack(anchor="w")
    ttk.Label(
        frame,
        text=(
            "La plataforma necesita una clave de API de OpenAI para leer los PDF Rukan.\n"
            "No es tu contrasena de ChatGPT ni ClaveUnica. La clave queda solo en este computador."
        ),
        justify="left",
        wraplength=550,
    ).pack(anchor="w", pady=(10, 14))

    ttk.Label(
        frame,
        text=(
            "1. Abre la pagina de claves e inicia sesion en tu cuenta de OpenAI.\n"
            "2. Crea una clave nueva, copiala y pegala aqui.\n"
            "3. Guarda. La plataforma se abrira lista para procesar Rukan."
        ),
        justify="left",
    ).pack(anchor="w")

    ttk.Button(frame, text="Abrir pagina para crear una clave", command=lambda: webbrowser.open(OPENAI_KEY_PAGE)).pack(
        anchor="w", pady=(12, 16)
    )

    ttk.Label(frame, text="Clave de API de OpenAI").pack(anchor="w")
    key_value = tk.StringVar()
    key_entry = ttk.Entry(frame, textvariable=key_value, show="*", width=72)
    key_entry.pack(fill="x", pady=(4, 4))
    key_entry.focus_set()

    status_value = tk.StringVar(value="")
    ttk.Label(frame, textvariable=status_value, foreground="#b42318", wraplength=550).pack(anchor="w", pady=(2, 10))

    result = {"saved": False}

    def guardar() -> None:
        api_key = key_value.get().strip()
        if not api_key:
            status_value.set("Pega la clave que creaste en la pagina de OpenAI.")
            return
        if not api_key.startswith("sk-"):
            status_value.set("La clave parece incompleta. Normalmente comienza con sk-.")
            return
        try:
            guardar_api_key(api_key)
        except OSError as error:
            status_value.set(f"No se pudo guardar la clave: {error}")
            return
        result["saved"] = True
        messagebox.showinfo("IA Rukan configurada", "La clave se guardo solo en este computador. Ya puedes usar la lectura automatica.")
        root.destroy()

    buttons = ttk.Frame(frame)
    buttons.pack(fill="x", side="bottom", pady=(16, 0))
    ttk.Button(buttons, text="Cancelar", command=root.destroy).pack(side="right")
    ttk.Button(buttons, text="Guardar y continuar", command=guardar).pack(side="right", padx=(0, 8))

    root.protocol("WM_DELETE_WINDOW", root.destroy)
    root.mainloop()
    return result["saved"]


def main() -> int:
    parser = argparse.ArgumentParser(description="Configura la clave local de OpenAI para Rukan.")
    parser.add_argument("--forzar", action="store_true", help="Muestra el asistente aunque ya exista una clave.")
    args = parser.parse_args()

    try:
        habilitar_ocr_local()
        return 0 if abrir_asistente(forzar=args.forzar) else 1
    except Exception as error:  # pragma: no cover - fallback for Windows GUI errors
        print(f"No fue posible abrir el asistente de IA: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
