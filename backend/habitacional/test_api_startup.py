import importlib.util
from pathlib import Path
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase


ESPERAR_API_PATH = Path(__file__).resolve().parents[1] / "esperar_api.py"
SPEC = importlib.util.spec_from_file_location("esperar_api", ESPERAR_API_PATH)
esperar_api = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(esperar_api)


class EsperarApiTests(SimpleTestCase):
    def test_considera_disponible_el_endpoint_de_estado_que_responde_get(self):
        response = MagicMock()
        response.__enter__.return_value = response
        with patch.object(esperar_api, "urlopen", return_value=response):
            self.assertTrue(esperar_api.api_disponible())
