"""Vistas de API REST para el módulo Ecobarrios D.S. 10."""

import json
from django.http import HttpResponse
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .services.ecobarrios.expediente_service import (
    analizar_excel_ecobarrios,
    generar_documento_individual,
    generar_expediente_zip,
    generar_plantilla_modelo_excel,
    redactar_textos_at6,
)


class EcobarriosPlantillaModeloAPIView(APIView):
    """Descarga la plantilla oficial estandarizada de nómina Excel D.S. 10."""
    permission_classes = (permissions.AllowAny,)

    def get(self, request, *args, **kwargs):
        try:
            buf = generar_plantilla_modelo_excel()
            response = HttpResponse(
                buf.getvalue(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            response["Content-Disposition"] = 'attachment; filename="Plantilla_Oficial_Comite_DS10.xlsx"'
            response["Access-Control-Expose-Headers"] = "Content-Disposition"
            return response
        except Exception as e:
            return Response(
                {"error": f"Error al generar la plantilla: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EcobarriosRedactarAT6IAAPIView(APIView):
    """Redacta con IA (Gemini) o motor experto local los textos técnicos para las Tablas 26, 30 y 31 del AT-6."""
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        datos = {
            "comite_nombre": request.data.get("comite_nombre", ""),
            "comuna": request.data.get("comuna", ""),
            "codigo_expediente": request.data.get("codigo_expediente", ""),
            "total_familias": request.data.get("total_familias", 0),
            "total_personas": request.data.get("total_personas", 0),
            "familias_mapuche": request.data.get("familias_mapuche", request.data.get("conadi", 0)),
            "pct_mapuche": request.data.get("pct_mapuche", request.data.get("pct_conadi", 0)),
            "familias_con_discapacidad": request.data.get("familias_con_discapacidad", request.data.get("discapacidad", 0)),
            "viviendas_3d": request.data.get("viviendas_3d", 0),
            "recintos_bodega": request.data.get("recintos_bodega", 0),
            "recintos_productivo": request.data.get("recintos_productivo", 1),
        }
        preguntas = {
            "agua_potable": request.data.get("agua_potable", ""),
            "alcantarillado": request.data.get("alcantarillado", ""),
            "electricidad": request.data.get("electricidad", ""),
            "terreno_calle": request.data.get("terreno_calle", ""),
            "terreno_rol": request.data.get("terreno_rol", ""),
            "terreno_lote": request.data.get("terreno_lote", ""),
            "terreno_localidad": request.data.get("terreno_localidad", ""),
            "topografia": request.data.get("topografia", ""),
            "riesgos": request.data.get("riesgos", ""),
            "enfoque_social": request.data.get("enfoque_social", ""),
        }
        try:
            resultado = redactar_textos_at6(datos, preguntas)
            return Response(resultado, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Error al redactar textos con IA: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
        except (ValueError, FileNotFoundError) as ve:
            return Response(
                {"error": str(ve)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Error al procesar la planilla: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
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
            "comite_nombre": request.data.get("comite_nombre", "").strip(),
            "codigo_expediente": request.data.get("codigo_expediente", "").strip(),
            "comuna": request.data.get("comuna", "").strip(),
            "egr_nombre": request.data.get("egr_nombre", "").strip() or "CONSULTORA PLAN SOCIAL LIMITADA",
            "egr_rut": request.data.get("egr_rut", "").strip() or "77.235.354-5",
            "arquitecto": request.data.get("arquitecto", "").strip() or "Vanessa Schneider Martínez",
            "trabajador_social": request.data.get("trabajador_social", "").strip() or "Erica Reyes Peña",
            "abogado": request.data.get("abogado", "").strip() or "Rodrigo Pedreros",
            "terreno_calle": request.data.get("terreno_calle", "").strip(),
            "terreno_rol": request.data.get("terreno_rol", "").strip(),
            "terreno_lote": request.data.get("terreno_lote", "").strip(),
            "terreno_localidad": request.data.get("terreno_localidad", "").strip(),
            "obs_servicios_basicos": request.data.get("obs_servicios_basicos", "").strip(),
            "riesgos_naturales": request.data.get("riesgos_naturales", "").strip(),
            "opinion_profesional": request.data.get("opinion_profesional", "").strip(),
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


class EcobarriosDocumentoIndividualAPIView(APIView):
    """Genera y descarga un documento individual específico (AT-6, Nómina, Compromiso o PHR 6.1)."""
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        archivo = request.FILES.get("archivo")
        if not archivo:
            return Response(
                {"error": "Debe enviar un archivo Excel en el campo 'archivo'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tipo = request.data.get("tipo", "at6").strip().lower()
        rut = request.data.get("rut", "").strip()

        metadata = {
            "comite_nombre": request.data.get("comite_nombre", "").strip(),
            "codigo_expediente": request.data.get("codigo_expediente", "").strip(),
            "comuna": request.data.get("comuna", "").strip(),
            "egr_nombre": request.data.get("egr_nombre", "").strip() or "CONSULTORA PLAN SOCIAL LIMITADA",
            "egr_rut": request.data.get("egr_rut", "").strip() or "77.235.354-5",
            "arquitecto": request.data.get("arquitecto", "").strip() or "Vanessa Schneider Martínez",
            "trabajador_social": request.data.get("trabajador_social", "").strip() or "Erica Reyes Peña",
            "abogado": request.data.get("abogado", "").strip() or "Rodrigo Pedreros",
            "terreno_calle": request.data.get("terreno_calle", "").strip(),
            "terreno_rol": request.data.get("terreno_rol", "").strip(),
            "terreno_lote": request.data.get("terreno_lote", "").strip(),
            "terreno_localidad": request.data.get("terreno_localidad", "").strip(),
            "obs_servicios_basicos": request.data.get("obs_servicios_basicos", "").strip(),
            "riesgos_naturales": request.data.get("riesgos_naturales", "").strip(),
            "opinion_profesional": request.data.get("opinion_profesional", "").strip(),
        }

        try:
            doc_buf, filename = generar_documento_individual(
                archivo,
                tipo=tipo,
                rut_o_n=rut if rut else None,
                metadata=metadata,
            )
            response = HttpResponse(
                doc_buf.getvalue(),
                content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            response["Access-Control-Expose-Headers"] = "Content-Disposition"
            return response
        except ValueError as ve:
            return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": f"Error al generar documento individual ({tipo}): {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

