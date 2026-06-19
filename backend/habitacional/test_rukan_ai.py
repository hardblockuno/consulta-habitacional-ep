from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIClient
from PIL import Image

from .services.rukan_ai import (
    RukanAIQuotaError,
    crop_rukan_regions,
    normalize_ai_extraction,
    parse_hogar_ocr_words,
    parse_rsh_ocr_words,
    parse_socio_ocr_words,
    ocr_rut_from_text,
    request_rukan_ai,
    request_rukan_ollama_json,
    rukan_ai_status,
    optimize_rukan_image,
)


class RukanAITests(SimpleTestCase):
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
            result = request_rukan_ollama_json(
                b"image",
                "rukan.pdf",
                "Extrae datos.",
                {"type": "object"},
                max_output_tokens=700,
            )

        self.assertEqual(result["archivo"], "rukan.pdf")
        request = urlopen_mock.call_args.args[0]
        self.assertEqual(request.full_url, "http://127.0.0.1:11434/api/generate")
        self.assertIn(b'"images": ["aW1hZ2U="]', request.data)
        self.assertIn(b'"num_ctx": 8192', request.data)
        self.assertIn(b'"num_predict": 700', request.data)

    @override_settings(RUKAN_AI_PROVIDER="ollama", RUKAN_OLLAMA_MODEL="qwen2.5vl:3b")
    def test_informa_cuando_el_modelo_local_esta_listo(self):
        response = MagicMock()
        response.read.return_value = b'{"models":[{"name":"qwen2.5vl:3b"}]}'
        response.__enter__.return_value = response

        with patch("habitacional.services.rukan_ai.urlopen", return_value=response):
            result = rukan_ai_status()

        self.assertTrue(result["available"])
        self.assertEqual(result["provider"], "ollama")

    def test_reduce_escaneo_grande_para_el_modelo_local(self):
        original = Image.new("RGB", (2400, 3600), "white")
        output = BytesIO()
        original.save(output, format="JPEG")

        reduced, mime_type = optimize_rukan_image(output.getvalue(), max_side=1800)

        with Image.open(BytesIO(reduced)) as image:
            self.assertLessEqual(max(image.size), 1800)
        self.assertEqual(mime_type, "image/jpeg")

    def test_divide_rukan_en_zonas_legibles_para_ia_local(self):
        original = Image.new("RGB", (2400, 3600), "white")
        output = BytesIO()
        original.save(output, format="JPEG")

        socio, hogar = crop_rukan_regions(output.getvalue(), max_side=1800)

        with Image.open(BytesIO(socio)) as socio_image:
            self.assertLessEqual(max(socio_image.size), 1800)
        with Image.open(BytesIO(hogar)) as hogar_image:
            self.assertLessEqual(max(hogar_image.size), 1800)

    def test_ocr_local_ubica_datos_del_socio_por_columna(self):
        words = [
            ocr_word("20.104.565-7", 20, 100),
            ocr_word("ESTEBAN IGNACIO BADILLA PAILACURA", 150, 100, 170),
            ocr_word("MASCULINO", 380, 100),
            ocr_word("SOLTERO", 480, 100),
            ocr_word("09-02-1999", 700, 100),
            ocr_word("NO", 930, 100),
        ]

        socio = parse_socio_ocr_words(words, 1000)

        self.assertEqual(socio["rut"], "20104565-7")
        self.assertEqual(socio["nombre"], "ESTEBAN IGNACIO BADILLA PAILACURA")
        self.assertEqual(socio["sexo"], "MASCULINO")
        self.assertEqual(socio["estado_civil"], "SOLTERO")
        self.assertEqual(socio["fecha_nacimiento"], "1999-02-09")
        self.assertEqual(socio["discapacidad"], "NO")

    def test_ocr_local_separa_integrantes_del_hogar_y_rsh(self):
        family_words = [
            ocr_word("18.875.382-5", 100, 80),
            ocr_word("MIGUEL ANGEL BADILLA PAILACURA", 170, 80, 150),
            ocr_word("MASCULINO", 360, 80),
            ocr_word("Hermano(a)", 450, 80),
            ocr_word("07-02-1995", 570, 80),
            ocr_word("NO", 750, 80),
            ocr_word("20.104.565-7", 100, 140),
            ocr_word("ESTEBAN IGNACIO BADILLA PAILACURA", 170, 140, 150),
            ocr_word("MASCULINO", 360, 140),
            ocr_word("Jefe(a) de hogar", 450, 140),
            ocr_word("09-02-1999", 570, 140),
            ocr_word("NO", 750, 140),
        ]
        rsh_words = [
            ocr_word("20.104.565-7", 30, 60),
            ocr_word("40%", 220, 60),
            ocr_word("Temuco", 880, 60),
        ]

        family = parse_hogar_ocr_words(family_words, 1000)
        rsh = parse_rsh_ocr_words(rsh_words, 1000)

        self.assertEqual(len(family), 2)
        self.assertEqual(family[0]["rut"], "18875382-5")
        self.assertEqual(family[0]["parentesco"], "Hermano(a)")
        self.assertEqual(family[1]["fecha_nacimiento"], "1999-02-09")
        self.assertEqual(family[1]["esta_postulando"], "NO")
        self.assertEqual(rsh, {"rsh": "40%", "comuna": "Temuco"})

    def test_ocr_local_corrige_rut_con_indice_de_fila_pegado(self):
        self.assertEqual(ocr_rut_from_text("418.875.3825"), "18875382-5")


def ocr_word(text, left, top, width=80, height=18):
    return {"text": text, "left": left, "top": top, "width": width, "height": height}
