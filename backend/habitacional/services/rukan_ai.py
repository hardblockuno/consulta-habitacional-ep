import base64
import json
import mimetypes
import re
from datetime import date, datetime
from io import BytesIO
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings


class RukanAIError(Exception):
    """Base error for Rukan AI extraction."""


class RukanAIConfigurationError(RukanAIError):
    """Raised when AI extraction is not configured."""


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


def extraer_rukan_con_ia(uploaded_file, file_name=""):
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    if not api_key:
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
    ai_payload = request_rukan_ai(
        image_bytes=image_bytes,
        mime_type=mime_type,
        file_name=file_name or getattr(uploaded_file, "name", ""),
    )
    return normalize_ai_extraction(
        ai_payload,
        file_name=file_name or getattr(uploaded_file, "name", ""),
    )


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


def request_rukan_ai(image_bytes, mime_type, file_name):
    prompt = (
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
