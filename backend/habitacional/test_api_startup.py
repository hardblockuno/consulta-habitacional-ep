import importlib.util
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

from django.test import SimpleTestCase


ESPERAR_API_PATH = Path(__file__).resolve().parents[1] / "esperar_api.py"
SPEC = importlib.util.spec_from_file_location("esperar_api", ESPERAR_API_PATH)
esperar_api = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(esperar_api)


class EsperarApiTests(SimpleTestCase):
    def test_considera_disponible_el_endpoint_que_responde_405_a_get(self):
        error = HTTPError(esperar_api.RUKAN_AI_URL, 405, "Method Not Allowed", None, None)
        with patch.object(esperar_api, "urlopen", side_effect=error):
            self.assertTrue(esperar_api.api_disponible())
