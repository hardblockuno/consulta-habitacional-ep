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

from docx_generator import fill_formulario_phr
from excel_reader import format_rut, read_all_postulantes
from gemini_auditor import consolidate_postulante_local
from informe_social_generator import (
    calculate_informe_social_aggregates,
    fill_informe_social_docx,
)


def _guardar_temp_excel(archivo_bytes_o_ruta: Any) -> Tuple[str, bool]:
    """Retorna la ruta al archivo Excel y un booleano indicando si es temporal."""
    if isinstance(archivo_bytes_o_ruta, (str, Path)) and os.path.exists(archivo_bytes_o_ruta):
        return str(archivo_bytes_o_ruta), False
    
    # Es un archivo en memoria (UploadedFile o BytesIO)
    suffix = ".xlsx"
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
        
        agg = calculate_informe_social_aggregates(postulantes)
        demo = agg.get("demografia", {})
        req = agg.get("requerimientos_vivienda", {})

        postulantes_list = []
        for i, p in enumerate(postulantes):
            c = consolidate_postulante_local(p)
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
            "postulantes": postulantes_list,
        }
        return resumen
    finally:
        if es_temp and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


def generar_nomina_docx(postulantes: List[Dict[str, Any]], metadata: Dict[str, Any], output_path: str) -> str:
    """Genera la nómina oficial numerada 1 a N alfabética."""
    tpl_path = TEMPLATES_DIR / "Formato_Nomina_Base.docx"
    if tpl_path.exists():
        doc = docx.Document(str(tpl_path))
    else:
        doc = docx.Document()
        doc.add_heading("NÓMINA OFICIAL DE POSTULANTES", 0)

    # Actualizar encabezados si existen
    nombre_grupo = metadata.get("comite_nombre", "COMITÉ DE VIVIENDA ECOBARRIOS DE PERQUENCO").upper()
    for p in doc.paragraphs:
        if "COMITÉ" in p.text.upper() or "COMITE" in p.text.upper():
            p.text = f"PROYECTO: {nombre_grupo}"
            p.runs[0].font.name = "Arial"
            p.runs[0].font.size = Pt(11)
            p.runs[0].font.bold = True

    # Si hay tabla en la plantilla, llenarla
    if doc.tables:
        t = doc.tables[0]
        # Limpiar filas existentes excepto encabezado
        while len(t.rows) > 1:
            t._tbl.remove(t.rows[-1]._tr)
        
        # Ordenar alfabéticamente
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

    doc.save(output_path)
    return output_path


def generar_compromiso_docx(metadata: Dict[str, Any], output_path: str) -> str:
    """Genera la declaración jurada de compromiso de profesionales."""
    tpl_path = TEMPLATES_DIR / "Formato_Compromiso_Base.docx"
    if tpl_path.exists():
        doc = docx.Document(str(tpl_path))
    else:
        doc = docx.Document()
        doc.add_heading("DECLARACIÓN JURADA DE COMPROMISO DE PROFESIONALES", 0)

    comite = metadata.get("comite_nombre", "COMITÉ DE VIVIENDA ECOBARRIOS DE PERQUENCO").upper()
    expediente = metadata.get("codigo_expediente", "42005")
    comuna = metadata.get("comuna", "PERQUENCO").upper()
    familias = str(metadata.get("total_familias", 155))

    # Reemplazos dinámicos en párrafos
    target_phrase = f"{comite}, CÓDIGO DE EXPEDIENTE {expediente}, compuesto de {familias} familias de la comuna de {comuna}"
    for p in doc.paragraphs:
        if "COMITÉ DE VIVIENDA" in p.text.upper() or "COMITE DE VIVIENDA" in p.text.upper():
            # Actualizar mención del comité
            for run in p.runs:
                if any(k in run.text.upper() for k in ["COMITÉ", "COMITE", "EXPEDIENTE"]):
                    run.text = target_phrase
                    run.font.bold = True

    doc.save(output_path)
    return output_path


def generar_expediente_zip(archivo_bytes_o_ruta: Any, metadata: Dict[str, Any]) -> Tuple[io.BytesIO, str]:
    """Genera en lote todos los archivos del expediente y los empaqueta en un ZIP."""
    tmp_path, es_temp = _guardar_temp_excel(archivo_bytes_o_ruta)
    try:
        postulantes = read_all_postulantes(tmp_path, sheet_name=None)
        
        metadata["total_familias"] = len(postulantes)
        comite_slug = metadata.get("comite_nombre", "Ecobarrios").replace(" ", "_")
        zip_filename = f"Expediente_{comite_slug}.zip"

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            with tempfile.TemporaryDirectory() as tmpdir:
                # 1. Generar Formularios 6.1 Individuales
                f61_tpl = TEMPLATES_DIR / "Formato_6.1_Base.docx"
                if f61_tpl.exists():
                    for i, p in enumerate(postulantes, start=1):
                        rut_clean = str(p.get("rut", f"N{i}")).replace(".", "").replace("-", "_")
                        nombre_clean = str(p.get("nombre", f"Socio_{i}")).replace(" ", "_")[:35]
                        f61_filename = f"PHR_6.1_{i:03d}_{rut_clean}_{nombre_clean}.docx"
                        f61_out_path = os.path.join(tmpdir, f61_filename)

                        # Preparar estructura de datos
                        data_f61 = {
                            "tabla_1": {
                                "titular_nombre": str(p.get("nombre", "")).upper(),
                                "titular_rut": format_rut(p.get("rut", "")),
                                "titular_fecha_nac": str(p.get("fecha_nacimiento", "")),
                                "titular_estado_civil": str(p.get("estado_civil", "SOLTERO/A")).upper(),
                                "titular_sexo": str(p.get("sexo", "F")).upper(),
                                "titular_telefono": str(p.get("telefono", "")),
                            },
                            "tabla_2": {
                                "direccion": str(p.get("direccion", "S/N")).upper(),
                                "comuna": metadata.get("comuna", "PERQUENCO").upper(),
                                "rsh_porcentaje": str(p.get("rsh", 40)),
                            },
                            "tabla_5": {
                                "requiere_3d": p.get("requiere_3d", False),
                                "recinto_complementario": True,
                            },
                        }
                        try:
                            fill_formulario_phr(str(f61_tpl), data_f61, f61_out_path, egr_name=metadata.get("egr_nombre"))
                            zf.write(f61_out_path, f"01_FORMULARIOS_6.1/{f61_filename}")
                        except Exception:
                            pass

                # 2. Generar Informe AT-6 Consolidado
                at6_tpl = TEMPLATES_DIR / "Formato_AT6_Base.docx"
                if at6_tpl.exists():
                    at6_out_path = os.path.join(tmpdir, "14. AT-6.docx")
                    agg_data = calculate_informe_social_aggregates(
                        postulantes,
                        nombre_grupo=metadata.get("comite_nombre"),
                        egr_nombre=metadata.get("egr_nombre"),
                        egr_rut=metadata.get("egr_rut"),
                    )
                    fill_informe_social_docx(str(at6_tpl), agg_data, at6_out_path)
                    zf.write(at6_out_path, "02_DOCUMENTOS_ASOCIADOS/14. AT-6.docx")

                # 3. Generar Nómina Oficial
                nomina_out_path = os.path.join(tmpdir, "4. NOMINA.docx")
                generar_nomina_docx(postulantes, metadata, nomina_out_path)
                zf.write(nomina_out_path, "02_DOCUMENTOS_ASOCIADOS/4. NOMINA.docx")

                # 4. Generar Compromiso de Profesionales
                compromiso_out_path = os.path.join(tmpdir, "3. COMPROMISO PROFESIONALES.docx")
                generar_compromiso_docx(metadata, compromiso_out_path)
                zf.write(compromiso_out_path, "02_DOCUMENTOS_ASOCIADOS/3. COMPROMISO PROFESIONALES.docx")

        zip_buffer.seek(0)
        return zip_buffer, zip_filename
    finally:
        if es_temp and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
