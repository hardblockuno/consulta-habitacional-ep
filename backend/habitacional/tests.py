from decimal import Decimal
from datetime import timedelta
from pathlib import Path
from tempfile import TemporaryDirectory

import pandas as pd
from django.test import TestCase
from django.utils import timezone

from .models import Alerta, Documento, ImportacionExcel, Persona
from .services.excel_importer import importar_excel


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
                titulo="Revisar hijo/a por mayoria de edad",
                impacta_estado=False,
            ).exists()
        )
