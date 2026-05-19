import math
import re
import unicodedata
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
from pathlib import Path

import pandas as pd
from django.db import transaction
from django.utils import timezone

from habitacional.models import (
    Ahorro,
    Alerta,
    CaracterizacionSocial,
    Comite,
    Documento,
    ImportacionExcel,
    Persona,
    Postulacion,
    RSH,
)


class ImportacionError(Exception):
    pass


ORIGEN_IMPORTACION = "importacion_excel"
MAYORIA_EDAD = 18
HIJO_PROXIMO_18_DIAS = 90

COLUMN_ALIASES = {
    "nombre": ["nombre", "nombrecompleto", "postulante", "socio"],
    "rut": ["rut", "run"],
    "correo": ["correo", "email", "mail"],
    "telefono": ["fono", "telefono", "celular", "contacto"],
    "direccion": ["direccion", "domicilio"],
    "sexo": ["sexo", "genero"],
    "estado_civil": ["estadocivil"],
    "nacionalidad": ["nacionalidad", "macionalidad"],
    "etnia": ["etnia", "pueblooriginario"],
    "fecha_nacimiento": ["fecnac", "fechnac", "fechanacimiento", "nacimiento"],
    "edad": ["edad"],
    "discapacidad": ["discapacidad"],
    "neurodivergencia": ["neurodivergencia", "neurodivergente"],
    "numero_cuenta": ["ncuenta", "numerocuenta", "cuenta", "libreta"],
    "banco": ["banco"],
    "rsh": ["rsh", "registrosocial", "tramorhs", "tramo"],
    "minvu_conecta": ["minvuconecta", "minvu"],
    "comuna": ["comuna"],
    "parentesco": ["parentesco", "parentezco"],
    "tipo_familia": ["tipofamilia", "familia"],
    "grupo_familiar": ["grupofamiliar", "grupfam", "grupofam"],
    "integrantes": ["integrantes", "nintegrantes", "cantidadintegrantes"],
    "ahorro": ["ahorro", "saldoahorro", "montoahorro", "ahorrodia", "ahorroal"],
    "cedula_vencimiento": [
        "vencimientocedula",
        "cedulavence",
        "fechavencimientocedula",
        "vencimientoci",
        "civence",
    ],
}


def importar_excel(
    *,
    importacion,
    archivo_path,
    comite_nombre="",
    comuna="",
    ahorro_minimo=Decimal("10"),
):
    try:
        excel = pd.ExcelFile(archivo_path)
        sheet_names = excel.sheet_names
        excel.close()
    except Exception as exc:
        raise ImportacionError(f"No se pudo leer el archivo Excel: {exc}") from exc

    hoja = seleccionar_hoja_base(sheet_names)
    header_index = detectar_fila_encabezados(archivo_path, hoja)
    if header_index is None:
        raise ImportacionError("No se encontro una fila de encabezados con NOMBRE y RUT.")

    df = pd.read_excel(archivo_path, sheet_name=hoja, header=header_index)
    df = limpiar_dataframe(df)
    columnas = list(df.columns)
    mapa = construir_mapa_columnas(columnas)
    validar_columnas_minimas(mapa)

    nombre_comite = comite_nombre or deducir_nombre_comite(importacion.nombre_archivo, hoja)
    comite, _ = Comite.objects.get_or_create(
        nombre=nombre_comite,
        comuna=comuna,
        defaults={"origen": importacion.nombre_archivo},
    )

    importacion.hoja = hoja
    importacion.total_filas = len(df)
    importacion.save(update_fields=["hoja", "total_filas", "actualizado_en"])

    creados = 0
    actualizados = 0
    omitidos = 0
    errores = []

    for posicion, (_, fila) in enumerate(df.iterrows(), start=header_index + 2):
        try:
            with transaction.atomic():
                resultado = procesar_fila(
                    fila=fila,
                    columnas=columnas,
                    mapa=mapa,
                    comite=comite,
                    ahorro_minimo=ahorro_minimo,
                )
        except Exception as exc:
            errores.append({"fila": posicion, "error": str(exc)})
            omitidos += 1
            continue

        if resultado == "creado":
            creados += 1
        elif resultado == "actualizado":
            actualizados += 1
        else:
            omitidos += 1

    importacion.creados = creados
    importacion.actualizados = actualizados
    importacion.omitidos = omitidos
    importacion.errores = errores[:100]
    importacion.estado = (
        ImportacionExcel.ESTADO_COMPLETADA
        if len(errores) < max(len(df), 1)
        else ImportacionExcel.ESTADO_ERROR
    )
    importacion.finalizado_en = timezone.now()
    importacion.save()
    return importacion


def seleccionar_hoja_base(sheet_names):
    normalizadas = [(sheet, normalizar_texto(sheet)) for sheet in sheet_names]
    for sheet, normalized in normalizadas:
        if normalized == "base":
            return sheet
    for sheet, normalized in normalizadas:
        if normalized.startswith("base"):
            return sheet
    for sheet, normalized in normalizadas:
        if "base" in normalized:
            return sheet
    return sheet_names[0]


def detectar_fila_encabezados(archivo_path, hoja):
    muestra = pd.read_excel(archivo_path, sheet_name=hoja, header=None, nrows=12)
    mejor_indice = None
    mejor_score = 0
    for indice, fila in muestra.iterrows():
        valores = [normalizar_texto(valor) for valor in fila.tolist()]
        score = 0
        if any(valor in {"nombre", "nombrecompleto"} for valor in valores):
            score += 3
        if any(valor in {"rut", "run"} for valor in valores):
            score += 3
        if any(valor in {"fono", "telefono", "celular"} for valor in valores):
            score += 1
        if any(valor in {"rsh", "registrosocial"} for valor in valores):
            score += 1
        if score > mejor_score:
            mejor_indice = int(indice)
            mejor_score = score
    return mejor_indice if mejor_score >= 6 else None


def limpiar_dataframe(df):
    df = df.dropna(how="all")
    df = df.loc[:, ~df.columns.astype(str).str.startswith("Unnamed:")]
    columnas = []
    vistos = {}
    for columna in df.columns:
        nombre = str(columna).strip()
        if not nombre:
            nombre = "sin_nombre"
        if nombre in vistos:
            vistos[nombre] += 1
            nombre = f"{nombre}_{vistos[nombre]}"
        else:
            vistos[nombre] = 0
        columnas.append(nombre)
    df.columns = columnas
    return df


def construir_mapa_columnas(columnas):
    mapa = {}
    for clave, aliases in COLUMN_ALIASES.items():
        exclude = ["conyuge"] if clave in {"rut", "fecha_nacimiento", "nacionalidad"} else []
        columna = encontrar_columna(columnas, aliases, exclude=exclude)
        if columna:
            mapa[clave] = columna
    return mapa


def validar_columnas_minimas(mapa):
    faltantes = [campo for campo in ["nombre", "rut"] if campo not in mapa]
    if faltantes:
        raise ImportacionError(
            "Faltan columnas obligatorias: " + ", ".join(faltantes).upper()
        )


def encontrar_columna(columnas, aliases, exclude=None):
    exclude = exclude or []
    normalizadas = [(columna, normalizar_texto(columna)) for columna in columnas]
    alias_norm = [normalizar_texto(alias) for alias in aliases]
    exclude_norm = [normalizar_texto(item) for item in exclude]

    candidatas = []
    for columna, normalized in normalizadas:
        if any(item in normalized for item in exclude_norm):
            continue
        candidatas.append((columna, normalized))

    for columna, normalized in candidatas:
        if normalized in alias_norm:
            return columna
    for columna, normalized in candidatas:
        if any(len(alias) > 3 and normalized.startswith(alias) for alias in alias_norm):
            return columna
    for columna, normalized in candidatas:
        if any(len(alias) > 3 and alias in normalized for alias in alias_norm):
            return columna
    return None


def procesar_fila(*, fila, columnas, mapa, comite, ahorro_minimo):
    desplazamiento = detectar_desplazamiento(fila, columnas, mapa)

    def valor(campo):
        columna = mapa.get(campo)
        if not columna:
            return None
        return valor_columna(fila, columnas, columna, desplazamiento)

    nombre = limpiar_string(valor("nombre"))
    rut = normalizar_rut(valor("rut"))
    if not nombre or not rut:
        return "omitido"
    if normalizar_texto(nombre) in {"nombre", "basecomite"}:
        return "omitido"

    fecha_nacimiento = parse_fecha(valor("fecha_nacimiento"))
    edad = parse_entero(valor("edad"))
    if fecha_nacimiento:
        edad = calcular_edad(fecha_nacimiento)
    persona_mayor = bool(edad is not None and edad >= 60)
    discapacidad = parse_booleano(valor("discapacidad"))
    neurodivergencia = parse_booleano(valor("neurodivergencia"))

    datos = {
        "nombre": nombre,
        "rut": rut,
        "comite": comite,
        "correo": limpiar_string(valor("correo")),
        "telefono": limpiar_string(valor("telefono")),
        "direccion": limpiar_string(valor("direccion")),
        "sexo": limpiar_string(valor("sexo")),
        "estado_civil": limpiar_string(valor("estado_civil")),
        "nacionalidad": limpiar_string(valor("nacionalidad")),
        "etnia": limpiar_string(valor("etnia")),
        "fecha_nacimiento": fecha_nacimiento,
        "edad": edad,
        "persona_mayor": persona_mayor,
        "discapacidad": discapacidad,
        "neurodivergencia": neurodivergencia,
        "datos_originales": serializar_fila(fila),
    }

    persona, creado = Persona.objects.update_or_create(
        rut=rut,
        defaults=datos,
    )

    hijos = extraer_hijos(fila)
    actualizar_relaciones(persona, valor, ahorro_minimo, hijos)
    generar_alertas(persona, valor, hijos)
    persona.actualizar_estado_general()

    return "creado" if creado else "actualizado"


def detectar_desplazamiento(fila, columnas, mapa):
    nombre_col = mapa.get("nombre")
    rut_col = mapa.get("rut")
    if not nombre_col or not rut_col:
        return 0
    nombre_valor = fila.get(nombre_col)
    rut_valor = fila.get(rut_col)
    siguiente_rut = valor_columna(fila, columnas, rut_col, 1)
    if es_numero_orden(nombre_valor) and not parece_rut(rut_valor) and parece_rut(siguiente_rut):
        return 1
    return 0


def valor_columna(fila, columnas, columna, desplazamiento):
    try:
        indice = columnas.index(columna) + desplazamiento
    except ValueError:
        return None
    if indice < 0 or indice >= len(columnas):
        return None
    return fila.get(columnas[indice])


def actualizar_relaciones(persona, valor, ahorro_minimo, hijos):
    comuna = limpiar_string(valor("comuna"))
    parentesco = limpiar_string(valor("parentesco"))
    tipo_familia = limpiar_string(valor("tipo_familia"))
    grupo_familiar = limpiar_string(valor("grupo_familiar"))
    integrantes = parse_entero(valor("integrantes"))
    if comuna or parentesco or tipo_familia or grupo_familiar or integrantes is not None or hijos:
        CaracterizacionSocial.objects.update_or_create(
            persona=persona,
            defaults={
                "comuna": comuna,
                "parentesco": parentesco,
                "tipo_familia": tipo_familia,
                "grupo_familiar": grupo_familiar,
                "integrantes": integrantes,
                "hijos": hijos,
            },
        )

    rsh_porcentaje = parse_decimal(valor("rsh"))
    RSH.objects.update_or_create(
        persona=persona,
        defaults={
            "porcentaje": rsh_porcentaje,
            "tramo": limpiar_string(valor("rsh")),
            "es_preferente": bool(rsh_porcentaje is not None and rsh_porcentaje <= 40),
        },
    )

    ahorro_monto = parse_decimal(valor("ahorro"))
    Ahorro.objects.update_or_create(
        persona=persona,
        defaults={
            "numero_cuenta": limpiar_string(valor("numero_cuenta")),
            "banco": limpiar_string(valor("banco")),
            "monto_actual": ahorro_monto,
            "ahorro_minimo": ahorro_minimo,
            "insuficiente": bool(ahorro_monto is not None and ahorro_monto < ahorro_minimo),
        },
    )

    minvu_conecta = parse_decimal(valor("minvu_conecta"))
    Postulacion.objects.update_or_create(
        persona=persona,
        defaults={
            "minvu_conecta": minvu_conecta,
            "estado": "",
            "programa": "",
        },
    )

    fecha_vencimiento = parse_fecha(valor("cedula_vencimiento"))
    if fecha_vencimiento:
        estado = estado_documento_por_fecha(fecha_vencimiento)
        Documento.objects.update_or_create(
            persona=persona,
            tipo=Documento.TIPO_CEDULA,
            defaults={
                "estado": estado,
                "fecha_vencimiento": fecha_vencimiento,
                "observaciones": "Detectado desde importacion Excel.",
            },
        )


def generar_alertas(persona, valor, hijos=None):
    Alerta.objects.filter(persona=persona, origen=ORIGEN_IMPORTACION).delete()

    fecha_vencimiento = parse_fecha(valor("cedula_vencimiento"))
    if fecha_vencimiento:
        hoy = timezone.localdate()
        dias = (fecha_vencimiento - hoy).days
        if dias < 0:
            crear_alerta(
                persona,
                Alerta.TIPO_DOCUMENTAL,
                Alerta.SEVERIDAD_CRITICA,
                "Cedula vencida",
                f"Cedula vencida el {fecha_vencimiento.isoformat()}.",
            )
        elif dias <= 30:
            crear_alerta(
                persona,
                Alerta.TIPO_DOCUMENTAL,
                Alerta.SEVERIDAD_PREVENTIVA,
                "Cedula por vencer",
                f"Cedula vence el {fecha_vencimiento.isoformat()}.",
            )

    if persona.discapacidad:
        crear_alerta(
            persona,
            Alerta.TIPO_DOCUMENTAL,
            Alerta.SEVERIDAD_PREVENTIVA,
            "Revisar respaldo discapacidad",
            "La persona registra discapacidad; validar certificado o antecedente.",
            impacta_estado=False,
        )

    for hijo in hijos or []:
        if not hijo.get("requiere_revision_documental"):
            continue
        crear_alerta(
            persona,
            Alerta.TIPO_DOCUMENTAL,
            Alerta.SEVERIDAD_PREVENTIVA,
            "Revisar hijo/a por mayoria de edad",
            detalle_revision_hijo(hijo),
            impacta_estado=False,
        )


def crear_alerta(persona, tipo, severidad, titulo, detalle, impacta_estado=True):
    Alerta.objects.create(
        persona=persona,
        tipo=tipo,
        severidad=severidad,
        titulo=titulo,
        detalle=detalle,
        impacta_estado=impacta_estado,
        origen=ORIGEN_IMPORTACION,
    )


def estado_documento_por_fecha(fecha_vencimiento):
    hoy = timezone.localdate()
    if fecha_vencimiento < hoy:
        return Documento.ESTADO_VENCIDO
    if fecha_vencimiento <= hoy + timedelta(days=30):
        return Documento.ESTADO_POR_VENCER
    return Documento.ESTADO_VIGENTE


def extraer_hijos(fila):
    hijos_por_indice = {}
    for columna, raw_value in fila.to_dict().items():
        valor = limpiar_string(raw_value)
        if not valor:
            continue
        normalized = normalizar_texto(columna)
        if not es_columna_hijo(normalized):
            continue
        campo = campo_columna_hijo(normalized)
        if not campo:
            continue
        indice = indice_columna_hijo(normalized)
        hijos_por_indice.setdefault(indice, {})[campo] = valor
    return [
        hijo
        for hijo in (
            normalizar_hijo(datos, index)
            for index, datos in enumerate(hijos_por_indice.values(), start=1)
        )
        if hijo
    ]


def normalizar_hijo(datos, index):
    nombre = limpiar_string(datos.get("nombre"))
    rut = normalizar_rut(datos.get("rut")) or limpiar_string(datos.get("rut"))
    descripcion = limpiar_string(datos.get("descripcion"))
    fecha_nacimiento = parse_fecha(datos.get("fecha_nacimiento"))
    edad = calcular_edad(fecha_nacimiento) if fecha_nacimiento else parse_entero(datos.get("edad"))
    fecha_cumple_18 = sumar_anios(fecha_nacimiento, MAYORIA_EDAD) if fecha_nacimiento else None
    dias_para_18 = (fecha_cumple_18 - timezone.localdate()).days if fecha_cumple_18 else None
    estado_mayoria_edad = estado_mayoria_edad_hijo(
        edad=edad,
        dias_para_18=dias_para_18,
        fecha_cumple_18=fecha_cumple_18,
    )

    if (
        not nombre
        and not rut
        and (not descripcion or descripcion_hijo_generica(descripcion))
        and edad is None
        and not fecha_nacimiento
    ):
        return None

    return {
        "id": f"hijo-{index}",
        "nombre": nombre,
        "rut": rut,
        "descripcion": descripcion,
        "fecha_nacimiento": fecha_nacimiento.isoformat() if fecha_nacimiento else "",
        "edad": edad,
        "fecha_cumple_18": fecha_cumple_18.isoformat() if fecha_cumple_18 else "",
        "dias_para_18": dias_para_18,
        "estado_mayoria_edad": estado_mayoria_edad,
        "requiere_revision_documental": requiere_revision_documental_hijo(estado_mayoria_edad),
    }


def es_columna_hijo(normalized):
    return any(term in normalized for term in ["hijo", "hija", "carga", "dependiente"])


def campo_columna_hijo(normalized):
    if "rut" in normalized or "run" in normalized:
        return "rut"
    if "nombre" in normalized:
        return "nombre"
    if (
        "fecnac" in normalized
        or "fechnac" in normalized
        or "fechanacimiento" in normalized
        or "nacimiento" in normalized
        or ("fecha" in normalized and "nac" in normalized)
    ):
        return "fecha_nacimiento"
    if "edad" in normalized:
        return "edad"
    if normalized in {"hijo", "hija", "hijos", "hijas"}:
        return "descripcion"
    return None


def indice_columna_hijo(normalized):
    match = re.search(r"\d+", normalized)
    return match.group(0) if match else "1"


def descripcion_hijo_generica(valor):
    texto = normalizar_texto(valor)
    return texto in {"si", "no", "s", "n", "true", "false"} or parse_decimal(valor) is not None


def estado_mayoria_edad_hijo(*, edad, dias_para_18, fecha_cumple_18):
    if fecha_cumple_18 and dias_para_18 is not None:
        if dias_para_18 < 0:
            return "cumplio_18"
        if dias_para_18 == 0:
            return "cumple_hoy"
        if dias_para_18 <= HIJO_PROXIMO_18_DIAS:
            return "proximo_18"
        return "sin_revision"
    if edad is not None and edad >= MAYORIA_EDAD:
        return "cumplio_18"
    if edad == MAYORIA_EDAD - 1:
        return "proximo_sin_fecha"
    return "sin_revision"


def requiere_revision_documental_hijo(estado_mayoria_edad):
    return estado_mayoria_edad in {
        "cumplio_18",
        "cumple_hoy",
        "proximo_18",
        "proximo_sin_fecha",
    }


def sumar_anios(fecha, anios):
    try:
        return fecha.replace(year=fecha.year + anios)
    except ValueError:
        return fecha.replace(year=fecha.year + anios, day=28)


def detalle_revision_hijo(hijo):
    nombre = hijo.get("nombre") or hijo.get("descripcion") or "Hijo/a o carga familiar"
    estado = hijo.get("estado_mayoria_edad")
    if estado == "cumple_hoy":
        return f"{nombre} cumple 18 anos hoy; revisar actualizacion documental de la postulacion."
    if estado == "proximo_18":
        return (
            f"{nombre} cumple 18 anos el {hijo.get('fecha_cumple_18')}; "
            "revisar documentacion antes del cambio."
        )
    if estado == "proximo_sin_fecha":
        return f"{nombre} registra 17 anos sin fecha exacta; revisar fecha de nacimiento y documentacion."
    return f"{nombre} ya registra 18 anos o mas; revisar actualizacion documental de la postulacion."


def deducir_nombre_comite(nombre_archivo, hoja):
    nombre = Path(nombre_archivo).stem or hoja
    nombre = re.sub(r"\b(BASE|NOMINA|NOMINA DE SOCIOS|POSTULANTES|COMITE)\b", " ", nombre, flags=re.I)
    nombre = re.sub(r"\b\d{1,2}[-_.]\d{1,2}[-_.]\d{2,4}\b", " ", nombre)
    nombre = re.sub(r"\b\d{4}\b", " ", nombre)
    nombre = re.sub(r"\s+", " ", nombre).strip(" -_,")
    return nombre.upper() if nombre else "COMITE SIN NOMBRE"


def normalizar_texto(valor):
    texto = limpiar_string(valor).lower()
    texto = "".join(
        char
        for char in unicodedata.normalize("NFKD", texto)
        if not unicodedata.combining(char)
    )
    return re.sub(r"[^a-z0-9]+", "", texto)


def limpiar_string(valor):
    if valor is None:
        return ""
    if isinstance(valor, float) and math.isnan(valor):
        return ""
    if pd.isna(valor):
        return ""
    if isinstance(valor, float) and valor.is_integer():
        return str(int(valor))
    texto = str(valor).strip()
    if texto.endswith(".0") and texto[:-2].replace(".", "").isdigit():
        texto = texto[:-2]
    return texto.strip()


def normalizar_rut(valor):
    texto = limpiar_string(valor).upper()
    if not texto:
        return ""
    tuvo_guion = "-" in texto
    limpio = re.sub(r"[^0-9K]", "", texto)
    if not limpio:
        return ""
    if tuvo_guion and len(limpio) >= 2:
        cuerpo = limpio[:-1]
        dv = limpio[-1]
    elif len(limpio) > 8:
        cuerpo = limpio[:-1]
        dv = limpio[-1]
    else:
        cuerpo = limpio
        dv = calcular_dv(cuerpo)
    if not cuerpo.isdigit() or not dv:
        return ""
    return f"{int(cuerpo)}-{dv}"


def calcular_dv(cuerpo):
    if not str(cuerpo).isdigit():
        return ""
    suma = 0
    multiplicador = 2
    for digito in reversed(str(cuerpo)):
        suma += int(digito) * multiplicador
        multiplicador = 2 if multiplicador == 7 else multiplicador + 1
    resto = 11 - (suma % 11)
    if resto == 11:
        return "0"
    if resto == 10:
        return "K"
    return str(resto)


def parece_rut(valor):
    texto = limpiar_string(valor).upper()
    limpio = re.sub(r"[^0-9K]", "", texto)
    return bool(re.fullmatch(r"\d{7,9}K?", limpio))


def es_numero_orden(valor):
    numero = parse_decimal(valor)
    return bool(numero is not None and Decimal("0") < numero < Decimal("10000"))


def parse_booleano(valor):
    texto = normalizar_texto(valor)
    if not texto:
        return False
    positivos = {"si", "s", "true", "1", "postulante", "acreditado", "acreditada"}
    negativos = {"no", "n", "false", "0", "ninguna", "ninguno"}
    if texto in negativos:
        return False
    return texto in positivos or texto.startswith("si")


def parse_decimal(valor):
    texto = limpiar_string(valor)
    if not texto:
        return None
    texto = texto.replace("%", "").replace(",", ".")
    match = re.search(r"-?\d+(\.\d+)?", texto)
    if not match:
        return None
    try:
        return Decimal(match.group(0)).quantize(Decimal("0.01"))
    except InvalidOperation:
        return None


def parse_entero(valor):
    decimal = parse_decimal(valor)
    if decimal is None:
        return None
    try:
        return int(decimal)
    except (TypeError, ValueError):
        return None


def parse_fecha(valor):
    if valor is None or (isinstance(valor, float) and math.isnan(valor)):
        return None
    if isinstance(valor, datetime):
        return valor.date()
    if isinstance(valor, date):
        return valor
    texto = limpiar_string(valor)
    if not texto:
        return None
    iso = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", texto)
    if iso:
        try:
            return date(int(iso.group(1)), int(iso.group(2)), int(iso.group(3)))
        except ValueError:
            return None
    fecha = pd.to_datetime(texto, dayfirst=True, errors="coerce")
    if pd.isna(fecha):
        return None
    return fecha.date()


def calcular_edad(fecha_nacimiento):
    hoy = timezone.localdate()
    edad = hoy.year - fecha_nacimiento.year
    if (hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day):
        edad -= 1
    return max(edad, 0)


def serializar_fila(fila):
    datos = {}
    for clave, valor in fila.to_dict().items():
        if valor is None or (isinstance(valor, float) and math.isnan(valor)):
            datos[str(clave)] = None
        elif isinstance(valor, (datetime, date)):
            datos[str(clave)] = valor.isoformat()
        elif pd.isna(valor):
            datos[str(clave)] = None
        else:
            datos[str(clave)] = limpiar_string(valor)
    return datos
