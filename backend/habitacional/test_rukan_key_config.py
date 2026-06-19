import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory

from django.test import SimpleTestCase


CONFIGURADOR_PATH = Path(__file__).resolve().parents[1] / "configurar_ia_rukan.py"
SPEC = importlib.util.spec_from_file_location("configurar_ia_rukan", CONFIGURADOR_PATH)
configurar_ia_rukan = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(configurar_ia_rukan)


class ConfiguradorIARukanTests(SimpleTestCase):
    def test_ollama_local_no_requiere_clave(self):
        with TemporaryDirectory() as tmpdir:
            env_file = Path(tmpdir) / ".env"
            env_file.write_text("RUKAN_AI_PROVIDER=ollama\nOPENAI_API_KEY=\n", encoding="utf-8")

            self.assertTrue(configurar_ia_rukan.configuracion_ia_lista(env_file))

    def test_guarda_solo_la_clave_y_conserva_las_otras_variables(self):
        with TemporaryDirectory() as tmpdir:
            env_file = Path(tmpdir) / ".env"
            env_file.write_text(
                "OPENAI_MODEL=gpt-5-mini\nOPENAI_API_KEY=\nRUKAN_AI_MAX_BYTES=100\n",
                encoding="utf-8",
            )

            configurar_ia_rukan.guardar_api_key("sk-prueba-no-es-una-clave-real", env_file)

            content = env_file.read_text(encoding="utf-8")
            self.assertIn("OPENAI_MODEL=gpt-5-mini", content)
            self.assertIn("RUKAN_AI_MAX_BYTES=100", content)
            self.assertEqual(content.count("OPENAI_API_KEY="), 1)
            self.assertIn("OPENAI_API_KEY=sk-prueba-no-es-una-clave-real", content)
