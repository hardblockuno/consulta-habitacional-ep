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
        # Consulta por RUT
        response = self.client.get(f"/api/postventa/tickets/consultar/?rut={ticket.rut}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["codigo"], ticket.codigo)

        # Consulta por código
        response = self.client.get(f"/api/postventa/tickets/consultar/?codigo={ticket.codigo}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], ticket.id)

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
