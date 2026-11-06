"""Vistas de API REST para el módulo Ecobarrios D.S. 10."""

import json
from django.http import HttpResponse
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .services.ecobarrios.expediente_service import (
    analizar_excel_ecobarrios,
    generar_expediente_zip,
)


class EcobarriosAnalizarAPIView(APIView):
    """Analiza una planilla Excel y devuelve las métricas oficiales D.S. 10."""
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        archivo = request.FILES.get("archivo")
        if not archivo:
            return Response(
                {"error": "Debe enviar un archivo Excel en el campo 'archivo'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            resumen = analizar_excel_ecobarrios(archivo)
            return Response(resumen, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Error al analizar el archivo Excel: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EcobarriosGenerarExpedienteAPIView(APIView):
    """Genera el paquete completo de expedientes D.S. 10 y lo entrega como archivo ZIP."""
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        archivo = request.FILES.get("archivo")
        if not archivo:
            return Response(
                {"error": "Debe enviar un archivo Excel en el campo 'archivo'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        metadata = {
            "comite_nombre": request.data.get("comite_nombre", "Comité de Vivienda Ecobarrios").strip(),
            "codigo_expediente": request.data.get("codigo_expediente", "En trámite").strip(),
            "comuna": request.data.get("comuna", "Perquenco").strip(),
            "egr_nombre": request.data.get("egr_nombre", "CONSULTORA PLAN SOCIAL LIMITADA").strip(),
            "egr_rut": request.data.get("egr_rut", "77.235.354-5").strip(),
            "arquitecto": request.data.get("arquitecto", "Vanessa Schneider Martínez").strip(),
            "trabajador_social": request.data.get("trabajador_social", "Erica Reyes Peña").strip(),
            "abogado": request.data.get("abogado", "Rodrigo Pedreros").strip(),
        }

        try:
            zip_buf, zip_name = generar_expediente_zip(archivo, metadata)
            response = HttpResponse(zip_buf.getvalue(), content_type="application/zip")
            response["Content-Disposition"] = f'attachment; filename="{zip_name}"'
            response["Access-Control-Expose-Headers"] = "Content-Disposition"
            return response
        except Exception as e:
            return Response(
                {"error": f"Error al generar el expediente: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
