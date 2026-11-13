"""Servicio de generación y análisis de expedientes D.S. 10 (Ecobarrios) para SIGEP."""

import io
import os
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt

# Importar submódulos de src
SERVICE_DIR = Path(__file__).resolve().parent
SRC_DIR = SERVICE_DIR / "src"
TEMPLATES_DIR = SERVICE_DIR / "templates"

if str(SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(SERVICE_DIR))

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

import json
import logging
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import openpyxl
from collections import Counter
from docx_generator import fill_formulario_phr
from excel_reader import (
    format_rut,
    read_all_postulantes,
    detectar_metadatos_comite,
    detectar_hoja_y_encabezados,
    build_column_mapping,
    diagnosticar_columnas_excel,
    generar_plantilla_modelo_excel,
)
from gemini_auditor import consolidate_postulante_local, TERRENO_PROYECTO_CONSOLIDADO
from informe_social_generator import (
    calculate_informe_social_aggregates,
    fill_informe_social_docx,
)

logger = logging.getLogger(__name__)

DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_TIMEOUT_SECONDS = 5.0
GEMINI_API_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"


def get_gemini_api_key() -> str:
    """Obtiene la API key de Gemini desde variables de entorno."""
    return (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()


def _resolver_metadatos_y_terreno(
    postulantes: List[Dict[str, Any]],
    metadata: Optional[Dict[str, Any]] = None,
    tmp_path: Optional[str] = None
) -> Tuple[Dict[str, Any], Dict[str, str]]:
    """
    Resuelve los metadatos del proyecto y el predio de forma completamente dinámica
    sin asociar datos estáticos de Perquenco u otro comité si la planilla corresponde a otro.
    """
    meta = dict(metadata or {})

    # Detectar metadatos desde Excel
    detectados = {}
    if tmp_path and os.path.exists(tmp_path):
        try:
            wb = openpyxl.load_workbook(tmp_path, data_only=True)
            sheet, _ = detectar_hoja_y_encabezados(wb)
            detectados = detectar_metadatos_comite(wb, sheet=sheet, filename=Path(tmp_path).name)
        except Exception:
            pass

    # Predominancia de comuna desde las filas de postulantes
    comunas = [p.get("comuna") for p in postulantes if p.get("comuna") and str(p.get("comuna")).strip()]
    comuna_pred = Counter(comunas).most_common(1)[0][0] if comunas else ""

    comuna_raw = meta.get("comuna") or detectados.get("comuna") or comuna_pred or "Perquenco"
    comuna_final = str(comuna_raw).strip().title()

    comite_raw = meta.get("comite_nombre") or detectados.get("comite_nombre")
    if not comite_raw or ("ECOBARRIOS DE PERQUENCO" in str(comite_raw).upper() and "PERQUENCO" not in comuna_final.upper()):
        comite_final = f"COMITÉ DE VIVIENDA {comuna_final.upper()}" if comuna_final else "COMITÉ HABITACIONAL"
    else:
        comite_final = str(comite_raw).strip().upper()

    codigo_raw = meta.get("codigo_expediente") or detectados.get("codigo_expediente") or "En trámite"
    codigo_final = str(codigo_raw).strip()

    meta["comuna"] = comuna_final
    meta["comite_nombre"] = comite_final
    meta["codigo_expediente"] = codigo_final
    meta["total_familias"] = len(postulantes)

    # Terreno del proyecto
    calle_custom = meta.get("terreno_calle")
    rol_custom = meta.get("terreno_rol")
    lote_custom = meta.get("terreno_lote")
    localidad_custom = meta.get("terreno_localidad")

    if calle_custom or (rol_custom and rol_custom != "En trámite"):
        terr = {
            "calle": calle_custom or f"Terreno Proyecto {comite_final}",
            "lote": lote_custom or "Lote Proyecto",
            "rol_sii": rol_custom or "En trámite",
            "comuna": comuna_final.upper(),
            "provincia": meta.get("terreno_provincia") or "Cautín",
            "region": meta.get("terreno_region") or "La Araucanía",
            "localidad": localidad_custom or comuna_final
        }
    elif "PERQUENCO" in comuna_final.upper():
        terr = dict(TERRENO_PROYECTO_CONSOLIDADO)
    else:
        terr = {
            "calle": f"Terreno Proyecto {comite_final}",
            "lote": "Lote Proyecto",
            "rol_sii": "En trámite",
            "comuna": comuna_final.upper(),
            "provincia": "Cautín",
            "region": "La Araucanía",
            "localidad": comuna_final
        }

    return meta, terr


def _guardar_temp_excel(archivo_bytes_o_ruta: Any) -> Tuple[str, bool]:
    """Retorna la ruta al archivo Excel y un booleano indicando si es temporal."""
    if isinstance(archivo_bytes_o_ruta, (str, Path)) and os.path.exists(archivo_bytes_o_ruta):
        return str(archivo_bytes_o_ruta), False

    # Es un archivo en memoria (UploadedFile o BytesIO)
    name = getattr(archivo_bytes_o_ruta, "name", str(archivo_bytes_o_ruta))
    suffix = ".xlsm" if str(name).lower().endswith(".xlsm") else ".xlsx"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        if hasattr(archivo_bytes_o_ruta, "read"):
            archivo_bytes_o_ruta.seek(0)
            tmp.write(archivo_bytes_o_ruta.read())
        else:
            tmp.write(archivo_bytes_o_ruta)
        tmp_path = tmp.name
    return tmp_path, True


def analizar_excel_ecobarrios(archivo_bytes_o_ruta: Any) -> Dict[str, Any]:
    """Analiza una base Excel y retorna las métricas oficiales D.S. 10 y diagnóstico de columnas."""
    tmp_path, es_temp = _guardar_temp_excel(archivo_bytes_o_ruta)
    try:
        postulantes = read_all_postulantes(tmp_path, sheet_name=None)
        meta, terr = _resolver_metadatos_y_terreno(postulantes, tmp_path=tmp_path)

        # Diagnóstico estandarizado de columnas Excel D.S. 10
        diagnostico_cols = {}
        try:
            wb = openpyxl.load_workbook(tmp_path, data_only=True)
            sheet, header_row = detectar_hoja_y_encabezados(wb)
            col_map = build_column_mapping(sheet, header_row)
            diagnostico_cols = diagnosticar_columnas_excel(col_map)
        except Exception as e:
            logger.warning(f"Error generando diagnóstico de columnas: {e}")

        agg = calculate_informe_social_aggregates(
            postulantes,
            datos_terreno=terr,
            nombre_grupo=meta["comite_nombre"],
            codigo_expediente=meta["codigo_expediente"]
        )
        demo = agg.get("demografia", {})
        req = agg.get("requerimientos_vivienda", {})
        rec = agg.get("recintos_complementarios", {})

        postulantes_list = []
        for i, p in enumerate(postulantes):
            c = consolidate_postulante_local(p, datos_terreno_proyecto=terr)
            t4 = c.get("tabla_4", {})
            td = c.get("tercer_dormitorio", {})
            aplica_3d = bool(td.get("aplica", False))
            es_may = bool(t4.get("adultos_mayores", {}).get("si") == "X") or ((p.get("edad") or 0) >= 60)
            es_ind = bool(t4.get("indigena", {}).get("si") == "X") or (str(p.get("etnia", "")).upper() not in ["", "NO", "NINGUNO", "NINGUNA"])
            es_disc = bool(t4.get("discapacidad", {}).get("si") == "X") or (str(p.get("discapacidad", "")).upper() not in ["", "NO", "NINGUNA", "0"])

            tipo = "3ER DORMITORIO" if aplica_3d else "VIVIENDA BASE"

            postulantes_list.append({
                "n": p.get("nro_orden", i + 1),
                "nombre": p.get("nombre", ""),
                "rut": p.get("rut", ""),
                "estado_civil": p.get("estado_civil", "SOLTERO/A"),
                "tipo_vivienda": tipo,
                "tercer_dormitorio": aplica_3d,
                "adulto_mayor": es_may,
                "conadi": es_ind,
                "discapacidad": es_disc,
            })

        pct_map = round((demo.get("familias_mapuche", 0) / len(postulantes)) * 100, 1) if postulantes else 0.0

        resumen = {
            "total_familias": len(postulantes),
            "total_personas": demo.get("tot_personas", 0),
            "hombres": demo.get("tot_hombres", 0),
            "mujeres": demo.get("tot_mujeres", 0),
            "menores_18": demo.get("tot_menores", 0),
            "adultos_mayores": demo.get("tot_mayores", 0),
            "conadi": demo.get("tot_mapuche", 0),
            "familias_conadi": demo.get("familias_mapuche", 0),
            "pct_conadi": pct_map,
            "discapacidad": demo.get("tot_discapacidad", 0),
            "familias_discapacidad": demo.get("familias_con_discapacidad", 0),
            "viviendas_3d": req.get("d3_conjunto", 0),
            "viviendas_base": len(postulantes) - req.get("d3_conjunto", 0),
            "recintos_bodega": rec.get("bodega", 0),
            "recintos_productivo": rec.get("productivo", 1),
            "comite_detectado": meta["comite_nombre"],
            "comuna_detectada": meta["comuna"],
            "codigo_expediente_detectado": meta["codigo_expediente"],
            "terreno_detectado": terr,
            "diagnostico_columnas": diagnostico_cols,
            "postulantes": postulantes_list,
        }
        return resumen
    finally:
        if es_temp and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


def generar_nomina_docx(postulantes: List[Dict[str, Any]], metadata: Dict[str, Any], output_path_or_buf: Any) -> Any:
    """Genera la nómina oficial numerada 1 a N alfabética."""
    tpl_path = TEMPLATES_DIR / "Formato_Nomina_Base.docx"
    if tpl_path.exists():
        doc = docx.Document(str(tpl_path))
    else:
        doc = docx.Document()
        doc.add_heading("NÓMINA OFICIAL DE POSTULANTES", 0)

    nombre_grupo = str(metadata.get("comite_nombre") or "COMITÉ DE VIVIENDA").upper()
    for p in doc.paragraphs:
        if "COMITÉ" in p.text.upper() or "COMITE" in p.text.upper():
            p.text = f"PROYECTO: {nombre_grupo}"
            if p.runs:
                p.runs[0].font.name = "Arial"
                p.runs[0].font.size = Pt(11)
                p.runs[0].font.bold = True

    if doc.tables:
        t = doc.tables[0]
        while len(t.rows) > 1:
            t._tbl.remove(t.rows[-1]._tr)

        postulantes_sorted = sorted(postulantes, key=lambda x: str(x.get("nombre", "")).upper())
        for i, p in enumerate(postulantes_sorted, start=1):
            row = t.add_row()
            cells = row.cells
            cells[0].text = str(i)
            cells[1].text = str(p.get("nombre", "")).upper()
            cells[2].text = format_rut(p.get("rut", ""))
            if len(cells) > 3:
                cells[3].text = str(p.get("estado_civil", "SOLTERO/A")).upper()
            if len(cells) > 4:
                tipo = str(p.get("tipo_vivienda", "VIVIENDA BASE")).upper()
                if p.get("requiere_3d", False) and "3" not in tipo:
                    tipo += " + 3ER DORMITORIO"
                cells[4].text = tipo

            for c in cells:
                for para in c.paragraphs:
                    for run in para.runs:
                        run.font.name = "Arial"
                        run.font.size = Pt(8.0)

    doc.save(output_path_or_buf)
    return output_path_or_buf


def generar_compromiso_docx(metadata: Dict[str, Any], output_path_or_buf: Any) -> Any:
    """Genera la declaración jurada de compromiso de profesionales."""
    tpl_path = TEMPLATES_DIR / "Formato_Compromiso_Base.docx"
    if tpl_path.exists():
        doc = docx.Document(str(tpl_path))
    else:
        doc = docx.Document()
        doc.add_heading("DECLARACIÓN JURADA DE COMPROMISO DE PROFESIONALES", 0)

    comite = str(metadata.get("comite_nombre") or "COMITÉ DE VIVIENDA").upper()
    expediente = str(metadata.get("codigo_expediente") or "En trámite")
    comuna = str(metadata.get("comuna") or "Comuna").upper()
    familias = str(metadata.get("total_familias") or 1)

    target_phrase = f"{comite}, CÓDIGO DE EXPEDIENTE {expediente}, compuesto de {familias} familias de la comuna de {comuna}"
    for p in doc.paragraphs:
        if "COMITÉ DE VIVIENDA" in p.text.upper() or "COMITE DE VIVIENDA" in p.text.upper():
            for run in p.runs:
                if any(k in run.text.upper() for k in ["COMITÉ", "COMITE", "EXPEDIENTE"]):
                    run.text = target_phrase
                    run.font.bold = True

    doc.save(output_path_or_buf)
    return output_path_or_buf


def sintetizar_textos_at6_local(datos: Dict[str, Any], preguntas: Dict[str, Any]) -> Dict[str, str]:
    """Generador experto institucional SERVIU D.S. 10 (100% determinista y confiable)."""
    comite = str(datos.get("comite_nombre") or "Comité Habitacional").strip().upper()
    comuna = str(datos.get("comuna") or "Perquenco").strip().title()
    tot_familias = int(datos.get("total_familias") or 0)
    tot_personas = int(datos.get("total_personas") or 0)
    viviendas_3d = int(datos.get("viviendas_3d") or 0)
    familias_mapuche = int(datos.get("familias_mapuche") or datos.get("conadi") or 0)
    pct_mapuche = datos.get("pct_mapuche")
    if pct_mapuche is None and tot_familias > 0:
        pct_mapuche = round((familias_mapuche / tot_familias) * 100, 1)
    else:
        pct_mapuche = pct_mapuche or 0

    bodegas = int(datos.get("recintos_bodega") or max(1, round(tot_familias * 0.15)))
    productivo = int(datos.get("recintos_productivo") or 1)

    # Respuestas a preguntas clave
    agua = str(preguntas.get("agua_potable") or "sistema normativo de captación y potabilización normado NCh 409").strip()
    alcantarillado = str(preguntas.get("alcantarillado") or "solución sanitaria individual aprobada mediante fosa séptica con cámara desgrasadora y drenes de infiltración").strip()
    electricidad = str(preguntas.get("electricidad") or "conexión a la red de distribución eléctrica aérea de la empresa concesionaria de la zona").strip()

    predio = str(preguntas.get("terreno_calle") or datos.get("terreno_calle") or f"predio del proyecto {comite}").strip()
    rol = str(preguntas.get("terreno_rol") or datos.get("terreno_rol") or "En trámite").strip()
    topografia = str(preguntas.get("topografia") or "terreno plano con pendiente inferior al 3%").strip()
    riesgos = str(preguntas.get("riesgos") or "libre de riesgos de remoción en masa, derrumbes, aluviones o inundaciones fluviales").strip()
    enfoque_social = str(preguntas.get("enfoque_social") or "superación de la vulnerabilidad socioeconómica y condiciones de allegamiento rural").strip()

    ref_terreno = predio
    if rol and rol != "En trámite":
        ref_terreno += f", Rol SII {rol}"

    # 1. Tabla 26: Observaciones de Servicios Básicos
    obs_servicios = (
        f"Para el abastecimiento de agua potable de las {tot_familias} familias del proyecto {comite} en la comuna de {comuna}, "
        f"se contempla {agua}, garantizando caudal y calidad según NCh 409. En cuanto a la disposición de aguas servidas, "
        f"se proyecta {alcantarillado}, cumpliendo estrictamente con las exigencias sanitarias sectoriales. "
        f"El suministro eléctrico se garantizará mediante {electricidad}, con empalmes monofásicos normalizados conforme a la reglamentación SEC."
    )

    # 2. Tabla 30: Riesgos Naturales
    riesgos_txt = (
        f"El predio del proyecto ({ref_terreno}, comuna de {comuna}) se emplaza en un {topografia}, "
        f"{riesgos}. Cuenta con condiciones geográficas, mecánicas de suelo y de escorrentía superficial "
        f"completamente aptas para el emplazamiento seguro del conjunto habitacional y sus obras de urbanización asociadas."
    )

    # 3. Tabla 31: Opinión Profesional y Conclusión Social
    mapuche_phrase = f" y un {pct_mapuche}% de pertinencia indígena Mapuche ({familias_mapuche} familias)" if familias_mapuche > 0 else ""
    opinion_profesional = (
        f"El presente proyecto de habitabilidad rural atiende a {tot_familias} familias ({tot_personas} personas) de alta vulnerabilidad "
        f"socioeconómica (pertenecientes al 40% del RSH) de la comuna de {comuna}, caracterizadas por una destacada jefatura de hogar femenina"
        f"{mapuche_phrase}. Su ejecución busca dar respuesta definitiva al {enfoque_social} en que residen actualmente las familias. "
        f"La solución habitacional propuesta incorpora {viviendas_3d} viviendas con 3° dormitorio por composición de grupo familiar o movilidad "
        f"reducida, además de {bodegas} bodegas de resguardo no habitables y {productivo} recinto productivo/taller, fundamentales para fortalecer "
        f"las actividades económicas, productivas y de sustento rural del comité."
    )

    return {
        "obs_servicios_basicos": obs_servicios,
        "riesgos_naturales": riesgos_txt,
        "opinion_profesional": opinion_profesional,
        "fuente": "experto_local",
    }


def redactar_textos_at6(datos: Dict[str, Any], preguntas: Dict[str, Any]) -> Dict[str, Any]:
    """
    Redacta las Tablas 26, 30 y 31 del AT-6 usando Gemini API con fallback al motor local SERVIU.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        return sintetizar_textos_at6_local(datos, preguntas)

    model = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip()
    url = GEMINI_API_URL_TEMPLATE.format(model=model, api_key=api_key)

    prompt = f"""Eres un perito redactor experto de SERVIU y MINVU especializado en proyectos de Habitabilidad Rural D.S. N° 10.
Tu labor es redactar con lenguaje técnico, formal, riguroso e institucional chileno los 3 textos requeridos para el Formulario AT-6 (Diagnóstico Social Consolidado) del siguiente proyecto habitacional:

ANTECEDENTES DEL PROYECTO:
- Nombre Comité: {datos.get('comite_nombre', 'Comité Habitacional')}
- Comuna: {datos.get('comuna', 'Perquenco')}
- Código Expediente RUKAN: {datos.get('codigo_expediente', 'En trámite')}
- Total Familias Postulantes: {datos.get('total_familias', 0)}
- Total Personas: {datos.get('total_personas', 0)}
- Familias con Pertenencia Indígena: {datos.get('familias_mapuche', 0)} ({datos.get('pct_mapuche', 0)}%)
- Familias con Discapacidad: {datos.get('familias_con_discapacidad', 0)}
- Viviendas con 3° Dormitorio (3D): {datos.get('viviendas_3d', 0)}
- Recintos Complementarios: {datos.get('recintos_bodega', 0)} Bodegas y {datos.get('recintos_productivo', 1)} Taller Productivo

CONFIGURACIÓN TÉCNICA INFORMADA POR EL PROFESIONAL:
- Agua Potable: {preguntas.get('agua_potable', 'APR o captación normada')}
- Alcantarillado: {preguntas.get('alcantarillado', 'Fosa séptica con drenes')}
- Electricidad: {preguntas.get('electricidad', 'Red eléctrica aérea de distribución')}
- Predio / Terreno: {preguntas.get('terreno_calle', 'Predio del Proyecto')}, Rol SII {preguntas.get('terreno_rol', 'En trámite')}
- Topografía del Suelo: {preguntas.get('topografia', 'Terreno plano < 3%')}
- Riesgos Naturales: {preguntas.get('riesgos', 'Libre de riesgos de inundación y remoción en masa')}
- Enfoque Social: {preguntas.get('enfoque_social', 'Superación del allegamiento y resguardo productivo')}

INSTRUCCIONES ESPECÍFICAS DE REDACCIÓN:
1. "obs_servicios_basicos": Párrafo técnico formal para la Tabla 26 del AT-6. Debe detallar la solución proyectada de agua potable (indicando cumplimiento de NCh 409), el sistema de alcantarillado/aguas servidas y el empalme eléctrico normalizado.
2. "riesgos_naturales": Párrafo técnico formal para la Tabla 30 del AT-6. Debe certificar que el predio cumple con condiciones de pendiente, mecánica de suelo y ausencia de riesgos naturales (inundación, remoción, cauces).
3. "opinion_profesional": Párrafo de diagnóstico y opinión profesional para la Tabla 31 del AT-6. Debe fundamentar social y técnicamente la viabilidad del proyecto, destacando la vulnerabilidad del 40% RSH, jefatura femenina, pertinencia indígena (si aplica), tipologías 3D y recintos complementarios.

Debes responder ÚNICAMENTE con un JSON válido con esta estructura:
{{
  "obs_servicios_basicos": "texto aquí",
  "riesgos_naturales": "texto aquí",
  "opinion_profesional": "texto aquí"
}}
Sin código markdown ni explicaciones adicionales."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
            "maxOutputTokens": 1000,
        },
    }

    try:
        req = Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(req, timeout=GEMINI_TIMEOUT_SECONDS) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            candidate = resp_data.get("candidates", [{}])[0]
            part = candidate.get("content", {}).get("parts", [{}])[0]
            raw_text = part.get("text", "").strip()
            res = json.loads(raw_text)
            res["fuente"] = "gemini"
            return res
    except Exception as e:
        logger.warning(f"Error llamando a Gemini ({e}). Usando sintetizador local.")
        return sintetizar_textos_at6_local(datos, preguntas)


def generar_documento_individual(
    archivo_bytes_o_ruta: Any,
    tipo: str,
    rut_o_n: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Tuple[io.BytesIO, str]:
    """Genera un único documento del expediente en milisegundos."""
    meta = metadata or {}
    tmp_path, es_temp = _guardar_temp_excel(archivo_bytes_o_ruta)
    try:
        postulantes = read_all_postulantes(tmp_path, sheet_name=None)
        meta, terr = _resolver_metadatos_y_terreno(postulantes, meta, tmp_path)
        buf = io.BytesIO()

        profesionales_firmantes = {
            "tecnico": {
                "egr": meta.get("egr_nombre", "CONSULTORA PLAN SOCIAL LIMITADA"),
                "nombre": meta.get("arquitecto", "Vanessa Schneider Martínez"),
                "rut": "13.730.440-6",
                "profesion": "Arquitecta"
            },
            "social": {
                "egr": meta.get("egr_nombre", "CONSULTORA PLAN SOCIAL LIMITADA"),
                "nombre": meta.get("trabajador_social", "Erica Reyes Peña"),
                "rut": "20.402.240-2",
                "profesion": "TRABAJADORA SOCIAL"
            },
            "postulante": {}
        }

        if tipo == "at6":
            at6_tpl = TEMPLATES_DIR / "Formato_AT6_Base.docx"
            textos_custom = {
                "obs_servicios_basicos": meta.get("obs_servicios_basicos"),
                "riesgos_naturales": meta.get("riesgos_naturales"),
                "opinion_profesional": meta.get("opinion_profesional"),
            }
            agg_data = calculate_informe_social_aggregates(
                postulantes,
                datos_terreno=terr,
                nombre_grupo=meta.get("comite_nombre"),
                egr_nombre=meta.get("egr_nombre"),
                egr_rut=meta.get("egr_rut"),
                codigo_expediente=meta.get("codigo_expediente"),
                textos_personalizados={k: v for k, v in textos_custom.items() if v},
            )
            # Usar archivo temporal para fill_informe_social_docx
            with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp_out:
                tmp_out_path = tmp_out.name
            fill_informe_social_docx(str(at6_tpl), agg_data, tmp_out_path)
            with open(tmp_out_path, "rb") as f:
                buf.write(f.read())
            os.remove(tmp_out_path)
            buf.seek(0)
            return buf, "14. AT-6_Diagnostico_Social_Consolidado.docx"

        elif tipo == "nomina":
            generar_nomina_docx(postulantes, meta, buf)
            buf.seek(0)
            return buf, "4. NOMINA_Oficial_Postulantes.docx"

        elif tipo == "compromiso":
            generar_compromiso_docx(meta, buf)
            buf.seek(0)
            return buf, "3. COMPROMISO_Profesionales.docx"

        elif tipo == "phr61":
            post_target = None
            if rut_o_n:
                target_str = str(rut_o_n).replace(".", "").replace("-", "").strip().lower()
                for p in postulantes:
                    p_rut_clean = str(p.get("rut", "")).replace(".", "").replace("-", "").strip().lower()
                    if target_str == p_rut_clean or str(p.get("nro_orden", "")) == str(rut_o_n):
                        post_target = p
                        break
            if not post_target and postulantes:
                post_target = postulantes[0]

            if not post_target:
                raise ValueError("No se encontró el postulante solicitado.")

            f61_tpl = TEMPLATES_DIR / "Formato_6.1_Base.docx"
            tpl_bytes = f61_tpl.read_bytes()

            p_firmantes = dict(profesionales_firmantes)
            p_firmantes["postulante"] = {
                "nombre": post_target.get("nombre", ""),
                "rut": post_target.get("rut", "")
            }

            consolidated = consolidate_postulante_local(
                post_target,
                usar_rsh_en_terreno=False,
                datos_terreno_proyecto=terr,
                profesionales_firmantes=p_firmantes
            )

            fill_formulario_phr(
                io.BytesIO(tpl_bytes),
                consolidated,
                buf,
                egr_name=meta.get("egr_nombre"),
                profesionales_firmantes=p_firmantes
            )
            buf.seek(0)

            rut_slug = str(post_target.get("rut", "")).replace(".", "").replace("-", "_")
            nom_slug = str(post_target.get("nombre", "Socio")).replace(" ", "_")[:30]
            return buf, f"PHR_6.1_{rut_slug}_{nom_slug}.docx"

        else:
            raise ValueError(f"Tipo de documento no válido: {tipo}")
    finally:
        if es_temp and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


def generar_expediente_zip(archivo_bytes_o_ruta: Any, metadata: Dict[str, Any]) -> Tuple[io.BytesIO, str]:
    """Genera en lote todos los archivos del expediente y los empaqueta en un ZIP."""
    tmp_path, es_temp = _guardar_temp_excel(archivo_bytes_o_ruta)
    try:
        postulantes = read_all_postulantes(tmp_path, sheet_name=None)
        meta, terr = _resolver_metadatos_y_terreno(postulantes, metadata, tmp_path)
        metadata.update(meta)

        comite_slug = metadata.get("comite_nombre", "Comite").replace(" ", "_")
        zip_filename = f"Expediente_{comite_slug}.zip"

        profesionales_firmantes = {
            "tecnico": {
                "egr": metadata.get("egr_nombre", "CONSULTORA PLAN SOCIAL LIMITADA"),
                "nombre": metadata.get("arquitecto", "Vanessa Schneider Martínez"),
                "rut": "13.730.440-6",
                "profesion": "Arquitecta"
            },
            "social": {
                "egr": metadata.get("egr_nombre", "CONSULTORA PLAN SOCIAL LIMITADA"),
                "nombre": metadata.get("trabajador_social", "Erica Reyes Peña"),
                "rut": "20.402.240-2",
                "profesion": "TRABAJADORA SOCIAL"
            },
            "postulante": {}
        }

        f61_tpl = TEMPLATES_DIR / "Formato_6.1_Base.docx"
        tpl_bytes = f61_tpl.read_bytes() if f61_tpl.exists() else None

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            # 1. Generar Formularios 6.1 Individuales con consolidación completa en memoria
            if tpl_bytes:
                for i, p in enumerate(postulantes, start=1):
                    rut_clean = str(p.get("rut", f"N{i}")).replace(".", "").replace("-", "_")
                    nombre_clean = str(p.get("nombre", f"Socio_{i}")).replace(" ", "_")[:35]
                    f61_filename = f"PHR_6.1_{i:03d}_{rut_clean}_{nombre_clean}.docx"

                    p_firmantes = dict(profesionales_firmantes)
                    p_firmantes["postulante"] = {
                        "nombre": p.get("nombre", ""),
                        "rut": p.get("rut", "")
                    }

                    consolidated = consolidate_postulante_local(
                        p,
                        usar_rsh_en_terreno=False,
                        datos_terreno_proyecto=terr,
                        profesionales_firmantes=p_firmantes
                    )

                    try:
                        doc_buf = io.BytesIO()
                        fill_formulario_phr(
                            io.BytesIO(tpl_bytes),
                            consolidated,
                            doc_buf,
                            egr_name=metadata.get("egr_nombre"),
                            profesionales_firmantes=p_firmantes
                        )
                        zf.writestr(f"01_FORMULARIOS_6.1/{f61_filename}", doc_buf.getvalue())
                    except Exception as e:
                        print(f"Error generando PHR 6.1 para socio {i}: {e}")

            # 2. Generar Informe AT-6 Consolidado
            at6_tpl = TEMPLATES_DIR / "Formato_AT6_Base.docx"
            if at6_tpl.exists():
                with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp_at6:
                    at6_out_path = tmp_at6.name
                textos_custom = {
                    "obs_servicios_basicos": metadata.get("obs_servicios_basicos"),
                    "riesgos_naturales": metadata.get("riesgos_naturales"),
                    "opinion_profesional": metadata.get("opinion_profesional"),
                }
                agg_data = calculate_informe_social_aggregates(
                    postulantes,
                    datos_terreno=terr,
                    nombre_grupo=metadata.get("comite_nombre"),
                    egr_nombre=metadata.get("egr_nombre"),
                    egr_rut=metadata.get("egr_rut"),
                    codigo_expediente=metadata.get("codigo_expediente"),
                    textos_personalizados={k: v for k, v in textos_custom.items() if v},
                )
                fill_informe_social_docx(str(at6_tpl), agg_data, at6_out_path)
                with open(at6_out_path, "rb") as f:
                    zf.writestr("02_DOCUMENTOS_ASOCIADOS/14. AT-6.docx", f.read())
                os.remove(at6_out_path)

            # 3. Generar Nómina Oficial
            nomina_buf = io.BytesIO()
            generar_nomina_docx(postulantes, metadata, nomina_buf)
            zf.writestr("02_DOCUMENTOS_ASOCIADOS/4. NOMINA.docx", nomina_buf.getvalue())

            # 4. Generar Compromiso de Profesionales
            compromiso_buf = io.BytesIO()
            generar_compromiso_docx(metadata, compromiso_buf)
            zf.writestr("02_DOCUMENTOS_ASOCIADOS/3. COMPROMISO PROFESIONALES.docx", compromiso_buf.getvalue())

        zip_buffer.seek(0)
        return zip_buffer, zip_filename
    finally:
        if es_temp and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
