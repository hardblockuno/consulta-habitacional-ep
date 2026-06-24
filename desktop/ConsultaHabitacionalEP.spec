# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from pathlib import Path

from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs, collect_submodules


PROJECT_ROOT = Path(SPECPATH).resolve().parent
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ.setdefault("USE_SQLITE", "1")

datas = []
binaries = []
for package in ("django", "rest_framework", "corsheaders", "openpyxl", "pypdf", "pytesseract"):
    datas += collect_data_files(package)
for package in ("PIL", "pandas", "pytesseract"):
    binaries += collect_dynamic_libs(package)

hiddenimports = [
    "config",
    "config.settings",
    "config.urls",
    "config.wsgi",
    "django.db.backends.sqlite3",
    "django.db.backends.sqlite3.base",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders.apps",
    "corsheaders.middleware",
    "rest_framework",
    "rest_framework.mixins",
    "rest_framework.pagination",
    "rest_framework.parsers",
    "rest_framework.renderers",
    "rest_framework.response",
    "rest_framework.routers",
    "rest_framework.serializers",
    "rest_framework.views",
    "rest_framework.viewsets",
]
hiddenimports += collect_submodules("habitacional")
hiddenimports += collect_submodules("corsheaders")
hiddenimports += collect_submodules("rest_framework")

a = Analysis(
    [str(PROJECT_ROOT / "desktop" / "launcher.py")],
    pathex=[str(BACKEND_ROOT), str(PROJECT_ROOT)],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    noarchive=False,
)
pyz = PYZ(a.pure)
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="ConsultaHabitacionalEP",
    console=False,
    icon=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    name="ConsultaHabitacionalEP",
)
