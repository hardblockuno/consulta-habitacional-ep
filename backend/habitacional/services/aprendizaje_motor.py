"""Sistema de Aprendizaje Activo y Destilación de Reglas para el Motor Determinista.

Objetivo:
Convertir cada consulta a Gemini en una lección permanente para el motor local.
1. Evalúa si el motor local realmente necesita ayuda antes de llamar a la API.
2. Si todas las columnas clave se reconocen localmente -> Cero llamadas a Gemini (0 tokens, cuota 100% protegida).
3. Si Gemini descubre un alias nuevo o abreviatura no contemplada -> Se persiste en `learned_aliases.json`.
4. En las siguientes cargas, el motor determinista ya conoce el alias por sí mismo sin requerir IA.
"""

import json
import logging
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)

def _get_storage_path() -> Path:
    app_data = getattr(settings, "APP_DATA_DIR", settings.BASE_DIR)
    ruta = Path(app_data) / "datos_aprendizaje"
    ruta.mkdir(parents=True, exist_ok=True)
    return ruta / "learned_aliases.json"


def cargar_alias_aprendidos() -> dict:
    """Carga los alias aprendidos dinámicamente desde el almacenamiento persistente."""
    archivo = _get_storage_path()
    if not archivo.exists():
        return {}
    try:
        with open(archivo, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.warning(f"No se pudo leer archivo de alias aprendidos: {exc}")
        return {}


def registrar_nuevo_aprendizaje(campo: str, nuevo_alias: str, fuente: str = "gemini") -> bool:
    """Persiste un nuevo alias aprendido para que el motor local lo use para siempre."""
    if not campo or not nuevo_alias:
        return False

    alias_limpio = str(nuevo_alias).strip()
    if len(alias_limpio) < 2:
        return False

    archivo = _get_storage_path()
    datos = cargar_alias_aprendidos()

    if campo not in datos:
        datos[campo] = []

    # Normalizar para evitar duplicados
    from .excel_importer import normalizar_texto
    alias_norm = normalizar_texto(alias_limpio)
    existentes = [normalizar_texto(a) for a in datos[campo]]

    if alias_norm in existentes:
        return False

    datos[campo].append(alias_limpio)

    try:
        with open(archivo, "w", encoding="utf-8") as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
        logger.info(f"🎓 [APRENDIZAJE ACTIVO] El motor local aprendió nuevo alias: '{alias_limpio}' -> '{campo}' (Fuente: {fuente})")
        return True
    except Exception as exc:
        logger.error(f"Error al persistir nuevo alias aprendido: {exc}")
        return False


def evaluar_necesidad_de_ia(columnas: list, mapa_local: dict) -> tuple[bool, str]:
    """Evalúa con precisión quirúrgica si la planilla realmente requiere asistencia de Gemini
    o si el motor determinista local ya puede resolverla con 100% de autonomía.
    
    Regla de oro de ahorro:
    Si el motor local ya tiene RUT, Nombre y al menos 4 campos clave más (o si todas las columnas
    sustanciales están identificadas), NO se llama a Gemini (0 consumo de cuota).
    """
    from .excel_importer import normalizar_texto

    tiene_rut = bool(mapa_local.get("rut"))
    tiene_nombre = bool(mapa_local.get("nombre") or mapa_local.get("nombres"))

    if not tiene_rut or not tiene_nombre:
        return True, "Faltan columnas de identidad esenciales (RUT o Nombre no mapeados con certeza local)."

    # Columnas reconocidas por el motor local
    columnas_mapeadas = set(mapa_local.values())

    # Detectar columnas sin mapear que tengan contenido relevante
    columnas_sin_mapear = []
    for col in columnas:
        if col in columnas_mapeadas:
            continue
        norm = normalizar_texto(col)
        # Ignorar columnas accesorias evidentes
        if any(norm.startswith(pref) for pref in ["nro", "numero", "orden", "item", "id", "sinnombre", "fila", "indice"]):
            continue
        if len(norm) <= 2:
            continue
        columnas_sin_mapear.append(col)

    # Si no hay columnas sustanciales sin mapear, o el mapa local cubre todo lo necesario
    if len(columnas_sin_mapear) == 0:
        return False, "Autonomía local completa: 100% de columnas identificadas por el motor determinista."

    # Si hay columnas sustanciales sin mapear, se consulta a Gemini como tutor
    return True, f"Se detectaron {len(columnas_sin_mapear)} columnas no estandarizadas: {', '.join(columnas_sin_mapear[:3])}."


def destilar_y_guardar_lecciones_gemini(mapeo_gemini: dict, columnas: list, mapa_local_previo: dict) -> list:
    """Compara lo que detectó Gemini contra lo que sabía el motor local previamente.
    Cualquier alias nuevo que Gemini haya descubierto se guarda en la base de conocimiento permanente.
    """
    lecciones = []
    if not mapeo_gemini:
        return lecciones

    campos_mapeables = {
        "rut": "rut",
        "nombre": "nombre",
        "edad": "edad",
        "fecha_nacimiento": "fecha_nacimiento",
        "discapacidad_titular": "discapacidad",
        "discapacidad_hijos": "discapacidad",
        "banco": "banco",
        "numero_cuenta": "numero_cuenta",
        "ahorro_monto": "ahorro",
        "rsh_porcentaje": "rsh",
        "minvu_conecta": "minvu_conecta",
        "integrantes": "integrantes",
        "tipo_familia": "tipo_familia",
        "etnia_indigena": "etnia",
    }

    for clave_gemini, campo_local in campos_mapeables.items():
        col_gemini = mapeo_gemini.get(clave_gemini)
        if not col_gemini or col_gemini not in columnas:
            continue

        # Si el motor local no conocía esta columna para este campo
        if mapa_local_previo.get(campo_local) != col_gemini:
            guardado = registrar_nuevo_aprendizaje(campo_local, col_gemini, fuente="Gemini AI")
            if guardado:
                lecciones.append({
                    "columna": col_gemini,
                    "campo": campo_local,
                    "origen": "Gemini AI -> Motor Determinista",
                })

    return lecciones


def estadisticas_aprendizaje() -> dict:
    """Devuelve las métricas del conocimiento acumulado por el motor local."""
    alias_guardados = cargar_alias_aprendidos()
    total_alias_nuevos = sum(len(v) for v in alias_guardados.values())
    return {
        "total_campos_con_aprendizaje": len(alias_guardados),
        "total_alias_aprendidos_permanentes": total_alias_nuevos,
        "detalle_por_campo": {k: len(v) for k, v in alias_guardados.items()},
    }
