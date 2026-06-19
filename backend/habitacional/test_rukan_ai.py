from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .services.rukan_ai import (
    RukanAIQuotaError,
    normalize_ai_extraction,
    request_rukan_ai,
    request_rukan_ollama,
    rukan_ai_status,
)


class RukanAITests(TestCase):
    @override_settings(RUKAN_AI_PROVIDER="openai", OPENAI_API_KEY="")
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

    @override_settings(RUKAN_AI_PROVIDER="ollama", RUKAN_OLLAMA_MODEL="qwen2.5vl:3b")
    def test_envia_imagen_a_ollama_local_con_formato_json(self):
        response = MagicMock()
        response.read.return_value = b'{"response":"{\\"archivo\\":\\"rukan.pdf\\",\\"confianza\\":90,\\"socio\\":{},\\"grupo_familiar\\":[],\\"observaciones\\":[]}"}'
        response.__enter__.return_value = response

        with patch("habitacional.services.rukan_ai.urlopen", return_value=response) as urlopen_mock:
            result = request_rukan_ollama(b"image", "image/jpeg", "rukan.pdf")

        self.assertEqual(result["archivo"], "rukan.pdf")
        request = urlopen_mock.call_args.args[0]
        self.assertEqual(request.full_url, "http://127.0.0.1:11434/api/generate")
        self.assertIn(b'"images": ["aW1hZ2U="]', request.data)

    @override_settings(RUKAN_AI_PROVIDER="ollama", RUKAN_OLLAMA_MODEL="qwen2.5vl:3b")
    def test_informa_cuando_el_modelo_local_esta_listo(self):
        response = MagicMock()
        response.read.return_value = b'{"models":[{"name":"qwen2.5vl:3b"}]}'
        response.__enter__.return_value = response

        with patch("habitacional.services.rukan_ai.urlopen", return_value=response):
            result = rukan_ai_status()

        self.assertTrue(result["available"])
        self.assertEqual(result["provider"], "ollama")
