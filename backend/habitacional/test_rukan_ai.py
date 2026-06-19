from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from urllib.error import HTTPError

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .services.rukan_ai import RukanAIQuotaError, normalize_ai_extraction, request_rukan_ai


class RukanAITests(TestCase):
    @override_settings(OPENAI_API_KEY="")
    def test_endpoint_ia_rukan_informa_si_falta_clave(self):
        client = APIClient()
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "rukan.pdf"
            archivo.write_bytes(b"%PDF-1.4\n%%EOF")
            with archivo.open("rb") as handle:
                response = client.post(
                    "/api/rukan/ia-extraer/",
                    {"archivo": handle},
                    format="multipart",
                )

        self.assertEqual(response.status_code, 503)
        self.assertIn("OPENAI_API_KEY", response.data["detail"])

    def test_normaliza_respuesta_ia_rukan_para_frontend(self):
        payload = {
            "archivo": "rukan.pdf",
            "confianza": 91,
            "socio": {
                "nombre": "Persona Consultada",
                "rut": "12.345.678-5",
                "sexo": "FEMENINO",
                "fecha_nacimiento": "01/02/1980",
                "edad": "",
                "estado_civil": "SOLTERO(A)",
                "discapacidad": "",
                "rsh": "40%",
                "comuna": "TEMUCO",
                "parentesco_postulante": "JEFE(A) DE HOGAR",
                "jefatura_hogar": "PERSONA CONSULTADA - 12345678-5",
                "tipo_familia_detectado": "UNIPERSONAL",
                "propiedades_detectadas": "",
                "subsidios_detectados": "",
                "minvu_conecta": "",
            },
            "grupo_familiar": [
                {
                    "orden": 1,
                    "nombre": "Persona Consultada",
                    "rut": "12345678-5",
                    "sexo": "FEMENINO",
                    "fecha_nacimiento": "1980-02-01",
                    "edad": "",
                    "estado_civil": "SOLTERO(A)",
                    "parentesco": "JEFE(A) DE HOGAR",
                    "esta_postulando": "SI",
                }
            ],
            "observaciones": ["Lectura completa"],
        }

        result = normalize_ai_extraction(payload, file_name="rukan.pdf")

        self.assertEqual(result["rut"], "12345678-5")
        self.assertEqual(result["nombre"], "PERSONA CONSULTADA")
        self.assertEqual(result["rsh"], 40)
        self.assertEqual(result["integrantes"], 1)
        self.assertEqual(result["grupoFamiliar"][0]["fechaNacimiento"], "1980-02-01")
        self.assertEqual(result["estadoRevision"], "detectado")

    @override_settings(OPENAI_API_KEY="sk-prueba-no-real")
    def test_traduce_cuota_insuficiente_de_openai(self):
        error_body = b'{"error":{"code":"insufficient_quota","message":"You exceeded your current quota"}}'
        error = HTTPError("https://api.openai.com/v1/responses", 429, "Too Many Requests", None, None)
        error.read = lambda: error_body

        with patch("habitacional.services.rukan_ai.urlopen", side_effect=error):
            with self.assertRaises(RukanAIQuotaError) as raised:
                request_rukan_ai(b"image", "image/jpeg", "rukan.pdf")

        self.assertIn("cuota disponible", str(raised.exception))
