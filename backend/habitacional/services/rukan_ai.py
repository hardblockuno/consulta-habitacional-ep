import base64
import json
import mimetypes
import re
import shutil
import subprocess
from datetime import date, datetime
from io import BytesIO
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings


class RukanAIError(Exception):
    """Base error for Rukan AI extraction."""


class RukanAIConfigurationError(RukanAIError):
    """Raised when AI extraction is not configured."""


class RukanAIQuotaError(RukanAIError):
    """Raised when the configured OpenAI account has no available API quota."""


class RukanAILocalError(RukanAIConfigurationError):
    """Raised when a local Rukan extraction service is unavailable."""


RUKAN_AI_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["archivo", "confianza", "socio", "grupo_familiar", "observaciones"],
    "properties": {
        "archivo": {"type": "string"},
        "confianza": {"type": "number"},
        "socio": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "nombre",
                "rut",
                "sexo",
                "fecha_nacimiento",
                "edad",
                "estado_civil",
                "discapacidad",
                "rsh",
                "comuna",
                "parentesco_postulante",
                "jefatura_hogar",
                "tipo_familia_detectado",
                "propiedades_detectadas",
                "subsidios_detectados",
                "minvu_conecta",
            ],
            "properties": {
                "nombre": {"type": "string"},
                "rut": {"type": "string"},
                "sexo": {"type": "string"},
                "fecha_nacimiento": {"type": "string"},
                "edad": {"type": "string"},
                "estado_civil": {"type": "string"},
                "discapacidad": {"type": "string"},
                "rsh": {"type": "string"},
                "comuna": {"type": "string"},
                "parentesco_postulante": {"type": "string"},
                "jefatura_hogar": {"type": "string"},
                "tipo_familia_detectado": {"type": "string"},
                "propiedades_detectadas": {"type": "string"},
                "subsidios_detectados": {"type": "string"},
                "minvu_conecta": {"type": "string"},
            },
        },
        "grupo_familiar": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "orden",
                    "nombre",
                    "rut",
                    "sexo",
                    "fecha_nacimiento",
                    "edad",
                    "estado_civil",
                    "parentesco",
                    "esta_postulando",
                ],
                "properties": {
                    "orden": {"type": "number"},
                    "nombre": {"type": "string"},
                    "rut": {"type": "string"},
                    "sexo": {"type": "string"},
                    "fecha_nacimiento": {"type": "string"},
                    "edad": {"type": "string"},
                    "estado_civil": {"type": "string"},
                    "parentesco": {"type": "string"},
                    "esta_postulando": {"type": "string"},
                },
            },
        },
        "observaciones": {"type": "array", "items": {"type": "string"}},
    },
}

# El modelo local se concentra en la nomina de oficina. Menos campos reduce el
# tiempo de generacion en equipos que procesan solo con CPU.
RUKAN_OLLAMA_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["archivo", "confianza", "socio", "grupo_familiar", "observaciones"],
    "properties": {
        "archivo": {"type": "string"},
        "confianza": {"type": "number"},
        "socio": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "nombre",
                "rut",
                "sexo",
                "fecha_nacimiento",
                "estado_civil",
                "rsh",
                "comuna",
                "jefatura_hogar",
                "tipo_familia_detectado",
            ],
            "properties": {
                "nombre": {"type": "string"},
                "rut": {"type": "string"},
                "sexo": {"type": "string"},
                "fecha_nacimiento": {"type": "string"},
                "estado_civil": {"type": "string"},
                "rsh": {"type": "string"},
                "comuna": {"type": "string"},
                "jefatura_hogar": {"type": "string"},
                "tipo_familia_detectado": {"type": "string"},
            },
        },
        "grupo_familiar": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["orden", "nombre", "rut", "fecha_nacimiento", "estado_civil", "parentesco"],
                "properties": {
                    "orden": {"type": "number"},
                    "nombre": {"type": "string"},
                    "rut": {"type": "string"},
                    "fecha_nacimiento": {"type": "string"},
                    "estado_civil": {"type": "string"},
                    "parentesco": {"type": "string"},
                },
            },
        },
        "observaciones": {"type": "array", "items": {"type": "string"}},
    },
}

RUKAN_OLLAMA_SOCIO_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["nombre", "rut", "sexo", "fecha_nacimiento", "estado_civil", "discapacidad", "observaciones"],
    "properties": {
        "nombre": {"type": "string"},
        "rut": {"type": "string"},
        "sexo": {"type": "string"},
        "fecha_nacimiento": {"type": "string"},
        "estado_civil": {"type": "string"},
        "discapacidad": {"type": "string"},
        "observaciones": {"type": "array", "items": {"type": "string"}},
    },
}

RUKAN_OLLAMA_HOGAR_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["rsh", "comuna", "grupo_familiar", "observaciones"],
    "properties": {
        "rsh": {"type": "string"},
        "comuna": {"type": "string"},
        "grupo_familiar": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["orden", "nombre", "rut", "sexo", "fecha_nacimiento", "parentesco"],
                "properties": {
                    "orden": {"type": "number"},
                    "nombre": {"type": "string"},
                    "rut": {"type": "string"},
                    "sexo": {"type": "string"},
                    "fecha_nacimiento": {"type": "string"},
                    "parentesco": {"type": "string"},
                },
            },
        },
        "observaciones": {"type": "array", "items": {"type": "string"}},
    },
}


def extraer_rukan_con_ia(uploaded_file, file_name=""):
    provider = get_rukan_ai_provider()
    if provider == "openai" and not getattr(settings, "OPENAI_API_KEY", ""):
        raise RukanAIConfigurationError(
            "Configura OPENAI_API_KEY en backend/.env para usar la extraccion Rukan con IA."
        )

    pdf_bytes = uploaded_file.read()
    max_bytes = getattr(settings, "RUKAN_AI_MAX_BYTES", 12 * 1024 * 1024)
    if len(pdf_bytes) > max_bytes:
        raise RukanAIError(
            f"El archivo supera el maximo permitido para IA ({max_bytes // (1024 * 1024)} MB)."
        )

    image_bytes, mime_type = extract_first_pdf_image(pdf_bytes)
    source_name = file_name or getattr(uploaded_file, "name", "")
    if provider == "tesseract":
        ai_payload = request_rukan_tesseract(
            image_bytes=image_bytes,
            file_name=source_name,
        )
    elif provider == "ollama":
        ai_payload = request_rukan_ollama(
            image_bytes=image_bytes,
            mime_type=mime_type,
            file_name=source_name,
        )
    else:
        ai_payload = request_rukan_ai(
            image_bytes=image_bytes,
            mime_type=mime_type,
            file_name=source_name,
        )
    return normalize_ai_extraction(
        ai_payload,
        file_name=source_name,
    )


def get_rukan_ai_provider():
    provider = clean_string(getattr(settings, "RUKAN_AI_PROVIDER", "tesseract")).lower()
    if provider not in {"tesseract", "ollama", "openai"}:
        raise RukanAIConfigurationError(
            "RUKAN_AI_PROVIDER debe ser 'tesseract', 'ollama' u 'openai'."
        )
    return provider


def rukan_ai_status():
    provider = get_rukan_ai_provider()
    if provider == "tesseract":
        return tesseract_status()
    if provider == "openai":
        available = bool(getattr(settings, "OPENAI_API_KEY", ""))
        return {
            "provider": "openai",
            "available": available,
            "model": getattr(settings, "OPENAI_MODEL", "gpt-5-mini"),
            "message": (
                "IA OpenAI lista para procesar Rukan."
                if available
                else "Falta configurar la clave de OpenAI."
            ),
        }

    model = getattr(settings, "RUKAN_OLLAMA_MODEL", "qwen2.5vl:3b")
    try:
        response = urlopen(ollama_request("/api/tags"), timeout=4)
        with response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, OSError):
        return {
            "provider": "ollama",
            "available": False,
            "model": model,
            "message": "Falta iniciar Ollama local. Abre Consulta Habitacional.bat para prepararlo.",
        }
    except json.JSONDecodeError:
        return {
            "provider": "ollama",
            "available": False,
            "model": model,
            "message": "Ollama local respondio con un formato no valido.",
        }

    installed = {
        clean_string(item.get("name") or item.get("model"))
        for item in payload.get("models", [])
        if isinstance(item, dict)
    }
    available = model in installed
    return {
        "provider": "ollama",
        "available": available,
        "model": model,
        "message": (
            f"IA local lista ({model}). Los Rukan se procesan en este computador."
            if available
            else f"Falta descargar el modelo local {model}. Abre Consulta Habitacional.bat para prepararlo."
        ),
    }


def tesseract_status():
    """Comprueba el OCR local sin enviar documentos fuera del computador."""
    command = tesseract_command()
    if not command:
        return {
            "provider": "tesseract",
            "available": False,
            "model": "Tesseract OCR",
            "message": (
                "Falta instalar Tesseract OCR. Abre Consulta Habitacional.bat: "
                "el instalador gratuito se preparara una sola vez."
            ),
        }

    try:
        result = subprocess.run(
            [command, "--version"],
            capture_output=True,
            check=False,
            timeout=8,
            text=True,
        )
    except OSError:
        result = None

    available = bool(result and result.returncode == 0)
    return {
        "provider": "tesseract",
        "available": available,
        "model": "Tesseract OCR",
        "message": (
            "OCR local listo. Los Rukan se procesan en este computador."
            if available
            else "No se pudo iniciar Tesseract OCR. Reinstalalo y vuelve a abrir Consulta Habitacional.bat."
        ),
    }


def tesseract_command():
    configured = clean_string(getattr(settings, "RUKAN_TESSERACT_CMD", ""))
    candidates = [configured, shutil.which("tesseract")]
    candidates.extend(
        [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        ]
    )
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return str(candidate)
    return ""


def get_tesseract_client():
    command = tesseract_command()
    if not command:
        raise RukanAILocalError(
            "Falta instalar Tesseract OCR para leer Rukan localmente. "
            "Cierra la pagina y abre Consulta Habitacional.bat."
        )
    try:
        import pytesseract
    except ImportError as exc:
        raise RukanAILocalError(
            "Falta preparar el modulo OCR de la plataforma. Abre Consulta Habitacional.bat nuevamente."
        ) from exc

    pytesseract.pytesseract.tesseract_cmd = command
    return pytesseract


def request_rukan_tesseract(image_bytes, file_name):
    """Lee las tablas repetibles del Rukan usando OCR local por zonas."""
    pytesseract = get_tesseract_client()
    socio_image, rsh_image, hogar_image = crop_rukan_ocr_regions(
        image_bytes,
        max_side=getattr(settings, "RUKAN_OCR_IMAGE_MAX_SIDE", 3000),
    )
    socio_words, socio_width, socio_height, socio_confidence = rukan_ocr_words(socio_image, pytesseract)
    rsh_words, rsh_width, _, rsh_confidence = rukan_ocr_words(rsh_image, pytesseract)
    hogar_words, hogar_width, hogar_height, hogar_confidence = rukan_ocr_words(hogar_image, pytesseract)

    socio = parse_socio_ocr_words(socio_words, socio_width)
    socio = refine_socio_ocr_cells(
        socio,
        socio_image,
        pytesseract,
        socio_words,
        socio_width,
        socio_height,
    )
    rsh_data = parse_rsh_ocr_words(rsh_words, rsh_width)
    family = parse_hogar_ocr_words(hogar_words, hogar_width)
    family = refine_hogar_ocr_cells(
        family,
        hogar_image,
        pytesseract,
        hogar_words,
        hogar_width,
        hogar_height,
    )
    confidence_values = [
        value
        for value in (socio_confidence, rsh_confidence, hogar_confidence)
        if value is not None
    ]
    confidence = round(sum(confidence_values) / len(confidence_values)) if confidence_values else 0
    observations = ["Lectura OCR local por zonas. Confirmar visualmente los datos antes de exportar."]
    if not socio.get("rut"):
        observations.append("No se identifico con certeza el RUT de la persona consultada.")
    if not socio.get("nombre"):
        observations.append("No se identifico con certeza el nombre de la persona consultada.")
    if not family:
        observations.append("No se identificaron integrantes del hogar.")

    return {
        "archivo": file_name,
        "confianza": confidence,
        "socio": {
            **socio,
            "rsh": rsh_data["rsh"],
            "comuna": rsh_data["comuna"],
            "parentesco_postulante": "",
            "jefatura_hogar": "",
            "tipo_familia_detectado": "",
            "propiedades_detectadas": "",
            "subsidios_detectados": "",
            "minvu_conecta": "",
        },
        "grupo_familiar": family,
        "observaciones": observations,
    }


def crop_rukan_ocr_regions(image_bytes, max_side=3000):
    """Recorta solo las tablas estables presentes en los Rukan escaneados."""
    try:
        from PIL import Image, ImageOps
    except ImportError as exc:
        raise RukanAIConfigurationError("Falta instalar Pillow para preparar el Rukan.") from exc

    try:
        with Image.open(BytesIO(image_bytes)) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            width, height = image.size
            return (
                encode_rukan_ocr_region(
                    image.crop((int(width * 0.10), int(height * 0.20), int(width * 0.92), int(height * 0.35))),
                    max_side,
                ),
                encode_rukan_ocr_region(
                    image.crop((int(width * 0.10), int(height * 0.43), int(width * 0.92), int(height * 0.55))),
                    max_side,
                ),
                encode_rukan_ocr_region(
                    image.crop((int(width * 0.10), int(height * 0.55), int(width * 0.92), int(height * 0.72))),
                    max_side,
                ),
            )
    except Exception as exc:
        raise RukanAIError("No se pudieron identificar las zonas principales del Rukan.") from exc


def encode_rukan_ocr_region(image, max_side):
    from PIL import Image, ImageOps

    image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    image = ImageOps.autocontrast(ImageOps.grayscale(image), cutoff=1)
    output = BytesIO()
    image.save(output, format="JPEG", quality=95, optimize=True)
    return output.getvalue()


def rukan_ocr_words(image_bytes, pytesseract):
    """Entrega palabras y coordenadas para mantener cada celda en su columna."""
    try:
        from PIL import Image
        from pytesseract import Output
    except ImportError as exc:
        raise RukanAILocalError("No se pudo cargar el motor OCR local.") from exc

    language = clean_string(getattr(settings, "RUKAN_TESSERACT_LANG", "eng")) or "eng"
    try:
        with Image.open(BytesIO(image_bytes)) as image:
            width, height = image.size
            data = pytesseract.image_to_data(
                image,
                lang=language,
                config="--oem 3 --psm 6 -c preserve_interword_spaces=1",
                output_type=Output.DICT,
            )
    except Exception as exc:
        raise RukanAIError(
            "No se pudo leer el Rukan con OCR local. Revisa que Tesseract este instalado correctamente."
        ) from exc

    words = []
    confidences = []
    for index, value in enumerate(data.get("text", [])):
        text = clean_string(value)
        if not text:
            continue
        try:
            confidence = float(data.get("conf", [])[index])
        except (IndexError, TypeError, ValueError):
            confidence = -1
        if confidence >= 0:
            confidences.append(confidence)
        words.append(
            {
                "text": text,
                "left": int(data["left"][index]),
                "top": int(data["top"][index]),
                "width": int(data["width"][index]),
                "height": int(data["height"][index]),
            }
        )
    confidence = round(sum(confidences) / len(confidences)) if confidences else None
    return words, width, height, confidence


def parse_socio_ocr_words(words, image_width):
    anchor = first_ocr_rut_anchor(words)
    row_words = words_for_ocr_anchor(words, anchor, ocr_rut_anchors(words)) if anchor else []
    rut = anchor["rut"] if anchor else ""
    return {
        "nombre": ocr_column_text(row_words, image_width, 0.10, 0.36),
        "rut": rut,
        "sexo": ocr_column_text(row_words, image_width, 0.36, 0.46),
        "fecha_nacimiento": ocr_date_from_words(ocr_column_words(row_words, image_width, 0.67, 0.82)),
        "edad": "",
        "estado_civil": ocr_column_text(row_words, image_width, 0.46, 0.57),
        "discapacidad": normalize_ocr_boolean(
            clean_ocr_cell_text(ocr_column_text(row_words, image_width, 0.88, 0.99))
        ),
    }


def parse_rsh_ocr_words(words, image_width):
    for row in ocr_rows(words):
        text = " ".join(word["text"] for word in row)
        if not re.search(r"\d{1,3}\s*%", text):
            continue
        rsh_match = re.search(r"\d{1,3}\s*%", text)
        return {
            "rsh": rsh_match.group(0).replace(" ", "") if rsh_match else "",
            "comuna": ocr_column_text(row, image_width, 0.82, 1.01),
        }
    return {"rsh": "", "comuna": ""}


def parse_hogar_ocr_words(words, image_width):
    anchors = ocr_rut_anchors(words)
    members = []
    for index, anchor in enumerate(anchors, start=1):
        row_words = words_for_ocr_anchor(words, anchor, anchors)
        name = ocr_column_text(row_words, image_width, 0.15, 0.34)
        if not name:
            continue
        members.append(
            {
                "orden": index,
                "nombre": name,
                "rut": anchor["rut"],
                "sexo": clean_ocr_cell_text(ocr_column_text(row_words, image_width, 0.34, 0.43)),
                "fecha_nacimiento": ocr_date_from_words(
                    ocr_column_words(row_words, image_width, 0.55, 0.66)
                ),
                "edad": "",
                "estado_civil": "",
                "parentesco": clean_ocr_cell_text(ocr_column_text(row_words, image_width, 0.43, 0.528)),
                "esta_postulando": clean_ocr_cell_text(ocr_column_text(row_words, image_width, 0.70, 0.80)),
            }
        )
    return members


def refine_socio_ocr_cells(socio, image_bytes, pytesseract, words, image_width, image_height):
    anchor = first_ocr_rut_anchor(words)
    if not anchor:
        return socio
    lower, upper = ocr_anchor_bounds(anchor, ocr_rut_anchors(words), image_height)
    rut = ocr_rut_from_text(
        rukan_ocr_cell_text(image_bytes, pytesseract, 0.03, 0.13, lower, upper, image_height)
    )
    name = rukan_ocr_cell_text(image_bytes, pytesseract, 0.13, 0.36, lower, upper, image_height)
    birth_date = ocr_date_from_text(
        rukan_ocr_cell_text(image_bytes, pytesseract, 0.67, 0.77, lower, upper, image_height)
    )
    return {
        **socio,
        "rut": rut or socio.get("rut", ""),
        "nombre": clean_ocr_cell_text(name) or socio.get("nombre", ""),
        "fecha_nacimiento": birth_date or socio.get("fecha_nacimiento", ""),
        "sexo": clean_ocr_cell_text(socio.get("sexo")),
        "estado_civil": clean_ocr_cell_text(socio.get("estado_civil")),
        "discapacidad": clean_ocr_cell_text(socio.get("discapacidad")),
    }


def refine_hogar_ocr_cells(members, image_bytes, pytesseract, words, image_width, image_height):
    anchors = ocr_rut_anchors(words)
    if not anchors:
        return members
    refined = []
    for member, anchor in zip(members, anchors):
        lower, upper = ocr_anchor_bounds(anchor, anchors, image_height)
        rut = ocr_rut_from_text(
            rukan_ocr_cell_text(image_bytes, pytesseract, 0.04, 0.16, lower, upper, image_height)
        )
        name = rukan_ocr_cell_text(
            image_bytes,
            pytesseract,
            0.17,
            0.34,
            max(0, anchor["y"] - 70),
            min(image_height, anchor["y"] + 65),
            image_height,
            psm=6,
        )
        refined.append(
            {
                **member,
                "rut": rut or member.get("rut", ""),
                "nombre": clean_ocr_cell_text(name) or member.get("nombre", ""),
            }
        )
    return refined


def rukan_ocr_cell_text(image_bytes, pytesseract, start_x, end_x, lower, upper, image_height, psm=7):
    """Lee una celda sin las lineas de la tabla que degradan la segmentacion."""
    try:
        from PIL import Image

        with Image.open(BytesIO(image_bytes)) as image:
            width = image.width
            padding = 5
            box = (
                max(0, int(width * start_x) + padding),
                max(0, int(lower) + padding),
                min(width, int(width * end_x) - padding),
                min(image_height, int(upper) - padding),
            )
            if box[2] <= box[0] or box[3] <= box[1]:
                return ""
            return clean_string(
                pytesseract.image_to_string(
                    image.crop(box),
                    lang=clean_string(getattr(settings, "RUKAN_TESSERACT_LANG", "eng")) or "eng",
                    config=f"--oem 3 --psm {psm}",
                )
            )
    except Exception:
        return ""


def ocr_rut_anchors(words):
    anchors = []
    for row in ocr_rows(words):
        rut = ocr_rut_from_text(" ".join(word["text"] for word in row))
        if not rut:
            continue
        y_values = [word["top"] + word["height"] / 2 for word in row]
        anchors.append({"rut": rut, "y": sum(y_values) / len(y_values)})
    return anchors


def first_ocr_rut_anchor(words):
    anchors = ocr_rut_anchors(words)
    return anchors[0] if anchors else None


def ocr_rows(words):
    """Agrupa palabras por linea, tolerando pequeñas variaciones del escaneo."""
    rows = []
    for word in sorted(words, key=lambda item: item["top"] + item["height"] / 2):
        center = word["top"] + word["height"] / 2
        if rows and abs(center - rows[-1]["center"]) <= max(12, word["height"] * 0.9):
            rows[-1]["words"].append(word)
            count = len(rows[-1]["words"])
            rows[-1]["center"] = (rows[-1]["center"] * (count - 1) + center) / count
        else:
            rows.append({"center": center, "words": [word]})
    return [sorted(row["words"], key=lambda item: item["left"]) for row in rows]


def words_for_ocr_anchor(words, anchor, anchors):
    if not anchor:
        return []
    lower, upper = ocr_anchor_bounds(anchor, anchors, None)
    return [
        word
        for word in words
        if lower <= word["top"] + word["height"] / 2 <= upper
    ]


def ocr_anchor_bounds(anchor, anchors, image_height):
    positions = sorted(item["y"] for item in anchors)
    anchor_index = positions.index(anchor["y"])
    previous = positions[anchor_index - 1] if anchor_index else None
    following = positions[anchor_index + 1] if anchor_index + 1 < len(positions) else None
    lower = (previous + anchor["y"]) / 2 if previous is not None else anchor["y"] - 42
    upper = (anchor["y"] + following) / 2 if following is not None else anchor["y"] + 42
    if image_height:
        return max(0, lower), min(image_height, upper)
    return lower, upper


def ocr_column_words(words, image_width, start, end):
    if not image_width:
        return []
    return [
        word
        for word in words
        if start <= (word["left"] + word["width"] / 2) / image_width < end
    ]


def ocr_column_text(words, image_width, start, end):
    return clean_string(" ".join(word["text"] for word in ocr_column_words(words, image_width, start, end)))


def ocr_rut_from_text(text):
    for match in re.finditer(r"(?<!\d)[\d.,\s-]{7,16}[\dkK](?!\w)", text):
        raw = re.sub(r"[^0-9kK]", "", match.group(0))
        for offset in (0, 1):
            candidate = raw[offset:]
            if len(candidate) not in {8, 9}:
                continue
            rut = normalize_rut(candidate)
            if is_valid_rut(rut):
                return rut
    return ""


def ocr_date_from_words(words):
    return ocr_date_from_text(" ".join(word["text"] for word in words))


def ocr_date_from_text(text):
    match = re.search(r"\d{1,2}\s*[-/.]\s*\d{1,2}\s*[-/.]\s*(?:19|20)\d{2}", text)
    return normalize_date(match.group(0).replace(" ", "") if match else text)


def clean_ocr_cell_text(value):
    text = re.sub(r"[|¦]", " ", clean_string(value))
    return re.sub(r"^[^0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+|[^0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ)%(]+$", "", text).strip()


def normalize_ocr_boolean(value):
    text = clean_ocr_cell_text(value)
    if re.search(r"\bNO\b", text, flags=re.IGNORECASE):
        return "NO"
    if re.search(r"\bS[IÍ]\b", text, flags=re.IGNORECASE):
        return "SI"
    return text


def is_valid_rut(value):
    body, separator, verifier = clean_string(value).partition("-")
    if not separator or not body.isdigit() or len(body) not in {7, 8}:
        return False
    factors = (2, 3, 4, 5, 6, 7)
    total = sum(int(digit) * factors[index % len(factors)] for index, digit in enumerate(reversed(body)))
    expected = 11 - (total % 11)
    expected_verifier = "0" if expected == 11 else "K" if expected == 10 else str(expected)
    return verifier.upper() == expected_verifier


def extract_first_pdf_image(pdf_bytes):
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RukanAIConfigurationError(
            "Falta instalar pypdf. Ejecuta pip install -r backend/requirements.txt."
        ) from exc

    try:
        reader = PdfReader(BytesIO(pdf_bytes))
    except Exception as exc:
        raise RukanAIError("No se pudo leer el PDF Rukan.") from exc

    candidates = []
    for page in reader.pages:
        try:
            images = list(page.images)
        except ImportError as exc:
            raise RukanAIConfigurationError(
                "Falta instalar Pillow para extraer imagenes de PDF. Ejecuta pip install -r backend/requirements.txt."
            ) from exc
        except Exception:
            images = []
        for image in images:
            data = getattr(image, "data", b"") or b""
            if data:
                candidates.append((len(data), getattr(image, "name", ""), data))

    if not candidates:
        raise RukanAIError(
            "No se pudo extraer la imagen escaneada del PDF. Revisa que el Rukan sea una pagina escaneada legible."
        )

    _, image_name, data = max(candidates, key=lambda item: item[0])
    mime_type = mimetypes.guess_type(image_name or "rukan.jpg")[0] or "image/jpeg"
    return data, mime_type


def optimize_rukan_image(image_bytes, max_side=1800):
    """Reduce escaneos muy grandes para que el modelo local conserve contexto."""
    try:
        from PIL import Image, ImageOps
    except ImportError as exc:
        raise RukanAIConfigurationError(
            "Falta instalar Pillow para preparar la imagen del Rukan."
        ) from exc

    try:
        with Image.open(BytesIO(image_bytes)) as image:
            image = ImageOps.exif_transpose(image)
            if max(image.size) <= max_side:
                return image_bytes, "image/jpeg"
            image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
            if image.mode not in {"RGB", "L"}:
                image = image.convert("RGB")
            output = BytesIO()
            image.save(output, format="JPEG", quality=92, optimize=True)
            return output.getvalue(), "image/jpeg"
    except Exception as exc:
        raise RukanAIError("No se pudo preparar la imagen escaneada del Rukan.") from exc


def rukan_extraction_prompt():
    return (
        "Extrae informacion desde este formato Rukan chileno escaneado. "
        "Devuelve solo los datos visibles y no inventes informacion. "
        "La persona socia/postulante SIEMPRE es la persona de 'Rut consultado' o 'RUT Consultado' "
        "en el encabezado/Registro Civil. No confundas esa persona con hijos, conyuge u otros integrantes. "
        "El grupo familiar debe salir de la tabla 'Integrantes del Hogar' del Registro Social de Hogares; "
        "mantiene cada integrante asociado a este Rukan consultado. "
        "Normaliza RUT como 12345678-9 sin puntos. Fechas en formato YYYY-MM-DD cuando sean legibles. "
        "Si un dato no es visible, usa string vacio. Para confianza usa 0 a 100. "
        "En observaciones, explica campos dudosos o ilegibles y si corresponde revisar manualmente."
    )


def rukan_ollama_prompt():
    return (
        "Extrae la nomina de oficina desde este Rukan chileno escaneado. "
        "Prioriza exactitud de nombre, RUT, fecha de nacimiento, estado civil y parentesco. "
        "La persona socia/postulante es la persona de 'Rut consultado' en el encabezado/Registro Civil. "
        "El grupo familiar sale de la tabla 'Integrantes del Hogar' del Registro Social de Hogares. "
        "No inventes datos: usa string vacio cuando no sea legible. Normaliza RUT como 12345678-9 "
        "y fechas como YYYY-MM-DD. Devuelve solo JSON segun el formato indicado."
    )


def rukan_ollama_socio_prompt():
    return (
        "Esta imagen contiene la seccion Registro Civil de un Rukan chileno. "
        "Extrae solamente la fila de la persona de 'Rut consultado'. "
        "Lee RUT, nombre completo, sexo, fecha de nacimiento, estado civil y discapacidad. "
        "No inventes datos; usa string vacio si no es legible. RUT sin puntos y fecha YYYY-MM-DD."
    )


def rukan_ollama_hogar_prompt():
    return (
        "Esta imagen contiene Registro Social de Hogares de un Rukan chileno. "
        "Extrae el tramo RSH, comuna y cada fila de la tabla 'Integrantes del Hogar'. "
        "Para cada integrante lee orden, RUT, nombre completo, sexo, parentesco y fecha de nacimiento. "
        "No inventes datos; usa string vacio si no es legible. RUT sin puntos y fecha YYYY-MM-DD."
    )


def request_rukan_ollama(image_bytes, mime_type, file_name):
    socio_image, hogar_image = crop_rukan_regions(
        image_bytes,
        max_side=getattr(settings, "RUKAN_OLLAMA_IMAGE_MAX_SIDE", 1800),
    )
    socio = request_rukan_ollama_json(
        socio_image,
        file_name,
        rukan_ollama_socio_prompt(),
        RUKAN_OLLAMA_SOCIO_SCHEMA,
        max_output_tokens=300,
    )
    hogar = request_rukan_ollama_json(
        hogar_image,
        file_name,
        rukan_ollama_hogar_prompt(),
        RUKAN_OLLAMA_HOGAR_SCHEMA,
        max_output_tokens=getattr(settings, "RUKAN_OLLAMA_MAX_OUTPUT_TOKENS", 700),
    )
    observations = [
        *[clean_string(item) for item in socio.get("observaciones", []) if clean_string(item)],
        *[clean_string(item) for item in hogar.get("observaciones", []) if clean_string(item)],
    ]
    return {
        "archivo": file_name,
        "confianza": 80,
        "socio": {
            **socio,
            "rsh": hogar.get("rsh", ""),
            "comuna": hogar.get("comuna", ""),
            "parentesco_postulante": "",
            "jefatura_hogar": "",
            "tipo_familia_detectado": "",
            "propiedades_detectadas": "",
            "subsidios_detectados": "",
            "minvu_conecta": "",
        },
        "grupo_familiar": hogar.get("grupo_familiar", []),
        "observaciones": observations,
    }


def request_rukan_ollama_json(image_bytes, file_name, prompt, schema, max_output_tokens):
    body = {
        "model": getattr(settings, "RUKAN_OLLAMA_MODEL", "qwen2.5vl:3b"),
        "prompt": f"Archivo: {file_name}\n\n{prompt}",
        "images": [base64.b64encode(image_bytes).decode("ascii")],
        "stream": False,
        "format": schema,
        "options": {
            "temperature": 0,
            "num_ctx": getattr(settings, "RUKAN_OLLAMA_CONTEXT_WINDOW", 8192),
            "num_predict": max_output_tokens,
        },
    }
    request = ollama_request("/api/generate", data=json.dumps(body).encode("utf-8"), method="POST")
    try:
        with urlopen(request, timeout=getattr(settings, "RUKAN_OLLAMA_TIMEOUT_SECONDS", 180)) as response:
            response_body = response.read().decode("utf-8")
    except HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        if exc.code == 404:
            raise RukanAILocalError(
                "No se encontro el modelo local de Ollama. Abre Consulta Habitacional.bat para descargarlo."
            ) from exc
        raise RukanAIError(f"Ollama local respondio con error {exc.code}: {error_body[:300]}") from exc
    except URLError as exc:
        raise RukanAILocalError(
            "Ollama local no esta disponible. Abre Consulta Habitacional.bat y completa su preparacion."
        ) from exc
    except TimeoutError as exc:
        raise RukanAIError("La IA local excedio el tiempo de espera. Prueba con menos Rukan a la vez.") from exc

    try:
        response_data = json.loads(response_body)
        output_text = clean_string(response_data.get("response"))
    except json.JSONDecodeError as exc:
        raise RukanAIError("Ollama local devolvio una respuesta no valida.") from exc
    if not output_text:
        raise RukanAIError("La IA local no devolvio datos estructurados para este Rukan.")
    try:
        return json.loads(output_text)
    except json.JSONDecodeError as exc:
        raise RukanAIError("La IA local devolvio texto, pero no corresponde al formato esperado.") from exc


def crop_rukan_regions(image_bytes, max_side=1800):
    """Recorta Registro Civil y RSH para preservar texto legible en modelos locales."""
    try:
        from PIL import Image, ImageOps
    except ImportError as exc:
        raise RukanAIConfigurationError("Falta instalar Pillow para preparar el Rukan.") from exc

    try:
        with Image.open(BytesIO(image_bytes)) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            width, height = image.size
            # El formato Rukan concentra las filas relevantes en estas dos franjas.
            # Recortarlas evita que un modelo local deba interpretar toda la pagina.
            socio = image.crop((int(width * 0.10), int(height * 0.20), int(width * 0.92), int(height * 0.35)))
            hogar = image.crop((int(width * 0.10), int(height * 0.55), int(width * 0.92), int(height * 0.72)))
            return (
                encode_rukan_region(socio, max_side),
                encode_rukan_region(hogar, max_side),
            )
    except Exception as exc:
        raise RukanAIError("No se pudieron identificar las zonas principales del Rukan.") from exc


def encode_rukan_region(image, max_side):
    from PIL import Image

    image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    output = BytesIO()
    image.save(output, format="JPEG", quality=92, optimize=True)
    return output.getvalue()


def ollama_request(path, data=None, method="GET"):
    base_url = clean_string(getattr(settings, "RUKAN_OLLAMA_URL", "http://127.0.0.1:11434")).rstrip("/")
    return Request(
        f"{base_url}{path}",
        data=data,
        headers={"Content-Type": "application/json"} if data is not None else {},
        method=method,
    )


def request_rukan_ai(image_bytes, mime_type, file_name):
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    if not api_key:
        raise RukanAIConfigurationError(
            "Configura OPENAI_API_KEY en backend/.env para usar la extraccion Rukan con IA."
        )

    prompt = rukan_extraction_prompt()
    encoded = base64.b64encode(image_bytes).decode("ascii")
    body = {
        "model": getattr(settings, "OPENAI_MODEL", "gpt-5-mini"),
        "input": [
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": f"Archivo: {file_name}\n\n{prompt}"},
                    {"type": "input_image", "image_url": f"data:{mime_type};base64,{encoded}"},
                ],
            }
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "rukan_extraction",
                "schema": RUKAN_AI_SCHEMA,
                "strict": True,
            }
        },
    }
    request = Request(
        getattr(settings, "OPENAI_RESPONSES_URL", "https://api.openai.com/v1/responses"),
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {getattr(settings, 'OPENAI_API_KEY', '')}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=getattr(settings, "OPENAI_TIMEOUT_SECONDS", 90)) as response:
            response_body = response.read().decode("utf-8")
    except HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        if exc.code == 429 and is_openai_quota_error(error_body):
            raise RukanAIQuotaError(
                "La cuenta de OpenAI no tiene cuota disponible para procesar Rukan. "
                "Revisa la facturacion o el saldo de la API en https://platform.openai.com/settings/organization/billing/overview "
                "y vuelve a intentar."
            ) from exc
        raise RukanAIError(f"OpenAI respondio con error {exc.code}: {summarize_openai_error(error_body)}") from exc
    except URLError as exc:
        raise RukanAIError(f"No se pudo conectar con OpenAI: {exc.reason}") from exc
    except TimeoutError as exc:
        raise RukanAIError("La extraccion con IA excedio el tiempo de espera.") from exc

    try:
        response_data = json.loads(response_body)
    except json.JSONDecodeError as exc:
        raise RukanAIError("OpenAI devolvio una respuesta no JSON.") from exc

    output_text = extract_response_text(response_data)
    if not output_text:
        raise RukanAIError("OpenAI no devolvio texto estructurado para este Rukan.")
    try:
        return json.loads(output_text)
    except json.JSONDecodeError as exc:
        raise RukanAIError("OpenAI devolvio texto, pero no corresponde al JSON esperado.") from exc


def extract_response_text(response_data):
    direct = response_data.get("output_text")
    if isinstance(direct, str) and direct.strip():
        return direct

    fragments = []
    for output in response_data.get("output", []) or []:
        for content in output.get("content", []) or []:
            if content.get("type") in {"output_text", "text"} and isinstance(content.get("text"), str):
                fragments.append(content["text"])
    return "\n".join(fragments).strip()


def summarize_openai_error(error_body):
    try:
        data = json.loads(error_body)
        message = data.get("error", {}).get("message")
        if message:
            return message
    except json.JSONDecodeError:
        pass
    return error_body[:400]


def is_openai_quota_error(error_body):
    try:
        error = json.loads(error_body).get("error", {})
        if error.get("code") == "insufficient_quota":
            return True
        message = clean_string(error.get("message")).lower()
    except json.JSONDecodeError:
        message = clean_string(error_body).lower()
    return "exceeded your current quota" in message or "insufficient quota" in message


def normalize_ai_extraction(payload, file_name=""):
    socio = payload.get("socio") or {}
    family = [
        normalize_ai_member(member, index + 1)
        for index, member in enumerate(payload.get("grupo_familiar") or [])
    ]
    family = [member for member in family if member.get("nombre") or member.get("rut")]
    rut = normalize_rut(socio.get("rut"))
    matching_member = next((member for member in family if rut and member.get("rut") == rut), {})
    observations = [
        clean_string(item)
        for item in payload.get("observaciones") or []
        if clean_string(item)
    ]
    fecha_nacimiento = normalize_date(
        matching_member.get("fechaNacimiento") or socio.get("fecha_nacimiento") or ""
    )
    edad = parse_int(matching_member.get("edad") or socio.get("edad")) or age_from_iso(fecha_nacimiento)
    confidence = parse_int(payload.get("confianza"))
    needs_review = (
        not rut
        or not clean_string(socio.get("nombre"))
        or not family
        or (confidence is not None and confidence < 75)
    )

    return {
        "archivo": file_name or clean_string(payload.get("archivo")),
        "rut": rut,
        "nombre": clean_person_name(socio.get("nombre") or matching_member.get("nombre")),
        "sexo": clean_string(matching_member.get("sexo") or socio.get("sexo")),
        "fechaNacimiento": fecha_nacimiento,
        "edad": edad,
        "estadoCivil": clean_string(socio.get("estado_civil") or matching_member.get("estadoCivil")),
        "discapacidad": clean_string(socio.get("discapacidad")),
        "rsh": parse_int(socio.get("rsh")),
        "comuna": clean_string(socio.get("comuna")),
        "integrantes": len(family) or None,
        "parentescoPostulante": clean_string(
            socio.get("parentesco_postulante") or matching_member.get("parentesco")
        ),
        "jefaturaHogar": clean_string(socio.get("jefatura_hogar")),
        "tipoFamilia": clean_string(socio.get("tipo_familia_detectado")),
        "propiedades": clean_string(socio.get("propiedades_detectadas")),
        "subsidios": clean_string(socio.get("subsidios_detectados")),
        "minvuConecta": clean_string(socio.get("minvu_conecta")),
        "observaciones": "; ".join(observations),
        "fechaActualizacion": date.today().isoformat(),
        "estadoRevision": "por_revisar" if needs_review else "detectado",
        "confianza": confidence,
        "fuente": "ia",
        "grupoFamiliar": family,
    }


def normalize_ai_member(member, order):
    birth_date = normalize_date(member.get("fecha_nacimiento"))
    return {
        "orden": parse_int(member.get("orden")) or order,
        "nombre": clean_person_name(member.get("nombre")),
        "rut": normalize_rut(member.get("rut")),
        "sexo": clean_string(member.get("sexo")),
        "fechaNacimiento": birth_date,
        "edad": parse_int(member.get("edad")) or age_from_iso(birth_date),
        "estadoCivil": clean_string(member.get("estado_civil")),
        "parentesco": clean_string(member.get("parentesco")),
        "estaPostulando": clean_string(member.get("esta_postulando")),
    }


def clean_string(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def clean_person_name(value):
    return clean_string(value).upper()


def parse_int(value):
    if value is None or value == "":
        return None
    match = re.search(r"\d+", str(value))
    return int(match.group(0)) if match else None


def normalize_rut(value):
    raw = re.sub(r"[^0-9kK]", "", clean_string(value))
    if len(raw) < 2:
        return ""
    body, verifier = raw[:-1], raw[-1].upper()
    if not body.isdigit():
        return ""
    return f"{int(body)}-{verifier}"


def normalize_date(value):
    text = clean_string(value)
    if not text:
        return ""
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%d.%m.%Y"):
        try:
            return datetime.strptime(text[:10], fmt).date().isoformat()
        except ValueError:
            continue
    match = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2})\b", text)
    if match:
        day, month, year = (int(part) for part in match.groups())
        year += 2000 if year <= 30 else 1900
        try:
            return date(year, month, day).isoformat()
        except ValueError:
            return ""
    return text if re.fullmatch(r"\d{4}-\d{2}-\d{2}", text) else ""


def age_from_iso(value):
    if not value:
        return None
    try:
        born = date.fromisoformat(value)
    except ValueError:
        return None
    today = date.today()
    years = today.year - born.year
    if (today.month, today.day) < (born.month, born.day):
        years -= 1
    return years
