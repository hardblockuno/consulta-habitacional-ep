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

import openpyxl
from collections import Counter
from docx_generator import fill_formulario_phr
from excel_reader import format_rut, read_all_postulantes, detectar_metadatos_comite, detectar_hoja_y_encabezados
from gemini_auditor import consolidate_postulante_local, TERRENO_PROYECTO_CONSOLIDADO
from informe_social_generator import (
    calculate_informe_social_aggregates,
    fill_informe_social_docx,
)


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
    if "PERQUENCO" in comuna_final.upper():
        terr = TERRENO_PROYECTO_CONSOLIDADO
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
    """Analiza una base Excel y retorna las métricas oficiales D.S. 10."""
    tmp_path, es_temp = _guardar_temp_excel(archivo_bytes_o_ruta)
    try:
        postulantes = read_all_postulantes(tmp_path, sheet_name=None)
        meta, terr = _resolver_metadatos_y_terreno(postulantes, tmp_path=tmp_path)

        agg = calculate_informe_social_aggregates(
            postulantes,
            datos_terreno=terr,
            nombre_grupo=meta["comite_nombre"],
            codigo_expediente=meta["codigo_expediente"]
        )
        demo = agg.get("demografia", {})
        req = agg.get("requerimientos_vivienda", {})

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

        resumen = {
            "total_familias": len(postulantes),
            "total_personas": demo.get("tot_personas", 0),
            "hombres": demo.get("tot_hombres", 0),
            "mujeres": demo.get("tot_mujeres", 0),
            "menores_18": demo.get("tot_menores", 0),
            "adultos_mayores": demo.get("tot_mayores", 0),
            "conadi": demo.get("tot_mapuche", 0),
            "familias_conadi": demo.get("familias_mapuche", 0),
            "discapacidad": demo.get("tot_discapacidad", 0),
            "familias_discapacidad": demo.get("familias_con_discapacidad", 0),
            "viviendas_3d": req.get("d3_conjunto", 0),
            "viviendas_base": len(postulantes) - req.get("d3_conjunto", 0),
            "comite_detectado": meta["comite_nombre"],
            "comuna_detectada": meta["comuna"],
            "codigo_expediente_detectado": meta["codigo_expediente"],
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

    target_phrase = f"{comite}, CÓDIGO DE EXPEDIENTE {expediente}, compuesto de {familias} familias de la comuna de {comuna}"
    for p in doc.paragraphs:
        if "COMITÉ DE VIVIENDA" in p.text.upper() or "COMITE DE VIVIENDA" in p.text.upper():
            for run in p.runs:
                if any(k in run.text.upper() for k in ["COMITÉ", "COMITE", "EXPEDIENTE"]):
                    run.text = target_phrase
                    run.font.bold = True

    doc.save(output_path_or_buf)
    return output_path_or_buf


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
            agg_data = calculate_informe_social_aggregates(
                postulantes,
                datos_terreno=terr,
                nombre_grupo=meta.get("comite_nombre"),
                egr_nombre=meta.get("egr_nombre"),
                egr_rut=meta.get("egr_rut"),
                codigo_expediente=meta.get("codigo_expediente"),
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
                agg_data = calculate_informe_social_aggregates(
                    postulantes,
                    datos_terreno=terr,
                    nombre_grupo=metadata.get("comite_nombre"),
                    egr_nombre=metadata.get("egr_nombre"),
                    egr_rut=metadata.get("egr_rut"),
                    codigo_expediente=metadata.get("codigo_expediente"),
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
