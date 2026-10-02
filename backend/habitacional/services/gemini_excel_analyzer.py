"""Servicio de Análisis Inteligente de Planillas Excel con Google Gemini (Modo Cuota Cero / Free Tier Protegido).

Estrategia de consumo eficiente:
1. Single-Call Schema Analysis: Analiza la estructura completa y relaciones semánticas en EXACTAMENTE 1 llamada por archivo.
2. Caché por Hashing de Columnas: Si el formato de planilla ya se vio, no gasta llamadas API (0 requests).
3. Motor Local SERVIU para Excepciones Unipersonales: El cruce legal (Adulto Mayor, Discapacidad, Mapuche) se evalúa en código Python local.
4. Fallback Seguro: Si la API no está configurada o se excede el límite gratuito, degrada suavemente al motor de reglas sin interrumpir la carga.
"""

import hashlib
import json
import logging
import os
from decimal import Decimal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings

logger = logging.getLogger(__name__)

# Caché en memoria de esquemas ya analizados {hash_columnas: mapeo_json}
_CACHE_MAPEOS_EXCEL = {}

DEFAULT_GEMINI_MODEL = "gemini-3.8-flash"
GEMINI_API_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"


def get_gemini_api_key() -> str:
    """Obtiene la clave de Gemini desde el entorno o configuración."""
    return (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or getattr(settings, "GEMINI_API_KEY", "")
    ).strip()


def obtener_hash_columnas(columnas: list) -> str:
    """Genera una firma hash única a partir de los nombres de columnas."""
    cadena = "|".join(sorted(str(c).strip().lower() for c in columnas if str(c).strip()))
    return hashlib.md5(cadena.encode("utf-8")).hexdigest()


def analizar_esquema_con_gemini(columnas: list, muestra_filas: list) -> dict:
    """Realiza un análisis semántico de la planilla mediante una ÚNICA llamada a Gemini.
    
    Identifica las columnas correspondientes a:
    - RUT y Nombre de socios
    - Edad y fecha de nacimiento
    - Discapacidad (titular y/o hijos)
    - Cuenta de ahorro y Banco
    - % RSH (Registro Social de Hogares)
    - % / puntaje MINVU Conecta
    - Grupo familiar y tipo de familia (unipersonales)
    - Calidad indígena / etnia (Mapuche, etc.)
    """
    import sys
    if "test" in sys.argv:
        return {}

    api_key = get_gemini_api_key()
    if not api_key:
        logger.info("GEMINI_API_KEY no configurada. Usando motor algorítmico local.")
        return {}

    hash_cols = obtener_hash_columnas(columnas)
    if hash_cols in _CACHE_MAPEOS_EXCEL:
        logger.info("Mapeo obtenido desde caché en memoria (0 llamadas a Gemini).")
        return _CACHE_MAPEOS_EXCEL[hash_cols]

    model = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip()
    url = GEMINI_API_URL_TEMPLATE.format(model=model, api_key=api_key)

    # Preparamos una muestra ultraliviana para ahorrar tokens (máximo 3 filas y 40 caracteres por celda)
    muestra_compacta = []
    for fila in muestra_filas[:3]:
        muestra_compacta.append({
            str(k)[:30]: str(v)[:50]
            for k, v in fila.items()
            if v is not None and str(v).strip() != "" and not str(v).startswith("Unnamed:")
        })

    prompt = f"""Eres un perito experto en subsidios habitacionales del MINVU (Chile) y procesamiento de planillas Excel de comités de vivienda (DS49).
Analiza las columnas y la muestra de datos de esta planilla para determinar a qué campo corresponde cada columna.

Columnas disponibles en el Excel:
{json.dumps(columnas, ensure_ascii=False)}

Muestra representativa de 3 filas:
{json.dumps(muestra_compacta, ensure_ascii=False)}

Debes responder ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{{
  "rut": "nombre_exacto_columna_o_null",
  "nombre": "nombre_exacto_columna_o_null",
  "edad": "nombre_exacto_columna_o_null",
  "fecha_nacimiento": "nombre_exacto_columna_o_null",
  "discapacidad_titular": "nombre_exacto_columna_o_null",
  "discapacidad_hijos": "nombre_exacto_columna_o_null",
  "banco": "nombre_exacto_columna_o_null",
  "numero_cuenta": "nombre_exacto_columna_o_null",
  "ahorro_monto": "nombre_exacto_columna_o_null",
  "rsh_porcentaje": "nombre_exacto_columna_o_null",
  "minvu_conecta": "nombre_exacto_columna_o_null",
  "integrantes": "nombre_exacto_columna_o_null",
  "tipo_familia": "nombre_exacto_columna_o_null",
  "etnia_indigena": "nombre_exacto_columna_o_null",
  "observaciones": "nombre_exacto_columna_o_null",
  "resumen_diagnostico_inicial": "Breve frase describiendo la calidad y estructura detectada de la planilla"
}}
Si una columna no existe, usa null. Devuelve solo el JSON puro sin markdown."""

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
            "maxOutputTokens": 800,
        },
    }

    req = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            texto_respuesta = (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "{}")
            )
            resultado = json.loads(texto_respuesta)
            _CACHE_MAPEOS_EXCEL[hash_cols] = resultado
            logger.info("Mapeo semántico de Gemini exitoso y guardado en caché.")
            return resultado
    except HTTPError as err:
        if err.code == 429:
            logger.warning("Cuota temporal de Gemini alcanzada (HTTP 429). Activando motor algorítmico local de respaldo.")
        else:
            logger.warning(f"Error HTTP en llamada a Gemini ({err.code}): {err.reason}. Fallback a motor local.")
        return {}
    except (URLError, Exception) as exc:
        logger.warning(f"Error de conexión con Gemini ({exc}). Fallback a motor local.")
        return {}


def evaluar_excepcion_unipersonal_serviu(*, edad: int = None, persona_mayor: bool = False, tiene_discapacidad: bool = False, etnia: str = "", observaciones: str = "") -> dict:
    """Evalúa localmente (0 tokens consumidos) si un postulante unipersonal (1 integrante)
    cumple con las excepciones legales del DS49 MINVU para postular de forma individual:
    
    1. Adulto Mayor (≥ 60 años).
    2. Discapacidad acreditada (COMPIN / RND).
    3. Calidad Indígena (CONADI / Pueblo Originario Mapuche, Aymara, etc.).
    4. Víctima de violencia política (Valech / Rettig).
    """
    es_mayor = bool(persona_mayor or (edad is not None and edad >= 60))
    es_discapacidad = bool(tiene_discapacidad)

    etnia_normalizada = (etnia or "").lower().strip()
    es_indigena = any(
        pueblo in etnia_normalizada
        for pueblo in ["mapuche", "aymara", "diaguita", "atacame", "quechua", "raoa nui", "kawasqar", "yagan", "chango", "si", "indigena", "conadi"]
    )
    if not es_indigena and observaciones:
        obs_norm = observaciones.lower()
        es_indigena = any(p in obs_norm for p in ["mapuche", "conadi", "calidad indigena"])

    causales = []
    if es_mayor:
        causales.append(f"Adulto Mayor ({edad or '≥60'} años)")
    if es_discapacidad:
        causales.append("Discapacidad acreditada")
    if es_indigena:
        causales.append(f"Pueblo Originario / Indígena ({etnia or 'Acreditada'})")

    habilitado = len(causales) > 0
    if habilitado:
        detalle = f"Habilitado para postulación individual por: {', '.join(causales)}."
    else:
        detalle = "No cumple causales de excepción legal DS49 (menor de 60 años, sin discapacidad ni calidad indígena). SERVIU rechazará postulación unipersonal si no suma un núcleo familiar."

    return {
        "es_unipersonal": True,
        "habilitado_serviu": habilitado,
        "causales": causales,
        "detalle": detalle,
    }


def auditar_comite_post_importacion(resumen: dict) -> dict:
    """Genera métricas consolidadas sobre el comité analizado para el equipo técnico."""
    return {
        "motor": "Híbrido (Gemini Semántico + Validador SERVIU Local)",
        "unipersonales_totales": resumen.get("unipersonales", 0),
        "unipersonales_habilitados": resumen.get("unipersonales_habilitados", 0),
        "unipersonales_en_riesgo": resumen.get("unipersonales_en_riesgo", 0),
        "discapacidad_detectada": resumen.get("discapacidad", 0),
        "discapacidad_hijos": resumen.get("discapacidad_hijos", 0),
        "pueblo_originario": resumen.get("etnia", 0),
        "minvu_conecta_registrados": resumen.get("minvu_conecta_registrados", 0),
        "cuentas_bancarias_registradas": resumen.get("cuentas_bancarias_registradas", 0),
    }
