import math
import numbers
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
    Observacion,
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
    "nombre": [
        "nombre",
        "nombrecompleto",
        "nombrepostulante",
        "nombrespostulante",
        "nombresocio",
        "nombresocia",
        "nombretitular",
        "nombrebeneficiario",
        "postulante",
        "socio",
        "titular",
        "beneficiario",
    ],
    "nombres": ["nombres", "primernombre", "segundonombre", "nombrespostulante", "nombressocio"],
    "apellido_paterno": ["apellidopaterno", "apaterno", "paterno", "primerapellido"],
    "apellido_materno": ["apellidomaterno", "amaterno", "materno", "segundoapellido"],
    "apellidos": ["apellidos", "apellido", "apellidospostulante", "apellidossocio"],
    "rut": [
        "rut",
        "run",
        "rutpostulante",
        "runpostulante",
        "rutsocio",
        "runsocio",
        "ruttitular",
        "runtitular",
        "rutbeneficiario",
        "runbeneficiario",
        "cedulaidentidad",
        "ci",
        "documentoidentidad",
        "nrodocumento",
        "numerodocumento",
        "numdocumento",
        "dni",
    ],
    "correo": ["correo", "email", "mail", "correoelectronico", "e-mail"],
    "telefono": ["fono", "telefono", "telefonocelular", "celular", "contacto", "whatsapp", "ncontacto"],
    "direccion": ["direccion", "domicilio", "direccionparticular", "domicilioparticular"],
    "sexo": ["sexo", "genero"],
    "estado_civil": ["estadocivil", "ecivil"],
    "nacionalidad": ["nacionalidad", "macionalidad", "paisorigen"],
    "etnia": [
        "etnia",
        "pueblo",
        "pueblooriginario",
        "puebloindigena",
        "pueblonativo",
        "perteneceapueblooriginario",
        "pertenenciapueblooriginario",
        "calidadindigena",
        "indigena",
        "mapuche",
        "aymara",
    ],
    "fecha_nacimiento": [
        "fecnac",
        "fechnac",
        "fnac",
        "fechanac",
        "fechanacimiento",
        "fnacimiento",
        "nacimiento",
        "fechadenacimiento",
    ],
    "edad": ["edad", "edadpostulante"],
    "discapacidad": [
        "discapacidad",
        "discapacitado",
        "discapacitada",
        "credencialdiscapacidad",
        "registrodiscapacidad",
        "movilidadreducida",
    ],
    "neurodivergencia": ["neurodivergencia", "neurodivergente", "tea", "trastornoespectroautista"],
    "numero_cuenta": ["ncuenta", "numerocuenta", "cuenta", "libreta", "nlibreta", "nrolibreta"],
    "banco": ["banco", "institucionfinanciera", "entidadfinanciera"],
    "rsh": [
        "rsh",
        "registrosocial",
        "registrosocialhogares",
        "registrosocialdehogares",
        "tramorhs",
        "tramo",
        "tramorsh",
        "porcentajersh",
        "calificacionsocioeconomica",
        "cse",
    ],
    "minvu_conecta": ["minvuconecta", "minvu", "foliominvu", "codigominvu"],
    "comuna": ["comuna", "comunapostulacion", "comunaproyecto", "comunadomicilio"],
    "parentesco": ["parentesco", "parentezco"],
    "tipo_familia": ["tipofamilia", "familia", "tipologiadefamilia", "tipologiafamilia"],
    "grupo_familiar": [
        "grupofamiliar",
        "grupfam",
        "grupofam",
        "grupofamiliarsocio",
        "grupofamiliarpostulante",
        "grupofamiliartitular",
        "grupofamiliarbeneficiario",
        "grupo",
        "gf",
        "ngf",
        "grupohogar",
        "hogarfamiliar",
        "nucleofamiliar",
        "nucleohogar",
        "nucleofam",
        "nucleofamilia",
        "composicionfamiliar",
        "composiciongrupofamiliar",
        "composicionhogar",
        "conformacionfamiliar",
        "conformaciongrupofamiliar",
        "estructurafamiliar",
        "unidadfamiliar",
        "cantidadgrupofamiliar",
        "numerogrupofamiliar",
        "nrogrupofamiliar",
        "totalgrupofamiliar",
        "tamanogrupofamiliar",
        "tamanohogar",
        "tamanonucleo",
    ],
    "integrantes": [
        "integrantes",
        "nintegrantes",
        "nrointegrantes",
        "numerointegrantes",
        "cantidadintegrantes",
        "totalintegrantes",
        "integrantesgrupofamiliar",
        "integrantesgrupo",
        "integrantesfamilia",
        "integrantesfamiliares",
        "integranteshogar",
        "integrantesnucleo",
        "miembros",
        "nmiembros",
        "nromiembros",
        "numeromiembros",
        "cantidadmiembros",
        "totalmiembros",
        "personasgrupo",
        "personasfamilia",
        "personasfamiliares",
        "personashogar",
        "personasnucleo",
        "npersonas",
        "nropersonas",
        "numeropersonas",
        "cantidadpersonas",
        "totalpersonas",
        "grupofamiliar",
        "grupfam",
        "grupofam",
        "gf",
        "ngf",
        "numerogrupofamiliar",
        "nrogrupofamiliar",
        "cantidadgrupofamiliar",
        "totalgrupofamiliar",
        "tamanogrupofamiliar",
        "tamanohogar",
        "tamanonucleo",
        "nucleofamiliar",
        "nucleohogar",
        "nucleofam",
    ],
    "ahorro": ["ahorro", "saldoahorro", "montoahorro", "ahorrodia", "ahorroal", "saldoctaahorro"],
    "cedula_vencimiento": [
        "vencimientocedula",
        "cedulavence",
        "fechavencimientocedula",
        "vencimientoci",
        "civence",
        "fechavencimientoci",
        "fechavencimiento",
        "vencimientodocumento",
        "fechacaducidad",
        "caducidadci",
        "vigenciaci",
        "fechavigencia",
        "fechaexpiracionci",
        "venci",
    ],
}

MAIN_PERSON_EXCLUDES = [
    "conyuge",
    "pareja",
    "hijo",
    "hija",
    "carga",
    "dependiente",
    "menor",
    "integrante",
    "familiar",
]

COLUMN_EXCLUDES = {
    "nombre": MAIN_PERSON_EXCLUDES + ["rut", "run", "cedula", "documento", "telefono", "fono", "correo", "mail", "fecha", "edad"],
    "nombres": MAIN_PERSON_EXCLUDES + ["rut", "run", "cedula", "documento", "telefono", "fono", "correo", "mail", "fecha", "edad"],
    "apellido_paterno": MAIN_PERSON_EXCLUDES,
    "apellido_materno": MAIN_PERSON_EXCLUDES,
    "apellidos": MAIN_PERSON_EXCLUDES,
    "rut": MAIN_PERSON_EXCLUDES + ["vencimiento", "vence", "vigencia", "caducidad", "expiracion", "fecha", "nombre", "apellido"],
    "fecha_nacimiento": MAIN_PERSON_EXCLUDES + ["vencimiento", "vence", "vigencia", "caducidad", "expiracion", "cedula", "ci"],
    "nacionalidad": MAIN_PERSON_EXCLUDES,
    "tipo_familia": ["grupo", "integrantes", "miembros", "personas", "nucleo", "hogar", "cantidad", "numero", "nro", "total", "tamano"],
    "cedula_vencimiento": ["hijo", "hija", "carga", "dependiente", "conyuge", "pareja"],
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
        raise ImportacionError("No se encontró una fila de encabezados con RUT/RUN y nombre.")

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


def importar_observaciones_excel(
    *,
    importacion,
    archivo_path,
    comite_nombre="",
):
    try:
        excel = pd.ExcelFile(archivo_path)
        sheet_names = excel.sheet_names
        excel.close()
    except Exception as exc:
        raise ImportacionError(f"No se pudo leer el archivo Excel: {exc}") from exc

    hoja = seleccionar_hoja_base(sheet_names)
    header_index = detectar_fila_encabezados_observaciones(archivo_path, hoja)
    if header_index is None:
        raise ImportacionError(
            "No se encontró una fila de encabezados con RUT/RUN para asociar observaciones."
        )

    df = pd.read_excel(archivo_path, sheet_name=hoja, header=header_index)
    df = limpiar_dataframe(df)
    columnas = list(df.columns)
    mapa = construir_mapa_observaciones(columnas)
    if not mapa.get("rut"):
        raise ImportacionError("El archivo de observaciones debe incluir una columna RUT/RUN.")

    importacion.hoja = hoja
    importacion.total_filas = len(df)
    importacion.save(update_fields=["hoja", "total_filas", "actualizado_en"])

    actualizados = 0
    omitidos = 0
    errores = []

    for posicion, (_, fila) in enumerate(df.iterrows(), start=header_index + 2):
        try:
            with transaction.atomic():
                resultado = procesar_fila_observaciones(
                    fila=fila,
                    columnas=columnas,
                    mapa=mapa,
                    comite_nombre=comite_nombre,
                )
        except Exception as exc:
            errores.append({"fila": posicion, "error": str(exc)})
            omitidos += 1
            continue

        if resultado == "actualizado":
            actualizados += 1
        else:
            omitidos += 1

    importacion.creados = 0
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
    muestra = pd.read_excel(archivo_path, sheet_name=hoja, header=None, nrows=30)
    mejor_indice = None
    mejor_score = 0
    for indice, fila in muestra.iterrows():
        columnas = encabezados_unicos(fila.tolist())
        mapa = construir_mapa_columnas(columnas)
        score = puntuar_fila_encabezados(columnas, mapa)
        if score > mejor_score:
            mejor_indice = int(indice)
            mejor_score = score
    return mejor_indice if mejor_score >= 8 else None


def detectar_fila_encabezados_observaciones(archivo_path, hoja):
    muestra = pd.read_excel(archivo_path, sheet_name=hoja, header=None, nrows=35)
    mejor_indice = None
    mejor_score = 0
    for indice, fila in muestra.iterrows():
        columnas = encabezados_unicos(fila.tolist())
        mapa = construir_mapa_observaciones(columnas)
        if mapa.get("rut"):
            score = 5 + min(len(mapa.get("observaciones", [])), 4) * 2
            score += len(mapa.get("correcciones", {}))
        else:
            score = 0
        if score > mejor_score:
            mejor_indice = int(indice)
            mejor_score = score
    return mejor_indice if mejor_score >= 5 else None


def encabezados_unicos(valores):
    columnas = []
    vistos = {}
    for indice, valor in enumerate(valores, start=1):
        nombre = limpiar_string(valor) or f"sin_nombre_{indice}"
        if nombre in vistos:
            vistos[nombre] += 1
            nombre = f"{nombre}_{vistos[nombre]}"
        else:
            vistos[nombre] = 0
        columnas.append(nombre)
    return columnas


def puntuar_fila_encabezados(columnas, mapa):
    columnas_con_dato = [
        columna
        for columna in columnas
        if normalizar_texto(columna) and not normalizar_texto(columna).startswith("sinnombre")
    ]
    if len(columnas_con_dato) < 2:
        return 0

    score = 0
    if "rut" in mapa:
        score += 4
    if "nombre" in mapa:
        score += 4
    elif tiene_columnas_nombre_separado(mapa):
        score += 4

    for campo in [
        "fecha_nacimiento",
        "telefono",
        "correo",
        "rsh",
        "cedula_vencimiento",
        "discapacidad",
        "grupo_familiar",
        "integrantes",
        "comuna",
    ]:
        if campo in mapa:
            score += 1

    return score


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
        exclude = COLUMN_EXCLUDES.get(clave, [])
        columna = encontrar_columna(columnas, aliases, exclude=exclude)
        if columna:
            mapa[clave] = columna
    return mapa


def construir_mapa_observaciones(columnas):
    mapa_base = construir_mapa_columnas(columnas)
    correcciones = {}
    campos_correccion = [
        "correo",
        "telefono",
        "direccion",
        "sexo",
        "estado_civil",
        "nacionalidad",
        "etnia",
        "fecha_nacimiento",
        "edad",
        "discapacidad",
        "neurodivergencia",
        "comuna",
        "parentesco",
        "tipo_familia",
        "grupo_familiar",
        "integrantes",
        "rsh",
        "minvu_conecta",
        "cedula_vencimiento",
    ]
    for campo in campos_correccion:
        columna = mapa_base.get(campo)
        if columna and columna_correccion_util(columna):
            correcciones[campo] = columna

    rut = mapa_base.get("rut") or encontrar_columna(columnas, COLUMN_ALIASES["rut"], COLUMN_EXCLUDES.get("rut", []))
    reservadas = {rut, *correcciones.values()}
    observaciones = [
        columna
        for columna in columnas
        if columna
        and columna not in reservadas
        and es_columna_observacion(columna)
    ]
    if not observaciones:
        observaciones = [
            columna
            for columna in columnas
            if columna
            and columna not in reservadas
            and not normalizar_texto(columna).startswith("sinnombre")
            and not columna_observacion_reservada(columna)
        ]
    resultado = {"correcciones": correcciones, "observaciones": observaciones}
    if rut:
        resultado["rut"] = rut
    return resultado


def columna_correccion_util(columna):
    texto = normalizar_texto(columna)
    if not texto:
        return False
    tokens_correccion = [
        "correccion",
        "correg",
        "nuevo",
        "actualizado",
        "actualizada",
        "rectific",
        "reemplazo",
        "final",
    ]
    if es_columna_observacion(columna) and not any(token in texto for token in tokens_correccion):
        return False
    return True


def es_columna_observacion(columna):
    texto = normalizar_texto(columna)
    return any(
        token in texto
        for token in [
            "observacion",
            "obs",
            "comentario",
            "correccion",
            "corregir",
            "revision",
            "revisar",
            "nota",
            "motivo",
            "detalle",
            "situacion",
            "estado",
            "respuesta",
        ]
    )


def columna_observacion_reservada(columna):
    texto = normalizar_texto(columna)
    return any(
        texto == token or texto.startswith(token)
        for token in [
            "nombre",
            "nombres",
            "apellido",
            "apellidos",
            "rut",
            "run",
            "comite",
            "comuna",
            "nro",
            "numero",
            "orden",
            "id",
            "fecha",
            "base",
        ]
    )


def validar_columnas_minimas(mapa):
    faltantes = []
    if "rut" not in mapa:
        faltantes.append("RUT/RUN")
    if "nombre" not in mapa and not tiene_columnas_nombre_separado(mapa):
        faltantes.append("NOMBRE o NOMBRES/APELLIDOS")
    if faltantes:
        raise ImportacionError(
            "Faltan columnas obligatorias: " + ", ".join(faltantes)
        )


def tiene_columnas_nombre_separado(mapa):
    return any(
        campo in mapa
        for campo in ["nombres", "apellidos", "apellido_paterno", "apellido_materno"]
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

    nombre = componer_nombre_persona(valor, mapa)
    rut = normalizar_rut(valor("rut"))
    if not nombre or not rut:
        return "omitido"
    if normalizar_texto(nombre) in {"nombre", "basecomite"}:
        return "omitido"

    fecha_nacimiento, edad = resolver_nacimiento_y_edad(
        valor("fecha_nacimiento"),
        valor("edad"),
        edad_minima=16,
    )
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


def procesar_fila_observaciones(*, fila, columnas, mapa, comite_nombre):
    def valor_columna_mapa(columna):
        if not columna:
            return None
        return fila.get(columna)

    rut = normalizar_rut(valor_columna_mapa(mapa.get("rut")))
    if not rut:
        return "omitido"

    persona = Persona.objects.select_related("comite").filter(rut=rut).first()
    if not persona:
        raise ImportacionError(f"RUT {rut} no existe en la base cargada.")
    if comite_nombre and normalizar_texto(persona.comite.nombre) != normalizar_texto(comite_nombre):
        raise ImportacionError(f"RUT {rut} pertenece a otro comité.")

    correcciones = 0
    for campo, columna in mapa.get("correcciones", {}).items():
        if aplicar_correccion_observacion(persona, campo, valor_columna_mapa(columna)):
            correcciones += 1

    observaciones = 0
    for columna in mapa.get("observaciones", []):
        valor = limpiar_string(valor_columna_mapa(columna))
        if not valor:
            continue
        etiqueta = limpiar_string(columna)
        texto = valor if es_encabezado_observacion_generico(etiqueta) else f"{etiqueta}: {valor}"
        if agregar_observacion(persona, texto):
            observaciones += 1

    if correcciones or observaciones:
        regenerar_alertas_persona(persona)
        return "actualizado"
    return "omitido"


def aplicar_correccion_observacion(persona, campo, raw_value):
    valor = limpiar_string(raw_value)
    if not valor:
        return False

    def set_persona(attr, siguiente, etiqueta):
        actual = limpiar_string(getattr(persona, attr, ""))
        siguiente_texto = limpiar_string(siguiente)
        if not siguiente_texto or normalizar_texto(actual) == normalizar_texto(siguiente_texto):
            return False
        setattr(persona, attr, siguiente)
        persona.save(update_fields=[attr, "actualizado_en"])
        agregar_observacion(
            persona,
            f"Corrección aplicada - {etiqueta}: {actual or 'Sin dato'} -> {siguiente_texto}",
        )
        return True

    if campo in {"correo", "telefono", "direccion", "sexo", "estado_civil", "nacionalidad", "etnia"}:
        return set_persona(campo, valor, etiqueta_correccion(campo))
    if campo == "fecha_nacimiento":
        fecha, edad = resolver_nacimiento_y_edad(raw_value, persona.edad, edad_minima=16)
        if not fecha:
            return False
        actual = persona.fecha_nacimiento.isoformat() if persona.fecha_nacimiento else ""
        if actual == fecha.isoformat():
            return False
        persona.fecha_nacimiento = fecha
        persona.edad = edad
        persona.persona_mayor = edad >= 60
        persona.save(update_fields=["fecha_nacimiento", "edad", "persona_mayor", "actualizado_en"])
        agregar_observacion(
            persona,
            f"Corrección aplicada - Fecha de nacimiento: {actual or 'Sin dato'} -> {fecha.isoformat()}",
        )
        return True
    if campo == "edad":
        edad = parse_edad(raw_value)
        if edad is None or persona.edad == edad:
            return False
        actual = persona.edad
        persona.edad = edad
        persona.persona_mayor = edad >= 60
        persona.save(update_fields=["edad", "persona_mayor", "actualizado_en"])
        agregar_observacion(
            persona,
            f"Corrección aplicada - Edad: {actual if actual is not None else 'Sin dato'} -> {edad}",
        )
        return True
    if campo in {"discapacidad", "neurodivergencia"}:
        siguiente = parse_booleano(raw_value)
        if getattr(persona, campo) == siguiente:
            return False
        actual = getattr(persona, campo)
        setattr(persona, campo, siguiente)
        persona.save(update_fields=[campo, "actualizado_en"])
        agregar_observacion(
            persona,
            f"Corrección aplicada - {etiqueta_correccion(campo)}: {'Sí' if actual else 'No'} -> {'Sí' if siguiente else 'No'}",
        )
        return True
    if campo in {"comuna", "parentesco", "tipo_familia", "grupo_familiar"}:
        caracterizacion, _ = CaracterizacionSocial.objects.get_or_create(persona=persona)
        actual = limpiar_string(getattr(caracterizacion, campo, ""))
        integrantes = parse_integrantes(raw_value) if campo == "grupo_familiar" else None
        if normalizar_texto(actual) == normalizar_texto(valor) and (
            integrantes is None or caracterizacion.integrantes == integrantes
        ):
            return False
        setattr(caracterizacion, campo, valor)
        update_fields = [campo, "actualizado_en"]
        if integrantes is not None and caracterizacion.integrantes != integrantes:
            caracterizacion.integrantes = integrantes
            update_fields.insert(0, "integrantes")
        caracterizacion.save(update_fields=update_fields)
        agregar_observacion(
            persona,
            f"Corrección aplicada - {etiqueta_correccion(campo)}: {actual or 'Sin dato'} -> {valor}",
        )
        return True
    if campo == "integrantes":
        integrantes = parse_integrantes(raw_value)
        if integrantes is None:
            return False
        caracterizacion, _ = CaracterizacionSocial.objects.get_or_create(persona=persona)
        if caracterizacion.integrantes == integrantes:
            return False
        actual = caracterizacion.integrantes
        caracterizacion.integrantes = integrantes
        caracterizacion.save(update_fields=["integrantes", "actualizado_en"])
        agregar_observacion(
            persona,
            f"Corrección aplicada - Integrantes: {actual if actual is not None else 'Sin dato'} -> {integrantes}",
        )
        return True
    if campo == "rsh":
        porcentaje = parse_decimal(raw_value)
        if porcentaje is None:
            return False
        rsh, _ = RSH.objects.get_or_create(persona=persona)
        if rsh.porcentaje == porcentaje:
            return False
        actual = rsh.porcentaje
        rsh.porcentaje = porcentaje
        rsh.tramo = valor
        rsh.es_preferente = porcentaje <= Decimal("40")
        rsh.save(update_fields=["porcentaje", "tramo", "es_preferente", "actualizado_en"])
        agregar_observacion(
            persona,
            f"Corrección aplicada - RSH: {actual if actual is not None else 'Sin dato'} -> {porcentaje}",
        )
        return True
    if campo == "minvu_conecta":
        minvu = parse_decimal(raw_value)
        if minvu is None:
            return False
        postulacion, _ = Postulacion.objects.get_or_create(persona=persona)
        if postulacion.minvu_conecta == minvu:
            return False
        actual = postulacion.minvu_conecta
        postulacion.minvu_conecta = minvu
        postulacion.save(update_fields=["minvu_conecta", "actualizado_en"])
        agregar_observacion(
            persona,
            f"Corrección aplicada - MINVU Conecta: {actual if actual is not None else 'Sin dato'} -> {minvu}",
        )
        return True
    if campo == "cedula_vencimiento":
        fecha = parse_fecha(raw_value)
        if not fecha:
            return False
        documento, _ = Documento.objects.get_or_create(
            persona=persona,
            tipo=Documento.TIPO_CEDULA,
            defaults={"estado": estado_documento_por_fecha(fecha)},
        )
        if documento.fecha_vencimiento == fecha:
            return False
        actual = documento.fecha_vencimiento.isoformat() if documento.fecha_vencimiento else ""
        documento.fecha_vencimiento = fecha
        documento.estado = estado_documento_por_fecha(fecha)
        documento.observaciones = "Actualizado desde archivo de observaciones."
        documento.save(update_fields=["fecha_vencimiento", "estado", "observaciones", "actualizado_en"])
        agregar_observacion(
            persona,
            f"Corrección aplicada - Vencimiento cédula: {actual or 'Sin dato'} -> {fecha.isoformat()}",
        )
        return True
    return False


def agregar_observacion(persona, texto, autor="Importación observaciones"):
    texto = limpiar_string(texto)
    if not texto:
        return False
    normalizado = normalizar_texto(texto)
    existe = any(
        normalizar_texto(item.texto) == normalizado
        for item in Observacion.objects.filter(persona=persona)
    )
    if existe:
        return False
    Observacion.objects.create(persona=persona, texto=texto, autor=autor)
    return True


def es_encabezado_observacion_generico(columna):
    return normalizar_texto(columna) in {
        "observacion",
        "observaciones",
        "obs",
        "comentario",
        "comentarios",
        "nota",
        "notas",
    }


def etiqueta_correccion(campo):
    etiquetas = {
        "correo": "Correo",
        "telefono": "Teléfono",
        "direccion": "Dirección",
        "sexo": "Sexo",
        "estado_civil": "Estado civil",
        "nacionalidad": "Nacionalidad",
        "etnia": "Etnia / pueblo originario",
        "fecha_nacimiento": "Fecha de nacimiento",
        "discapacidad": "Discapacidad",
        "neurodivergencia": "Neurodivergencia",
        "comuna": "Comuna",
        "parentesco": "Parentesco",
        "tipo_familia": "Tipo familia",
        "grupo_familiar": "Grupo familiar",
    }
    return etiquetas.get(campo, campo)


def detectar_desplazamiento(fila, columnas, mapa):
    nombre_col = columna_nombre_identidad(mapa)
    rut_col = mapa.get("rut")
    if not nombre_col or not rut_col:
        return 0
    nombre_valor = fila.get(nombre_col)
    rut_valor = fila.get(rut_col)
    siguiente_rut = valor_columna(fila, columnas, rut_col, 1)
    if es_numero_orden(nombre_valor) and not parece_rut(rut_valor) and parece_rut(siguiente_rut):
        return 1
    return 0


def columna_nombre_identidad(mapa):
    for campo in ["nombre", "nombres", "apellidos", "apellido_paterno", "apellido_materno"]:
        if mapa.get(campo):
            return mapa[campo]
    return None


def componer_nombre_persona(valor, mapa):
    base = limpiar_string(valor("nombre"))
    nombres = limpiar_string(valor("nombres"))
    apellido_paterno = limpiar_string(valor("apellido_paterno"))
    apellido_materno = limpiar_string(valor("apellido_materno"))
    apellidos = limpiar_string(valor("apellidos"))

    if nombres or apellido_paterno or apellido_materno or apellidos:
        primeros_nombres = nombres or (
            base if es_encabezado_solo_nombres(mapa.get("nombre")) else ""
        )
        partes = [
            primeros_nombres or base,
            apellido_paterno,
            apellido_materno or (apellidos if not apellido_paterno else ""),
        ]
        nombre = " ".join(parte for parte in partes if parte).strip()
        if nombre:
            return re.sub(r"\s+", " ", nombre)

    return re.sub(r"\s+", " ", base).strip()


def es_encabezado_solo_nombres(encabezado):
    texto = normalizar_texto(encabezado)
    if not texto:
        return False
    if texto in {"nombre", "nombres", "primernombre", "segundonombre"}:
        return True
    return "nombre" in texto and "completo" not in texto and "apellido" not in texto


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
    valor_grupo_familiar = valor("grupo_familiar")
    valor_integrantes = valor("integrantes")
    integrantes = parse_integrantes(valor_integrantes) or parse_integrantes(valor_grupo_familiar)
    grupo_familiar = limpiar_string(valor_grupo_familiar or valor_integrantes or (integrantes if integrantes is not None else ""))
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
    crear_alertas_persona(persona, fecha_vencimiento, hijos or [])
    persona.actualizar_estado_general()


def regenerar_alertas_persona(persona):
    Alerta.objects.filter(persona=persona, origen=ORIGEN_IMPORTACION).delete()
    documento = (
        Documento.objects.filter(persona=persona, tipo=Documento.TIPO_CEDULA)
        .order_by("-fecha_vencimiento")
        .first()
    )
    caracterizacion = CaracterizacionSocial.objects.filter(persona=persona).first()
    crear_alertas_persona(
        persona,
        documento.fecha_vencimiento if documento else None,
        getattr(caracterizacion, "hijos", []) or [],
    )
    persona.actualizar_estado_general()


def crear_alertas_persona(persona, fecha_vencimiento, hijos=None):
    if fecha_vencimiento:
        hoy = timezone.localdate()
        dias = (fecha_vencimiento - hoy).days
        if dias < 0:
            crear_alerta(
                persona,
                Alerta.TIPO_DOCUMENTAL,
                Alerta.SEVERIDAD_CRITICA,
                "Cédula vencida",
                f"Cédula vencida el {fecha_vencimiento.isoformat()}.",
            )
        elif dias <= 30:
            crear_alerta(
                persona,
                Alerta.TIPO_DOCUMENTAL,
                Alerta.SEVERIDAD_PREVENTIVA,
                "Cédula por vencer",
                f"Cédula vence el {fecha_vencimiento.isoformat()}.",
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

    if persona_tiene_etnia(persona):
        crear_alerta(
            persona,
            Alerta.TIPO_DOCUMENTAL,
            Alerta.SEVERIDAD_PREVENTIVA,
            "Revisar certificado de acreditación indígena",
            (
                "La persona registra etnia o pueblo originario; revisar y confirmar "
                "certificado de acreditación indígena para el proceso documental interno."
            ),
            impacta_estado=False,
        )

    criterios = criterios_excepcion_unipersonal(persona)
    if postulacion_es_unipersonal(persona) and criterios:
        crear_alerta(
            persona,
            Alerta.TIPO_SOCIAL,
            Alerta.SEVERIDAD_PREVENTIVA,
            "Criterio de excepción unipersonal",
            f"Postulación unipersonal con criterio de excepción: {', '.join(criterios)}.",
            impacta_estado=False,
        )

    for hijo in hijos or []:
        if not hijo.get("requiere_revision_documental"):
            continue
        crear_alerta(
            persona,
            Alerta.TIPO_DOCUMENTAL,
            Alerta.SEVERIDAD_PREVENTIVA,
            "Revisar hijo/a por mayoría de edad",
            detalle_revision_hijo(hijo),
            impacta_estado=False,
        )


def persona_tiene_etnia(persona):
    texto = normalizar_texto(getattr(persona, "etnia", ""))
    return bool(
        texto
        and texto
        not in {
            "no",
            "n",
            "ninguna",
            "ninguno",
            "sin",
            "sindato",
            "noaplica",
            "noaplicable",
            "nodeclara",
            "noinforma",
            "noinformado",
            "noinformada",
            "none",
            "0",
        }
    )


def postulacion_es_unipersonal(persona):
    caracterizacion = CaracterizacionSocial.objects.filter(persona=persona).first()
    if not caracterizacion:
        return False
    integrantes = parse_integrantes(caracterizacion.integrantes) or parse_integrantes(caracterizacion.grupo_familiar)
    if integrantes == 1:
        return True
    texto = normalizar_texto(
        " ".join(
            filter(
                None,
                [
                    caracterizacion.grupo_familiar,
                    caracterizacion.tipo_familia,
                    caracterizacion.parentesco,
                ],
            )
        )
    )
    return es_unipersonal_texto(texto)


def criterios_excepcion_unipersonal(persona):
    criterios = []
    if persona.persona_mayor:
        criterios.append("Adulto mayor")
    if persona_tiene_etnia(persona):
        criterios.append("Etnia / pueblo originario")
    return criterios


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
    fecha_nacimiento, edad = resolver_nacimiento_y_edad(datos.get("fecha_nacimiento"), datos.get("edad"))
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
        return f"{nombre} cumple 18 años hoy; revisar actualización documental de la postulación."
    if estado == "proximo_18":
        return (
            f"{nombre} cumple 18 años el {hijo.get('fecha_cumple_18')}; "
            "revisar documentación antes del cambio."
        )
    if estado == "proximo_sin_fecha":
        return f"{nombre} registra 17 años sin fecha exacta; revisar fecha de nacimiento y documentación."
    return f"{nombre} ya registra 18 años o más; revisar actualización documental de la postulación."


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


def parse_integrantes(valor):
    if isinstance(valor, numbers.Real) and not isinstance(valor, bool):
        return integrantes_validos(int(valor))
    texto = limpiar_string(valor)
    if not texto:
        return None
    normalizado = normalizar_texto(texto)
    if normalizado in {"no", "sin", "sindato", "noinforma", "noinformado", "noaplica", "noaplicable", "ninguno"}:
        return None
    if "%" in texto:
        return None
    if es_unipersonal_texto(normalizado):
        return 1
    if re.fullmatch(r"\d{1,2}([,.]\d+)?", texto):
        return integrantes_validos(parse_entero(texto))

    patrones = [
        r"(?:total|integrantes?|miembros?|personas?|familiares?|grupofamiliar|nucleofamiliar|nucleohogar|hogar|gf)(\d{1,2})",
        r"(\d{1,2})(?:integrantes?|miembros?|personas?|familiares?|grupofamiliar|nucleofamiliar|nucleohogar|hogar|gf)",
    ]
    for patron in patrones:
        match = re.search(patron, normalizado)
        if match:
            integrantes = integrantes_validos(int(match.group(1)))
            if integrantes is not None:
                return integrantes

    texto_numero = integrantes_en_palabras(normalizado)
    if texto_numero is not None:
        return texto_numero

    numeros = [
        int(match.group(0))
        for match in re.finditer(r"\b\d{1,2}\b", texto)
        if integrantes_validos(int(match.group(0))) is not None
    ]
    if not numeros:
        return None
    if len(numeros) == 1:
        return integrantes_validos(numeros[0])
    tokens_composicion = ["adult", "menor", "nino", "nina", "hijo", "hija", "conyuge", "pareja", "postulante", "dependiente", "carga"]
    if any(token in normalizado for token in tokens_composicion):
        return integrantes_validos(sum(numeros))
    return integrantes_validos(numeros[0])


def integrantes_validos(valor):
    return valor if isinstance(valor, int) and 0 < valor < 100 else None


def es_unipersonal_texto(normalizado):
    return any(
        token in normalizado
        for token in [
            "unipersonal",
            "personaunica",
            "personasola",
            "solopostulante",
            "solicitantesolo",
            "solicitantesola",
            "vivesolo",
            "vivesola",
            "solo",
            "sola",
        ]
    )


def integrantes_en_palabras(normalizado):
    palabras = {
        "uno": 1,
        "una": 1,
        "un": 1,
        "dos": 2,
        "tres": 3,
        "cuatro": 4,
        "cinco": 5,
        "seis": 6,
        "siete": 7,
        "ocho": 8,
        "nueve": 9,
        "diez": 10,
        "once": 11,
        "doce": 12,
        "trece": 13,
        "catorce": 14,
        "quince": 15,
    }
    for palabra, cantidad in palabras.items():
        if (
            normalizado == palabra
            or f"{palabra}integrantes" in normalizado
            or f"{palabra}personas" in normalizado
            or f"{palabra}miembros" in normalizado
            or f"integrantes{palabra}" in normalizado
            or f"personas{palabra}" in normalizado
            or f"miembros{palabra}" in normalizado
        ):
            return cantidad
    return None


def parse_edad(valor):
    edad = parse_entero(valor)
    return edad if edad_plausible(edad) else None


def edad_plausible(edad):
    return isinstance(edad, int) and 0 <= edad <= 125


def resolver_nacimiento_y_edad(valor_fecha, valor_edad, *, edad_minima=0):
    edad_declarada = parse_edad(valor_edad)
    fecha_nacimiento = parse_fecha_nacimiento(valor_fecha, edad_declarada, edad_minima=edad_minima)
    edad_calculada = calcular_edad(fecha_nacimiento) if fecha_nacimiento else None
    if fecha_nacimiento and edad_plausible(edad_calculada):
        return fecha_nacimiento, edad_calculada
    return None, edad_declarada


def parse_fecha_nacimiento(valor, edad_declarada=None, *, edad_minima=0):
    principal = parse_fecha(valor, modo_anio_2="nacimiento")
    alternativa = parse_fecha(valor, modo_anio_2="nacimiento_alternativo") if tiene_anio_2(valor) else None
    candidatos = []
    for fecha in [principal, alternativa]:
        if not fecha or any(misma_fecha(fecha, item["fecha"]) for item in candidatos):
            continue
        edad = calcular_edad(fecha)
        if edad_plausible(edad):
            candidatos.append({"fecha": fecha, "edad": edad})

    if not candidatos:
        return None
    if edad_declarada is not None:
        for candidato in candidatos:
            if abs(candidato["edad"] - edad_declarada) <= 1:
                return candidato["fecha"]
        if tiene_anio_2(valor):
            return None

    for candidato in candidatos:
        if candidato["edad"] >= edad_minima:
            return candidato["fecha"]
    return candidatos[0]["fecha"]


def parse_fecha(valor, *, modo_anio_2="default"):
    if valor is None or (isinstance(valor, float) and math.isnan(valor)):
        return None
    if isinstance(valor, numbers.Real) and not isinstance(valor, bool):
        return parse_fecha_excel_serial(valor)
    if isinstance(valor, datetime):
        return valor.date()
    if isinstance(valor, date):
        return valor
    texto = limpiar_string(valor)
    if not texto:
        return None
    iso = re.match(r"^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:\D.*)?$", texto)
    if iso:
        return fecha_desde_partes(int(iso.group(1)), int(iso.group(2)), int(iso.group(3)))
    dmy = re.match(r"^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\D.*)?$", texto)
    if dmy:
        anio = resolver_anio_2(dmy.group(3), modo_anio_2)
        return fecha_desde_partes(anio, int(dmy.group(2)), int(dmy.group(1)))
    fecha = pd.to_datetime(texto, dayfirst=True, errors="coerce")
    if pd.isna(fecha):
        return None
    return fecha.date()


def parse_fecha_excel_serial(valor):
    serial = int(valor)
    if serial <= 15000 or serial >= 60000:
        return None
    try:
        return date(1899, 12, 30) + timedelta(days=serial)
    except OverflowError:
        return None


def resolver_anio_2(texto_anio, modo):
    if len(str(texto_anio)) != 2:
        return int(texto_anio)
    anio = int(texto_anio)
    actual = timezone.localdate().year % 100
    if modo == "nacimiento":
        return 2000 + anio if anio <= actual else 1900 + anio
    if modo == "nacimiento_alternativo":
        return 1900 + anio if anio <= actual else 2000 + anio
    return 2000 + anio


def tiene_anio_2(valor):
    texto = limpiar_string(valor)
    return bool(re.search(r"\b\d{1,2}[./-]\d{1,2}[./-]\d{2}(?:\D|$)", texto))


def fecha_desde_partes(anio, mes, dia):
    try:
        return date(anio, mes, dia)
    except ValueError:
        return None


def misma_fecha(a, b):
    return bool(a and b and a == b)


def calcular_edad(fecha_nacimiento):
    if not fecha_nacimiento:
        return None
    hoy = timezone.localdate()
    edad = hoy.year - fecha_nacimiento.year
    if (hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day):
        edad -= 1
    return edad


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
