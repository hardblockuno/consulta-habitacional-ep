from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import TicketPostventa


class TicketPostventaAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_crear_ticket_beneficiario(self):
        payload = {
            "rut": "12.345.678-9",
            "nombre": "Juan Pérez",
            "telefono": "+56912345678",
            "comite_nombre": "Comité Los Robles",
            "vivienda_direccion": "Casa 15 Mz B",
            "recinto": "Baño",
            "descripcion": "Filtración bajo el lavamanos",
            "urgencia": "normal",
        }
        response = self.client.post("/api/postventa/tickets/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["codigo"].startswith("PV-"))
        self.assertEqual(response.data["estado"], "recibida")
        self.assertEqual(response.data["estado_display"], "Recibida")

    def test_consultar_ticket_beneficiario(self):
        ticket = TicketPostventa.objects.create(
            rut="12.345.678-9",
            nombre="Juan Pérez",
            telefono="+56912345678",
            comite_nombre="Comité Los Robles",
            recinto="Baño",
            descripcion="Gotera en grifo",
        )
        # Consulta por RUT exacto
        response = self.client.get(f"/api/postventa/tickets/consultar/?rut={ticket.rut}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["codigo"], ticket.codigo)

        # Consulta por RUT sin puntos (12345678-9)
        response_sin_puntos = self.client.get("/api/postventa/tickets/consultar/?rut=12345678-9")
        self.assertEqual(response_sin_puntos.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_sin_puntos.data), 1)

        # Consulta por RUT sin puntos ni guión (123456789)
        response_limpio = self.client.get("/api/postventa/tickets/consultar/?rut=123456789")
        self.assertEqual(response_limpio.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_limpio.data), 1)

        # Consulta por código
        response = self.client.get(f"/api/postventa/tickets/consultar/?codigo={ticket.codigo}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], ticket.id)

    def test_multiples_recintos_ticket(self):
        payload = {
            "rut": "18.765.432-1",
            "nombre": "María Rojas",
            "telefono": "+56987654321",
            "recintos": ["Baño", "Cocina", "Techumbre / Cubierta"],
            "descripcion": "Filtración en baño y gotera en cubierta de cocina",
            "urgencia": "normal",
        }
        response = self.client.post("/api/postventa/tickets/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["recintos"]), 3)
        self.assertIn("Baño", response.data["recinto"])
        self.assertIn("Cocina", response.data["recinto"])
        self.assertIn("Techumbre", response.data["recinto"])

    def test_resolver_ticket_equipo_ep(self):
        ticket = TicketPostventa.objects.create(
            rut="12.345.678-9",
            nombre="Juan Pérez",
            telefono="+56912345678",
            descripcion="Filtración en flexible",
        )
        self.assertEqual(ticket.estado, TicketPostventa.ESTADO_RECIBIDA)

        resolver_payload = {
            "respuesta_tecnica": "Se visitó el domicilio, se sustituyó el flexible dañado y se comprobó estanqueidad.",
            "tecnico_responsable": "Carlos Muñoz - Técnico EP",
        }
        response = self.client.post(f"/api/postventa/tickets/{ticket.id}/resolver/", resolver_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["estado"], "resuelta")
        self.assertEqual(response.data["respuesta_tecnica"], resolver_payload["respuesta_tecnica"])
        self.assertIsNotNone(response.data["fecha_resolucion"])

        # Beneficiario consulta y ve la respuesta
        check_resp = self.client.get(f"/api/postventa/tickets/consultar/?codigo={ticket.codigo}")
        self.assertEqual(check_resp.data[0]["estado"], "resuelta")
        self.assertEqual(check_resp.data[0]["respuesta_tecnica"], resolver_payload["respuesta_tecnica"])

    def test_metricas_postventa(self):
        TicketPostventa.objects.create(rut="1", nombre="A", descripcion="Falla 1", estado="recibida")
        TicketPostventa.objects.create(rut="2", nombre="B", descripcion="Falla 2", estado="en_gestion")
        TicketPostventa.objects.create(rut="3", nombre="C", descripcion="Falla 3", estado="resuelta", urgencia="urgente")

        response = self.client.get("/api/postventa/tickets/resumen/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 3)
        self.assertEqual(response.data["recibidas"], 1)
        self.assertEqual(response.data["en_gestion"], 1)
        self.assertEqual(response.data["resueltas"], 1)
        self.assertEqual(response.data["urgentes"], 1)

    def test_crear_ticket_con_items_recintos(self):
        import json
        from django.core.files.uploadedfile import SimpleUploadedFile

        # Imagen GIF válida de 1x1 pixel para pasar la validación de Pillow ImageField
        gif_bytes = (
            b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9"
            b"\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
        )
        foto_bano = SimpleUploadedFile("bano.gif", gif_bytes, content_type="image/gif")
        foto_techo = SimpleUploadedFile("techo.gif", gif_bytes, content_type="image/gif")

        payload = {
            "rut": "15.999.888-7",
            "nombre": "Ana Valenzuela",
            "telefono": "+56955554444",
            "items": json.dumps([
                {
                    "recinto": "Baño",
                    "observaciones": "Filtración en flexible de lavamanos",
                    "foto_key": "item_foto_0",
                },
                {
                    "recinto": "Techumbre / Cubierta",
                    "observaciones": "Gotera cerca de cumbrera en días de lluvia",
                    "foto_key": "item_foto_1",
                },
            ]),
            "item_foto_0": foto_bano,
            "item_foto_1": foto_techo,
        }
        response = self.client.post("/api/postventa/tickets/", payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["items"]), 2)
        self.assertEqual(response.data["items"][0]["recinto"], "Baño")
        self.assertEqual(response.data["items"][0]["observaciones"], "Filtración en flexible de lavamanos")
        self.assertTrue("bano" in response.data["items"][0]["foto"])
        self.assertEqual(response.data["items"][1]["recinto"], "Techumbre / Cubierta")
        self.assertTrue("techo" in response.data["items"][1]["foto"])
        self.assertIn("Baño", response.data["recinto"])
        self.assertIn("Techumbre / Cubierta", response.data["recinto"])
