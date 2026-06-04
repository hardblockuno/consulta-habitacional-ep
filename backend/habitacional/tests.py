from decimal import Decimal
from datetime import date, timedelta
from pathlib import Path
from tempfile import TemporaryDirectory

import pandas as pd
from django.test import TestCase
from django.utils import timezone

from .models import Alerta, Documento, ImportacionExcel, Persona
from .services.excel_importer import construir_mapa_columnas, importar_excel, importar_observaciones_excel


class ImportadorExcelTests(TestCase):
    def test_importa_base_y_calcula_alertas(self):
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE DEMO.xlsx"
            df = pd.DataFrame(
                [
                    ["BASE COMITE"],
                    ["NOMBRE", "RUT", "FEC NAC", "RSH", "AHORRO", "DISCAPACIDAD"],
                    ["Persona Prueba", "11111111", "1960-01-01", 70, 5, "SI"],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Demo",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona Prueba")
        self.assertEqual(persona.edad, timezone.localdate().year - 1960)
        self.assertTrue(persona.persona_mayor)
        self.assertEqual(persona.estado_general, Persona.ESTADO_APTA)
        self.assertEqual(persona.rsh.porcentaje, Decimal("70.00"))
        self.assertTrue(persona.ahorro.insuficiente)
        self.assertFalse(persona.alertas.get().impacta_estado)
        self.assertEqual(
            Alerta.objects.filter(persona=persona, activa=True).count(),
            1,
        )

    def test_rsh_sobre_40_no_deja_persona_observada(self):
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE RSH.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "FEC NAC", "RSH", "AHORRO"],
                    ["Persona RSH Alto", "22222222", "1990-01-01", 80, 20],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite RSH",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona RSH Alto")
        self.assertEqual(persona.estado_general, Persona.ESTADO_APTA)
        self.assertEqual(persona.alertas.count(), 0)

    def test_fecha_nacimiento_dos_digitos_calcula_adulto_mayor(self):
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE EDAD.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "FEC NAC", "EDAD"],
                    ["Persona Mayor Dos Digitos", "33333333", "31/12/59", 66],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Edad",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona Mayor Dos Digitos")
        nacimiento = date(1959, 12, 31)
        edad = timezone.localdate().year - nacimiento.year
        if (timezone.localdate().month, timezone.localdate().day) < (nacimiento.month, nacimiento.day):
            edad -= 1
        self.assertEqual(persona.fecha_nacimiento, nacimiento)
        self.assertEqual(persona.edad, edad)
        self.assertTrue(persona.persona_mayor)

    def test_detecta_integrantes_con_encabezados_y_textos_flexibles(self):
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE GRUPO FAMILIAR.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "FEC NAC", "N° Grupo Familiar"],
                    ["Persona Grupo Numerico", "44444444", "1990-01-01", "4 integrantes"],
                    ["Persona Grupo Texto", "55555555", "1991-01-01", "2 adultos + 2 niños"],
                    ["Persona Unipersonal", "66666666", "1992-01-01", "Unipersonal"],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Grupo Familiar",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        self.assertEqual(Persona.objects.get(nombre="Persona Grupo Numerico").caracterizacion_social.integrantes, 4)
        self.assertEqual(Persona.objects.get(nombre="Persona Grupo Texto").caracterizacion_social.integrantes, 4)
        self.assertEqual(Persona.objects.get(nombre="Persona Unipersonal").caracterizacion_social.integrantes, 1)

    def test_mapea_abreviaciones_de_grupo_familiar(self):
        for encabezado in ["GRO FAM", "GPO FAM", "GRP FAM", "G FAMILIAR"]:
            with self.subTest(encabezado=encabezado):
                mapa = construir_mapa_columnas(["NOMBRE", "RUT", encabezado])
                self.assertEqual(mapa["grupo_familiar"], encabezado)
                self.assertEqual(mapa["integrantes"], encabezado)
                self.assertNotEqual(mapa.get("tipo_familia"), encabezado)

    def test_importa_integrantes_con_encabezado_gro_fam(self):
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE GRO FAM.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRES", "CEDULA IDENTIDAD", "FEC NAC", "GRO FAM", "TIPO FAMILIA"],
                    ["Persona Abreviacion", "77777777", "1990-01-01", 3, "NUCLEAR"],
                    ["Persona Unipersonal Abreviacion", "88888888", "1991-01-01", 1, "UNIPERSONAL"],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Gro Fam",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        self.assertEqual(Persona.objects.get(nombre="Persona Abreviacion").caracterizacion_social.integrantes, 3)
        self.assertEqual(Persona.objects.get(nombre="Persona Unipersonal Abreviacion").caracterizacion_social.integrantes, 1)

    def test_ahorro_bajo_minimo_no_genera_alerta_ni_observacion(self):
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE AHORRO.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "FEC NAC", "AHORRO"],
                    ["Persona Ahorro Bajo", "33333333", "1990-01-01", 5],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Ahorro",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona Ahorro Bajo")
        self.assertEqual(persona.estado_general, Persona.ESTADO_APTA)
        self.assertTrue(persona.ahorro.insuficiente)
        self.assertEqual(persona.alertas.count(), 0)

    def test_importa_base_con_encabezados_alternativos(self):
        fecha_vigente = timezone.localdate() + timedelta(days=120)
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "NOMINA COMITE FORMATOS DISTINTOS.xlsx"
            df = pd.DataFrame(
                [
                    ["ANTECEDENTES DEL POSTULANTE"],
                    [
                        "RUN POSTULANTE",
                        "NOMBRES",
                        "APELLIDO PATERNO",
                        "APELLIDO MATERNO",
                        "FECHA NACIMIENTO",
                        "TRAMO RSH",
                        "FECHA VENC. CI",
                        "CREDENCIAL DISCAPACIDAD",
                        "TOTAL INTEGRANTES",
                        "PUEBLO ORIGINARIO",
                    ],
                    [
                        "12345678",
                        "Ana Maria",
                        "Perez",
                        "Soto",
                        "1985-03-02",
                        "40%",
                        fecha_vigente.isoformat(),
                        "NO",
                        1,
                        "Mapuche",
                    ],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="Nomina")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Formatos",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(rut="12345678-5")
        self.assertEqual(persona.nombre, "Ana Maria Perez Soto")
        self.assertEqual(persona.etnia, "Mapuche")
        self.assertEqual(persona.rsh.porcentaje, Decimal("40.00"))
        self.assertEqual(persona.caracterizacion_social.integrantes, 1)
        self.assertEqual(persona.estado_general, Persona.ESTADO_APTA)
        titulos = set(persona.alertas.values_list("titulo", flat=True))
        self.assertIn("Revisar certificado de acreditación indígena", titulos)
        self.assertIn("Criterio de excepción unipersonal", titulos)
        self.assertFalse(persona.alertas.filter(impacta_estado=True).exists())

    def test_importa_observaciones_y_correcciones_por_rut(self):
        with TemporaryDirectory() as tmpdir:
            base = Path(tmpdir) / "BASE COMITE OBS.xlsx"
            df_base = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "FEC NAC", "TELEFONO", "TOTAL INTEGRANTES"],
                    ["Persona Observada", "66666666", "1995-01-01", "111", 2],
                ]
            )
            observaciones = Path(tmpdir) / "OBSERVACIONES COMITE OBS.xlsx"
            df_observaciones = pd.DataFrame(
                [
                    ["RUN", "OBSERVACION", "TELEFONO NUEVO", "PUEBLO ORIGINARIO", "TOTAL INTEGRANTES"],
                    ["66666666", "Actualizar respaldo interno", "999", "Mapuche", 1],
                ]
            )
            with pd.ExcelWriter(base, engine="openpyxl") as writer:
                df_base.to_excel(writer, index=False, header=False, sheet_name="BASE")
            with pd.ExcelWriter(observaciones, engine="openpyxl") as writer:
                df_observaciones.to_excel(writer, index=False, header=False, sheet_name="OBS")

            importacion_base = ImportacionExcel.objects.create(
                archivo=str(base),
                nombre_archivo=base.name,
            )
            importar_excel(
                importacion=importacion_base,
                archivo_path=base,
                comite_nombre="Comite Obs",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

            importacion_obs = ImportacionExcel.objects.create(
                archivo=str(observaciones),
                nombre_archivo=observaciones.name,
            )
            importar_observaciones_excel(
                importacion=importacion_obs,
                archivo_path=observaciones,
                comite_nombre="Comite Obs",
            )
            self.assertEqual(importacion_obs.errores, [])
            self.assertEqual(importacion_obs.actualizados, 1)

        persona = Persona.objects.get(nombre="Persona Observada")
        persona.refresh_from_db()
        self.assertEqual(persona.telefono, "999")
        self.assertEqual(persona.etnia, "Mapuche")
        self.assertEqual(persona.caracterizacion_social.integrantes, 1)
        self.assertEqual(persona.estado_general, Persona.ESTADO_APTA)
        self.assertTrue(persona.observaciones.filter(texto__icontains="Actualizar respaldo interno").exists())
        self.assertTrue(persona.alertas.filter(titulo="Revisar certificado de acreditación indígena").exists())

    def test_cedula_vencida_bloquea_persona(self):
        fecha_vencida = timezone.localdate() - timedelta(days=1)
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE CEDULA VENCIDA.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "VENCIMIENTO CEDULA"],
                    ["Persona Cedula Vencida", "44444444", fecha_vencida.isoformat()],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Cedula",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona Cedula Vencida")
        self.assertEqual(persona.estado_general, Persona.ESTADO_BLOQUEADA)
        self.assertTrue(
            persona.alertas.filter(
                severidad=Alerta.SEVERIDAD_CRITICA,
                impacta_estado=True,
            ).exists()
        )
        self.assertTrue(
            persona.documentos.filter(
                tipo=Documento.TIPO_CEDULA,
                estado=Documento.ESTADO_VENCIDO,
            ).exists()
        )

    def test_cedula_por_vencer_deja_persona_observada(self):
        fecha_por_vencer = timezone.localdate() + timedelta(days=30)
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE CEDULA POR VENCER.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "VENCIMIENTO CEDULA"],
                    ["Persona Cedula Por Vencer", "55555555", fecha_por_vencer.isoformat()],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Cedula",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona Cedula Por Vencer")
        self.assertEqual(persona.estado_general, Persona.ESTADO_OBSERVADA)
        self.assertTrue(
            persona.alertas.filter(
                severidad=Alerta.SEVERIDAD_PREVENTIVA,
                impacta_estado=True,
            ).exists()
        )
        self.assertTrue(
            persona.documentos.filter(
                tipo=Documento.TIPO_CEDULA,
                estado=Documento.ESTADO_POR_VENCER,
            ).exists()
        )

    def test_hijo_proximo_a_18_genera_alerta_interna_sin_observar(self):
        fecha_hijo = timezone.localdate().replace(year=timezone.localdate().year - 18) + timedelta(days=30)
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE HIJOS.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "NOMBRE HIJO 1", "FEC NAC HIJO 1"],
                    ["Persona Con Hijo", "66666666", "Hija Proxima", fecha_hijo.isoformat()],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Hijos",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona Con Hijo")
        self.assertEqual(persona.estado_general, Persona.ESTADO_APTA)
        self.assertEqual(len(persona.caracterizacion_social.hijos), 1)
        self.assertTrue(
            persona.alertas.filter(
                titulo="Revisar hijo/a por mayoría de edad",
                impacta_estado=False,
            ).exists()
        )
