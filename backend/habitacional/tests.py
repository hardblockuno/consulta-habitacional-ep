from decimal import Decimal
from pathlib import Path
from tempfile import TemporaryDirectory

import pandas as pd
from django.test import TestCase

from .models import Alerta, ImportacionExcel, Persona
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
        self.assertEqual(persona.edad, 66)
        self.assertTrue(persona.persona_mayor)
        self.assertEqual(persona.estado_general, Persona.ESTADO_OBSERVADA)
        self.assertEqual(persona.rsh.porcentaje, Decimal("70.00"))
        self.assertTrue(persona.ahorro.insuficiente)
        self.assertEqual(
            Alerta.objects.filter(persona=persona, activa=True).count(),
            2,
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
