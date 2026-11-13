"""
Módulo para leer y normalizar la información de postulantes desde cualquier archivo Excel (.xlsx).
Incorpora la lógica e inteligencia de detección de planillas, hojas, encabezados y alias de columnas
del estándar habitacional chileno (D.S. N° 10 / RUKAN / MINVU / SERVIU).
Principio: Máxima resiliencia en la ingesta, fidelidad estricta a la fuente, sin inventar datos.
"""

import datetime
import math
import os
import re
import unicodedata
from typing import Any, Dict, List, Optional, Tuple

import openpyxl


def norm_str(s: Any) -> str:
    """Normaliza un texto quitando tildes, espacios y caracteres especiales."""
    if s is None:
        return ""
    text = str(s).strip()
    norm = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    return re.sub(r"[^a-zA-Z0-9]", "", norm).lower()


def calcular_dv(rut_num: Any) -> str:
    """Calcula el dígito verificador de un RUT chileno usando el algoritmo Módulo 11."""
    clean_num = "".join(filter(str.isdigit, str(rut_num or "")))
    if not clean_num:
        return ""
    suma = 0
    multiplicador = 2
    for d in reversed(clean_num):
        suma += int(d) * multiplicador
        multiplicador = 2 if multiplicador == 7 else multiplicador + 1
    resto = 11 - (suma % 11)
    if resto == 11:
        return "0"
    if resto == 10:
        return "K"
    return str(resto)


def format_rut(rut_val: Any, dv_val: Any = None) -> str:
    """Formatea un RUT al estándar oficial chileno XX.XXX.XXX-X, calculando DV si falta."""
    if not rut_val:
        return ""
    if isinstance(rut_val, float):
        rut_str = str(int(rut_val))
    else:
        rut_str = str(rut_val).strip()
        if rut_str.endswith(".0"):
            rut_str = rut_str[:-2]

    if not rut_str or rut_str.lower() in ["none", "nan", "s/i", "0", ""]:
        return ""

    clean_num = "".join(filter(str.isdigit, rut_str))
    if not clean_num:
        return ""

    dv = None
    # 1. Si viene DV separado en otra columna
    if dv_val is not None and str(dv_val).strip() and str(dv_val).strip().lower() not in ["none", "nan"]:
        if isinstance(dv_val, float):
            dv = str(int(dv_val))
        else:
            dv = str(dv_val).strip().upper()
            if dv.endswith(".0"):
                dv = dv[:-2]
    # 2. Si ya viene con guión en el mismo valor
    elif "-" in rut_str:
        num, dv_part = rut_str.rsplit("-", 1)
        clean_num = "".join(filter(str.isdigit, num))
        dv = dv_part.strip().upper()
        if dv.endswith(".0"):
            dv = dv[:-2]
    # 3. Si el número es largo (>= 8 dígitos) y no se proveyó DV, verificar si el último dígito podría ser DV
    elif 8 <= len(clean_num) <= 9:
        cand_num = clean_num[:-1]
        cand_dv = clean_num[-1]
        if calcular_dv(cand_num) == cand_dv:
            clean_num = cand_num
            dv = cand_dv
        else:
            dv = calcular_dv(clean_num)
    else:
        dv = calcular_dv(clean_num)

    if not dv:
        dv = calcular_dv(clean_num)

    if clean_num:
        rev = clean_num[::-1]
        parts = [rev[i:i + 3] for i in range(0, len(rev), 3)]
        formatted_num = ".".join(parts)[::-1]
        return f"{formatted_num}-{dv}"
    return str(rut_val).strip()


def format_date(dt_val: Any) -> str:
    """Formatea una fecha como DD/MM/AAAA de forma determinista."""
    if not dt_val:
        return ""
    if isinstance(dt_val, (datetime.datetime, datetime.date)):
        return dt_val.strftime("%d/%m/%Y")
    val_str = str(dt_val).strip()
    if val_str.lower() in ["none", "nan", "00:00:00", ""]:
        return ""
    # Si viene como YYYY-MM-DD
    if "-" in val_str and len(val_str) >= 10:
        parts = val_str[:10].split("-")
        if len(parts) == 3 and len(parts[0]) == 4:
            return f"{parts[2]}/{parts[1]}/{parts[0]}"
    # Si viene como DD/MM/YYYY
    if "/" in val_str:
        return val_str.split()[0]
    return val_str


def calculate_age_from_dob(dob_val: Any, ref_year: int = 2026) -> Optional[int]:
    """Calcula la edad a partir de la fecha de nacimiento si no viene precalculada."""
    if not dob_val:
        return None
    dt = None
    if isinstance(dob_val, (datetime.datetime, datetime.date)):
        dt = dob_val
    elif isinstance(dob_val, str):
        s = dob_val.strip()
        if "-" in s:
            parts = s.split()[0].split("-")
            if len(parts) == 3 and len(parts[0]) == 4:
                try:
                    dt = datetime.date(int(parts[0]), int(parts[1]), int(parts[2]))
                except Exception:
                    pass
        elif "/" in s:
            parts = s.split()[0].split("/")
            if len(parts) == 3 and len(parts[2]) == 4:
                try:
                    dt = datetime.date(int(parts[2]), int(parts[1]), int(parts[0]))
                except Exception:
                    pass
    if dt:
        return max(0, ref_year - dt.year)
    return None


COLUMN_ALIASES = {
    "orden": ["no", "n", "orden", "numero", "nro", "nroorden", "item"],
    "nombre": [
        "nombre", "nombrecompleto", "nombrepostulante", "nombrespostulante",
        "nombresocio", "nombresocia", "nombretitular", "nombrebeneficiario",
        "postulante", "socio", "titular", "beneficiario"
    ],
    "nombres": ["nombres", "primernombre", "segundonombre"],
    "apellido_paterno": ["apellidopaterno", "apaterno", "paterno", "primerapellido"],
    "apellido_materno": ["apellidomaterno", "amaterno", "materno", "segundoapellido"],
    "apellidos": ["apellidos", "apellido", "apellidospostulante", "apellidossocio"],
    "rut": [
        "rut", "run", "rutpostulante", "runpostulante", "rutsocio", "runsocio",
        "ruttitular", "runtitular", "cedulaidentidad", "ci", "nrodocumento",
        "documentoidentidad", "dni"
    ],
    "dv": ["dv", "digitoverificador", "digito", "dig", "dvpostulante", "dvtitular"],
    "fono": ["fono", "telefono", "celular", "movil", "contacto", "fonocontacto"],
    "direccion_rsh": [
        "direccionrsh", "domicilio", "direccion", "direccionpostulante",
        "domiciliorsh", "calle", "direccionactual"
    ],
    "rol_sii": ["rolsii", "rol", "rolpropiedad", "numerorol", "rolterreno"],
    "direccion_terreno": ["direccionterreno", "ubicacionterreno", "terreno", "sitio", "lote", "ubicacion"],
    "etnia": [
        "etnia", "pueblooriginario", "conadi", "indigena", "pueblosoriginarios",
        "mapuche", "pueblo", "certificadoconadi", "etniamapuche"
    ],
    "sexo": ["sexo", "genero"],
    "estado_civil": ["estadocivil", "ecivil", "estado"],
    "fec_nac": [
        "fechanacimiento", "fecnac", "fechanac", "nacimiento", "fnac",
        "fechadenacimiento", "fechanacpostulante"
    ],
    "edad": ["edad", "anios", "anos", "edadpostulante", "edadtitular"],
    "discapacidad": [
        "discapacidad", "conadiscapacidad", "disc", "credencialdiscapacidad",
        "discapacidadacreditada", "movilidadreducida"
    ],
    "comuna": ["comuna", "ciudad", "localidad"],
    "factor_aislamiento": ["factoraislamiento", "factor", "aislamiento"],
    "grupo_fam_cant": [
        "gfcant", "cantgrupofam", "integrantes", "grupofamiliar", "grupfam", "grupofam",
        "grupo_fam", "gf", "totalintegrantes", "habitantes", "cantintegrantes", "numerodeintegrantes"
    ],
    "tipo_vivienda": [
        "tipovivienda", "tipo_vivienda", "tipodevivienda", "vivienda", "tipologia",
        "tipologiapropuesta", "3d", "tercerdormitorio", "tipologiasiniva"
    ],
    "tipo_fam": [
        "tipofam", "tipofamilia", "tipodefamilia", "composicionfamiliar", "parentescojefe", "tipologiafam"
    ],
    "parentezco": [
        "parentezco", "parentesco", "relacion", "parentescojefe"
    ],
    "fundamento": ["fundamento", "observacion", "observaciones", "detalle", "justificacion"],
    "c_nombre": ["conyugenombre", "nombreconyuge", "nombrepareja", "parejanombre"],
    "c_rut": ["conyugerut", "rutconyuge", "rutpareja", "parejarut"],
    "c_fec_nac": ["conyugefecnac", "fecnacconyuge", "fechanacimientoconyuge"],
    "c_sexo": ["conyugesexo", "sexoconyuge"],
}


def puntuar_fila_encabezados(valores: List[Any]) -> int:
    """Calcula un puntaje de idoneidad para una fila como encabezado de postulantes."""
    norm_headers = [norm_str(v) for v in valores if v is not None]
    if len(norm_headers) < 2:
        return 0

    score = 0
    tiene_rut = any(alias in norm_headers for alias in COLUMN_ALIASES["rut"])
    tiene_nom = any(alias in norm_headers for alias in COLUMN_ALIASES["nombre"]) or (
        any(alias in norm_headers for alias in COLUMN_ALIASES["nombres"]) and
        any(alias in norm_headers for alias in COLUMN_ALIASES["apellidos"])
    )

    if tiene_rut:
        score += 6
    if tiene_nom:
        score += 6

    for campo in ["dv", "fec_nac", "edad", "etnia", "discapacidad", "fono", "direccion_rsh", "tipo_vivienda", "grupo_fam_cant"]:
        if any(alias in norm_headers for alias in COLUMN_ALIASES[campo]):
            score += 2

    return score


def evaluar_mejor_fila_hoja(sheet, max_rows: int = 25) -> Tuple[int, int]:
    """Evalúa las primeras filas de una hoja retornando (fila_optima, puntaje)."""
    mejor_row = 1
    mejor_score = 0
    max_r = min(max_rows, sheet.max_row or 1)
    max_c = min(120, sheet.max_column or 1)

    for r in range(1, max_r + 1):
        fila_vals = [sheet.cell(r, c).value for c in range(1, max_c + 1)]
        score = puntuar_fila_encabezados(fila_vals)
        if score > mejor_score:
            mejor_score = score
            mejor_row = r
    return mejor_row, mejor_score


def detectar_fila_encabezados_en_hoja(sheet) -> int:
    """Encuentra la mejor fila de encabezado en una hoja específica."""
    row_idx, score = evaluar_mejor_fila_hoja(sheet)
    return row_idx if score >= 8 else 1


def detectar_hoja_y_encabezados(
    wb: openpyxl.Workbook,
    preferred_sheet: Optional[str] = None
) -> Tuple[openpyxl.worksheet.worksheet.Worksheet, int]:
    """
    Detecta de forma inteligente y automática la hoja de postulantes y la fila de encabezados.
    Soporta planillas donde la hoja se llame 'base', 'postulantes', 'nomina', 'socios', 'datos',
    o cualquier otro nombre, y donde los encabezados estén en las filas 1 a 25.
    """
    # 1. Si se especificó una hoja preferida y existe (insensible a mayúsculas)
    if preferred_sheet:
        norm_pref = norm_str(preferred_sheet)
        for sname in wb.sheetnames:
            if norm_str(sname) == norm_pref:
                sheet = wb[sname]
                header_row = detectar_fila_encabezados_en_hoja(sheet)
                return sheet, header_row

    # 2. Buscar por coincidencia semántica de nombre de hoja
    candidatas = []
    keywords = ["base", "postulante", "postulantes", "nomina", "socios", "socio", "datos", "hogares", "beneficiarios"]
    for sname in wb.sheetnames:
        norm_name = norm_str(sname)
        for kw in keywords:
            if kw in norm_name:
                candidatas.append(sname)
                break

    mejor_sheet = None
    mejor_row = 1
    mejor_score = 0

    # Si hay hojas candidatas por nombre, evaluarlas primero
    hojas_a_evaluar = candidatas if candidatas else wb.sheetnames

    for sname in hojas_a_evaluar:
        sheet = wb[sname]
        row_idx, score = evaluar_mejor_fila_hoja(sheet)
        if score > mejor_score:
            mejor_score = score
            mejor_sheet = sheet
            mejor_row = row_idx

    # Si no superó el umbral y solo se evaluaron candidatas, evaluar todas las hojas
    if mejor_score < 10 and candidatas and len(candidatas) < len(wb.sheetnames):
        for sname in wb.sheetnames:
            if sname in candidatas:
                continue
            sheet = wb[sname]
            row_idx, score = evaluar_mejor_fila_hoja(sheet)
            if score > mejor_score:
                mejor_score = score
                mejor_sheet = sheet
                mejor_row = row_idx

    if mejor_sheet is not None and mejor_score >= 8:
        return mejor_sheet, mejor_row

    # Fallback al activo y fila 1
    return wb.active, 1


def detectar_metadatos_comite(
    wb: openpyxl.Workbook,
    sheet: Optional[openpyxl.worksheet.worksheet.Worksheet] = None,
    filename: Optional[str] = None
) -> Dict[str, str]:
    """
    Detecta automáticamente nombre del comité, comuna y código de expediente RUKAN
    inspeccionando la fila superior (título), nombres de hojas y nombre de archivo.
    """
    target_sheet = sheet or wb.active
    metadatos = {
        "comite_nombre": "",
        "comuna": "",
        "codigo_expediente": "",
    }

    # Textos candidatos a evaluar
    textos_candidatos = []
    if filename:
        textos_candidatos.append(str(filename))
    
    # 1. Primeras 2 filas de la hoja objetivo
    if target_sheet:
        for r in range(1, min(3, (target_sheet.max_row or 1) + 1)):
            for c in range(1, min(15, (target_sheet.max_column or 1) + 1)):
                val = target_sheet.cell(r, c).value
                if val and isinstance(val, str) and len(val.strip()) > 5:
                    textos_candidatos.append(val.strip())

    # 2. Nombres de hojas
    for sname in wb.sheetnames:
        textos_candidatos.append(sname.strip())

    # Lista conocida de comunas para matcheo rápido
    comunas_conocidas = [
        "LONCOCHE", "PERQUENCO", "TEMUCO", "PADRE LAS CASAS", "VILLARRICA",
        "PUCON", "LAUTARO", "VICTORIA", "TRAIGUEN", "ANGOL", "COLLIPULLI",
        "GORBEA", "PITRUFQUEN", "FREIRE", "CURARREHUE", "VILCUN", "CHOLCHOL",
        "CARAHUE", "SAAVEDRA", "TOLTEN", "TEODORO SCHMIDT", "CUNCO", "MELIPEUCO"
    ]

    for txt in textos_candidatos:
        txt_upper = txt.upper()

        # RUKAN
        if not metadatos["codigo_expediente"]:
            m_rukan = re.search(r"RUKAN\s*[:#\-]?\s*(\d{4,8})", txt_upper)
            if m_rukan:
                metadatos["codigo_expediente"] = m_rukan.group(1).strip()

        # Comuna
        if not metadatos["comuna"]:
            for com in comunas_conocidas:
                if com in txt_upper:
                    metadatos["comuna"] = com.title()
                    break

        # Comité
        if not metadatos["comite_nombre"]:
            # e.g., "BASE COMITÉ LA HACIENDA, LONCOCHE..." -> "COMITÉ LA HACIENDA"
            m_com = re.search(r"(COMIT[ÉE]\s+(?:DE\s+VIVIENDA\s+|HABITACIONAL\s+)?[A-Z0-9\sÁÉÍÓÚÑ]+?)(?:,|\s+RUKAN|\s+\d{2}-\d{2}-\d{4}|$)", txt_upper)
            if m_com:
                nombre_c = m_com.group(1).strip()
                if len(nombre_c) >= 7 and "COMITE" in nombre_c:
                    metadatos["comite_nombre"] = nombre_c

    # Fallback por nombre de hoja o archivo si aún no hay comité
    if not metadatos["comite_nombre"] and target_sheet:
        title_u = target_sheet.title.upper()
        if "HACIENDA" in title_u:
            metadatos["comite_nombre"] = "COMITÉ LA HACIENDA"
            if not metadatos["comuna"]:
                metadatos["comuna"] = "Loncoche"
        elif "PERQUENCO" in title_u:
            metadatos["comite_nombre"] = "COMITÉ DE VIVIENDA ECOBARRIOS DE PERQUENCO"
            if not metadatos["comuna"]:
                metadatos["comuna"] = "Perquenco"

    return metadatos


def build_column_mapping(sheet, header_row: int) -> Dict[str, int]:
    """Construye el mapa dinámico de columnas desde la fila de encabezados."""
    mapping = {}
    max_c = min(150, sheet.max_column or 1)
    for c in range(1, max_c + 1):
        val = sheet.cell(header_row, c).value
        if val is not None:
            key = norm_str(val)
            if key and key not in mapping:
                mapping[key] = c
    return mapping


def get_col_by_alias(mapping: Dict[str, int], aliases: List[str], default_col: int = 0) -> int:
    """Busca la columna asociada a una lista de alias normalizados."""
    for alias in aliases:
        norm_a = norm_str(alias)
        if norm_a in mapping:
            return mapping[norm_a]
    return default_col


def parse_parientes_dynamic(sheet, row_idx: int, col_map: Dict[str, int]) -> List[Dict[str, Any]]:
    """Extrae los parientes / cargas familiares usando mapeo dinámico flexible."""
    parientes = []
    for p_i in range(1, 10):
        aliases_nom = [
            f"pariente{p_i}", f"pariente {p_i}", f"carga{p_i}", f"carga {p_i}",
            f"familiar{p_i}", f"familiar {p_i}", f"integrante{p_i}", f"integrante {p_i}"
        ]
        c_nom = get_col_by_alias(col_map, aliases_nom, 0)
        if c_nom == 0:
            if p_i <= 6 and 60 in col_map.values():
                c_nom = 60 + (p_i - 1) * 7
            else:
                continue

        nombre_val = sheet.cell(row_idx, c_nom).value
        if not nombre_val or not str(nombre_val).strip():
            continue
        nombre_str = str(nombre_val).strip()
        if nombre_str.lower() in ["none", "nan", "0", "-"]:
            continue

        c_rut = get_col_by_alias(col_map, [f"rut{p_i}", f"rut {p_i}", f"run{p_i}", f"run {p_i}"], c_nom + 1)
        c_ec = get_col_by_alias(col_map, [f"estadocivil{p_i}", f"estadocivil {p_i}", f"ecivil{p_i}"], c_nom + 2)
        c_fn = get_col_by_alias(col_map, [f"fecnac{p_i}", f"fecnac {p_i}", f"fechanacimiento{p_i}"], c_nom + 3)
        c_ed = get_col_by_alias(col_map, [f"edad{p_i}", f"edad {p_i}"], c_nom + 4)
        c_par = get_col_by_alias(col_map, [f"parentezco{p_i}", f"parentesco{p_i}", f"parentesco {p_i}", "parentesco"], c_nom + 5)
        c_disc = get_col_by_alias(col_map, [f"discapacidad{p_i}", f"discapacidad {p_i}", f"disc{p_i}"], c_nom + 6)

        rut_val = sheet.cell(row_idx, c_rut).value if c_rut else None
        ecivil_val = sheet.cell(row_idx, c_ec).value if c_ec else None
        fec_nac_val = sheet.cell(row_idx, c_fn).value if c_fn else None
        edad_val = sheet.cell(row_idx, c_ed).value if c_ed else None
        parentesco_val = sheet.cell(row_idx, c_par).value if c_par else None
        disc_val = sheet.cell(row_idx, c_disc).value if c_disc else None

        edad_int = None
        if edad_val is not None:
            try:
                edad_int = int(float(str(edad_val).strip()))
            except (ValueError, TypeError):
                edad_int = None
        if edad_int is None and fec_nac_val is not None:
            edad_int = calculate_age_from_dob(fec_nac_val)

        parientes.append({
            "indice": p_i,
            "nombre": nombre_str,
            "rut": format_rut(rut_val),
            "estado_civil": str(ecivil_val).strip() if ecivil_val else "",
            "fecha_nacimiento": format_date(fec_nac_val),
            "edad": edad_int,
            "parentesco": str(parentesco_val).strip().upper() if parentesco_val else "",
            "discapacidad": str(disc_val).strip() if disc_val else "NO"
        })
    return parientes


def load_actividades_economicas(wb: openpyxl.Workbook) -> Dict[str, Dict[str, Any]]:
    """Carga la hoja especializada de 'Actividad Económica' si existe en el libro Excel."""
    ws_act = None
    for name in wb.sheetnames:
        norm_name = norm_str(name)
        if "actividad" in norm_name or "economica" in norm_name or "actividadeconomica" in norm_name:
            ws_act = wb[name]
            break

    if not ws_act:
        return {}

    header_row = detectar_fila_encabezados_en_hoja(ws_act)
    col_map = build_column_mapping(ws_act, header_row)

    c_nom = get_col_by_alias(col_map, COLUMN_ALIASES["nombre"], 1)
    c_rut = get_col_by_alias(col_map, COLUMN_ALIASES["rut"], 2)
    c_act = get_col_by_alias(col_map, ["actividadeconomicaprincipal", "actividadeconomica", "actividad"], 3)
    c_desc = get_col_by_alias(col_map, ["descripciondelaactividad", "descripcionactividad", "descripcion"], 5)
    c_jefe = get_col_by_alias(col_map, ["jefedehogar", "jefe"], 6)
    c_cony = get_col_by_alias(col_map, ["conyugepareja", "conyuge"], 7)
    c_otros = get_col_by_alias(col_map, ["otros", "otro"], 8)

    records = {}

    def clean_rut_key(v: Any) -> str:
        if not v:
            return ""
        s = str(v).strip()
        if "-" in s:
            s = s.split("-")[0]
        return "".join(filter(str.isdigit, s))

    for r in range(header_row + 1, ws_act.max_row + 1):
        nom_val = ws_act.cell(r, c_nom).value if c_nom else None
        rut_val = ws_act.cell(r, c_rut).value if c_rut else None
        act_val = ws_act.cell(r, c_act).value if c_act else None
        desc_val = ws_act.cell(r, c_desc).value if c_desc else None
        jefe_val = ws_act.cell(r, c_jefe).value if c_jefe else None
        cony_val = ws_act.cell(r, c_cony).value if c_cony else None
        otros_val = ws_act.cell(r, c_otros).value if c_otros else None

        if not nom_val:
            continue

        act_clean = str(act_val).strip() if act_val and str(act_val).strip().lower() not in ["none", "nan"] else ""
        desc_clean = str(desc_val).strip() if desc_val and str(desc_val).strip().lower() not in ["none", "nan"] else ""
        jefe_clean = str(jefe_val).strip().upper() if jefe_val and str(jefe_val).strip().lower() not in ["none", "nan"] else ""
        cony_clean = str(cony_val).strip().upper() if cony_val and str(cony_val).strip().lower() not in ["none", "nan"] else ""
        otros_clean = str(otros_val).strip().upper() if otros_val and str(otros_val).strip().lower() not in ["none", "nan"] else ""

        tiene_act = bool(act_clean or desc_clean)

        entry = {
            "actividad_principal": act_clean,
            "descripcion": desc_clean,
            "jefe_hogar": jefe_clean,
            "conyuge_pareja": cony_clean,
            "otros": otros_clean,
            "tiene_actividad": tiene_act
        }

        rut_k = clean_rut_key(rut_val)
        if rut_k:
            records[f"rut_{rut_k}"] = entry

        name_k = norm_str(nom_val)
        if name_k:
            records[f"nom_{name_k}"] = entry

    return records


def read_all_postulantes(excel_path: str, sheet_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Lee todos los postulantes válidos de la planilla Excel con detección automática inteligente.
    Soporta formatos nuevos, actualizados, con columnas reordenadas, nombres divididos o sin DV.
    """
    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"No se encontró el archivo Excel en {excel_path}")

    wb = openpyxl.load_workbook(excel_path, data_only=True)
    sheet, header_row = detectar_hoja_y_encabezados(wb, sheet_name)
    col_map = build_column_mapping(sheet, header_row)
    act_map = load_actividades_economicas(wb)

    # Resolución dinámica de columnas principales mediante alias
    col_orden = get_col_by_alias(col_map, COLUMN_ALIASES["orden"], 1)
    col_nombre = get_col_by_alias(col_map, COLUMN_ALIASES["nombre"], 0)
    col_nombres = get_col_by_alias(col_map, COLUMN_ALIASES["nombres"], 0)
    col_paterno = get_col_by_alias(col_map, COLUMN_ALIASES["apellido_paterno"], 0)
    col_materno = get_col_by_alias(col_map, COLUMN_ALIASES["apellido_materno"], 0)
    col_apellidos = get_col_by_alias(col_map, COLUMN_ALIASES["apellidos"], 0)

    col_rut = get_col_by_alias(col_map, COLUMN_ALIASES["rut"], 0)
    col_dv = get_col_by_alias(col_map, COLUMN_ALIASES["dv"], 0)

    col_fono = get_col_by_alias(col_map, COLUMN_ALIASES["fono"], 0)
    col_dir_rsh = get_col_by_alias(col_map, COLUMN_ALIASES["direccion_rsh"], 0)
    col_rol_sii = get_col_by_alias(col_map, COLUMN_ALIASES["rol_sii"], 0)
    col_dir_terreno = get_col_by_alias(col_map, COLUMN_ALIASES["direccion_terreno"], 0)
    col_etnia = get_col_by_alias(col_map, COLUMN_ALIASES["etnia"], 0)
    col_sexo = get_col_by_alias(col_map, COLUMN_ALIASES["sexo"], 0)
    col_ecivil = get_col_by_alias(col_map, COLUMN_ALIASES["estado_civil"], 0)
    col_fec_nac = get_col_by_alias(col_map, COLUMN_ALIASES["fec_nac"], 0)
    col_edad = get_col_by_alias(col_map, COLUMN_ALIASES["edad"], 0)
    col_disc = get_col_by_alias(col_map, COLUMN_ALIASES["discapacidad"], 0)
    col_comuna = get_col_by_alias(col_map, COLUMN_ALIASES["comuna"], 0)
    col_factor = get_col_by_alias(col_map, COLUMN_ALIASES["factor_aislamiento"], 0)
    col_gf_cant = get_col_by_alias(col_map, COLUMN_ALIASES["grupo_fam_cant"], 0)
    col_tipo_viv = get_col_by_alias(col_map, COLUMN_ALIASES["tipo_vivienda"], 0)
    col_tipo_fam = get_col_by_alias(col_map, COLUMN_ALIASES["tipo_fam"], 0)
    col_parentezco = get_col_by_alias(col_map, COLUMN_ALIASES["parentezco"], 0)
    col_fundamento = get_col_by_alias(col_map, COLUMN_ALIASES["fundamento"], 0)

    # Columnas de cónyuge en la misma fila si existen
    col_c_nombre = get_col_by_alias(col_map, COLUMN_ALIASES["c_nombre"], 0)
    col_c_rut = get_col_by_alias(col_map, COLUMN_ALIASES["c_rut"], 0)
    col_c_fec_nac = get_col_by_alias(col_map, COLUMN_ALIASES["c_fec_nac"], 0)
    col_c_sexo = get_col_by_alias(col_map, COLUMN_ALIASES["c_sexo"], 0)

    # Validación mínima de existencia de columnas críticas
    if not col_rut and not col_nombre:
        if header_row == 1:
            col_nombre = 2
            col_rut = 3
            col_dv = 4
        else:
            claves = list(col_map.keys())[:15]
            raise ValueError(
                f"La hoja '{sheet.title}' no contiene columnas identificables para RUT o Nombre de postulantes. "
                f"Columnas detectadas: {claves}"
            )

    postulantes = []

    def clean_s(val: Any) -> str:
        if val is None:
            return ""
        s = str(val).strip()
        return "" if s.lower() in ["none", "nan"] else s

    for r in range(header_row + 1, sheet.max_row + 1):
        # 1. Determinar Nombre
        nombre_val = sheet.cell(r, col_nombre).value if col_nombre else None
        if not nombre_val:
            partes = []
            if col_nombres:
                val = sheet.cell(r, col_nombres).value
                if val:
                    partes.append(str(val).strip())
            if col_paterno:
                val = sheet.cell(r, col_paterno).value
                if val:
                    partes.append(str(val).strip())
            if col_materno:
                val = sheet.cell(r, col_materno).value
                if val:
                    partes.append(str(val).strip())
            if not partes and col_apellidos:
                val = sheet.cell(r, col_apellidos).value
                if val:
                    partes.append(str(val).strip())
            if partes:
                nombre_val = " ".join(partes)

        # 2. Determinar RUT
        rut_num = sheet.cell(r, col_rut).value if col_rut else None
        dv_val = sheet.cell(r, col_dv).value if col_dv else None

        # Si no hay ni nombre ni RUT, es fila vacía al final de la planilla
        if not nombre_val and not rut_num:
            continue

        # Descartar filas con encabezados repetidos o totales
        if str(nombre_val or "").strip().lower() in ["nombre", "postulante", "total", "totales"]:
            continue
        if str(rut_num or "").strip().lower() in ["rut", "run"]:
            continue

        nro_orden = sheet.cell(r, col_orden).value if col_orden else None
        fono = sheet.cell(r, col_fono).value if col_fono else ""
        dir_rsh = sheet.cell(r, col_dir_rsh).value if col_dir_rsh else ""
        rol_sii = sheet.cell(r, col_rol_sii).value if col_rol_sii else ""
        dir_terreno = sheet.cell(r, col_dir_terreno).value if col_dir_terreno else ""
        etnia = sheet.cell(r, col_etnia).value if col_etnia else ""
        sexo = sheet.cell(r, col_sexo).value if col_sexo else ""
        estado_civil = sheet.cell(r, col_ecivil).value if col_ecivil else ""
        fecha_nac = sheet.cell(r, col_fec_nac).value if col_fec_nac else None
        edad = sheet.cell(r, col_edad).value if col_edad else None
        discapacidad = sheet.cell(r, col_disc).value if col_disc else ""
        comuna = sheet.cell(r, col_comuna).value if col_comuna else ""
        grupo_fam_cant = sheet.cell(r, col_gf_cant).value if col_gf_cant else None
        raw_tipo_viv = sheet.cell(r, col_tipo_viv).value if col_tipo_viv else ""
        factor_aislamiento = sheet.cell(r, col_factor).value if col_factor else ""
        fundamento = sheet.cell(r, col_fundamento).value if col_fundamento else ""

        # Cónyuge explícito en columnas
        raw_c_nom = sheet.cell(r, col_c_nombre).value if col_c_nombre else None
        raw_c_rut = sheet.cell(r, col_c_rut).value if col_c_rut else None
        raw_c_fn = sheet.cell(r, col_c_fec_nac).value if col_c_fec_nac else None
        raw_c_sex = sheet.cell(r, col_c_sexo).value if col_c_sexo else None

        # Normalizar edad del titular
        edad_titular = None
        if edad is not None:
            try:
                edad_titular = int(float(str(edad).strip()))
            except (ValueError, TypeError):
                edad_titular = None
        if edad_titular is None and fecha_nac is not None:
            edad_titular = calculate_age_from_dob(fecha_nac)

        # Parsear parientes / cargas familiares
        parientes = parse_parientes_dynamic(sheet, r, col_map)

        # Normalizar cantidad de integrantes
        gf_num = None
        if grupo_fam_cant is not None:
            try:
                gf_num = int(float(str(grupo_fam_cant).strip()))
            except (ValueError, TypeError):
                gf_num = None
        if gf_num is None or gf_num <= 0:
            gf_num = 1 + len(parientes)

        # Consolidar cónyuge
        conyuge_nombre_final = str(raw_c_nom).strip() if raw_c_nom else ""
        conyuge_rut_final = format_rut(raw_c_rut)
        conyuge_sexo_final = str(raw_c_sex).strip().upper() if raw_c_sex else ""
        conyuge_fn_final = format_date(raw_c_fn)

        if not conyuge_nombre_final:
            for p in parientes:
                if any(w in p.get("parentesco", "") for w in ["CONYUGE", "CONVIVIENTE", "PAREJA", "ESPOSO", "ESPOSA"]):
                    conyuge_nombre_final = p.get("nombre", "")
                    if not conyuge_rut_final:
                        conyuge_rut_final = p.get("rut", "")
                    if not conyuge_fn_final:
                        conyuge_fn_final = p.get("fecha_nacimiento", "")
                    break

        # Cruzar actividad económica si existe hoja
        rut_clean_digits = "".join(filter(str.isdigit, str(rut_num or "")))
        act_info = act_map.get(f"rut_{rut_clean_digits}") or act_map.get(f"nom_{norm_str(nombre_val)}") or {
            "actividad_principal": "",
            "descripcion": "",
            "jefe_hogar": "",
            "conyuge_pareja": "",
            "otros": "",
            "tiene_actividad": False
        }

        # Formatear RUT estándar
        formatted_rut = format_rut(rut_num, dv_val)

        postulantes.append({
            "fila_excel": r,
            "nro_orden": int(nro_orden) if nro_orden and str(nro_orden).isdigit() else len(postulantes) + 1,
            "nombre": clean_s(nombre_val).upper(),
            "rut": formatted_rut,
            "telefono": clean_s(fono),
            "fecha_nacimiento": format_date(fecha_nac),
            "edad": edad_titular,
            "sexo": clean_s(sexo).upper(),
            "estado_civil": clean_s(estado_civil).upper(),
            "etnia": clean_s(etnia).upper(),
            "pais": "CHILE",
            "discapacidad": clean_s(discapacidad),
            "direccion_rsh": clean_s(dir_rsh),
            "direccion_terreno": clean_s(dir_terreno),
            "rol_sii": clean_s(rol_sii),
            "comuna": clean_s(comuna),
            "provincia": "Cautín",
            "region": "La Araucanía",
            "factor_aislamiento": str(factor_aislamiento).strip() if factor_aislamiento is not None else "",
            "grupo_familiar_cant": gf_num,
            "tipo_fam": clean_s(sheet.cell(r, col_tipo_fam).value) if col_tipo_fam else "",
            "parentezco": clean_s(sheet.cell(r, col_parentezco).value) if col_parentezco else "",
            "conyuge": {
                "nombre": conyuge_nombre_final,
                "rut": conyuge_rut_final,
                "sexo": conyuge_sexo_final,
                "fecha_nacimiento": conyuge_fn_final
            },
            "parientes": parientes,
            "actividad_economica": act_info,
            "tipo_vivienda": clean_s(raw_tipo_viv),
            "tipologia_propuesta": clean_s(raw_tipo_viv),
            "fundamento": clean_s(fundamento)
        })

    if not postulantes:
        raise ValueError(
            f"No se encontraron filas válidas de postulantes en la hoja '{sheet.title}'. "
            f"Hojas disponibles en el archivo: {wb.sheetnames}. "
            f"Verifica que la planilla contenga datos de personas con RUT y Nombre."
        )

    return postulantes
