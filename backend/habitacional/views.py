from decimal import Decimal, InvalidOperation

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import mixins, parsers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Ahorro, Alerta, Documento, ImportacionExcel, Persona
from .serializers import (
    AlertaSerializer,
    ImportacionExcelSerializer,
    PersonaDetailSerializer,
    PersonaListSerializer,
)
from .services.excel_importer import ImportacionError, importar_excel


class PersonaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Persona.objects.select_related(
            "comite",
            "caracterizacion_social",
            "rsh",
            "ahorro",
            "postulacion",
        )
        .prefetch_related("documentos", "observaciones", "alertas")
        .annotate(alertas_activas=Count("alertas", filter=Q(alertas__activa=True)))
    )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PersonaDetailSerializer
        return PersonaListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        q = self.request.query_params.get("q", "").strip()
        estado = self.request.query_params.get("estado", "").strip()
        comite = self.request.query_params.get("comite", "").strip()
        if q:
            queryset = queryset.filter(
                Q(rut__icontains=q)
                | Q(nombre__icontains=q)
                | Q(telefono__icontains=q)
                | Q(comite__nombre__icontains=q)
            )
        if estado:
            queryset = queryset.filter(estado_general=estado)
        if comite:
            queryset = queryset.filter(comite__nombre__icontains=comite)
        return queryset

    @action(detail=False, methods=["get"], url_path="buscar")
    def buscar(self, request):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ImportarExcelAPIView(APIView):
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        archivo = request.FILES.get("archivo")
        if not archivo:
            return Response(
                {"detail": "Debes adjuntar un archivo Excel en el campo 'archivo'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            ahorro_minimo = Decimal(request.data.get("ahorro_minimo") or "10")
        except (InvalidOperation, TypeError):
            return Response(
                {"detail": "ahorro_minimo debe ser un numero valido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        importacion = ImportacionExcel.objects.create(
            archivo=archivo,
            nombre_archivo=archivo.name,
        )

        try:
            resultado = importar_excel(
                importacion=importacion,
                archivo_path=importacion.archivo.path,
                comite_nombre=request.data.get("comite_nombre", "").strip(),
                comuna=request.data.get("comuna", "").strip(),
                ahorro_minimo=ahorro_minimo,
            )
        except ImportacionError as exc:
            importacion.estado = ImportacionExcel.ESTADO_ERROR
            importacion.errores = [{"fila": None, "error": str(exc)}]
            importacion.finalizado_en = timezone.now()
            importacion.save(
                update_fields=["estado", "errores", "finalizado_en", "actualizado_en"]
            )
            return Response(
                ImportacionExcelSerializer(importacion).data,
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ImportacionExcelSerializer(resultado)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DashboardResumenAPIView(APIView):
    def get(self, request):
        return Response(dashboard_resumen_data())


class AlertaViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = AlertaSerializer

    def get_queryset(self):
        queryset = Alerta.objects.select_related("persona", "persona__comite")
        activa = self.request.query_params.get("activa", "1")
        severidad = self.request.query_params.get("severidad", "").strip()
        tipo = self.request.query_params.get("tipo", "").strip()
        q = self.request.query_params.get("q", "").strip()
        if activa in {"1", "true", "True"}:
            queryset = queryset.filter(activa=True)
        if severidad:
            queryset = queryset.filter(severidad=severidad)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        if q:
            queryset = queryset.filter(
                Q(titulo__icontains=q)
                | Q(detalle__icontains=q)
                | Q(persona__nombre__icontains=q)
                | Q(persona__rut__icontains=q)
                | Q(persona__comite__nombre__icontains=q)
            )
        return queryset


class ReportesResumenAPIView(APIView):
    def get(self, request):
        resumen = dashboard_resumen_data()
        resumen["documentos"] = list(
            Documento.objects.values("tipo", "estado")
            .annotate(total=Count("id"))
            .order_by("tipo", "estado")
        )
        resumen["alertas_por_tipo"] = list(
            Alerta.objects.filter(activa=True)
            .values("tipo", "severidad")
            .annotate(total=Count("id"))
            .order_by("tipo", "severidad")
        )
        return Response(resumen)


def dashboard_resumen_data():
    personas = Persona.objects.all()
    alertas_activas = Alerta.objects.filter(activa=True)
    return {
        "total_personas": personas.count(),
        "personas_aptas": personas.filter(estado_general=Persona.ESTADO_APTA).count(),
        "observadas": personas.filter(estado_general=Persona.ESTADO_OBSERVADA).count(),
        "bloqueadas": personas.filter(estado_general=Persona.ESTADO_BLOQUEADA).count(),
        "personas_mayores": personas.filter(persona_mayor=True).count(),
        "discapacidad": personas.filter(discapacidad=True).count(),
        "rsh_sobre_40": personas.filter(rsh__porcentaje__gt=40).count(),
        "ahorro_insuficiente": Ahorro.objects.filter(insuficiente=True).count(),
        "cedulas_vencidas": Documento.objects.filter(
            tipo=Documento.TIPO_CEDULA,
            estado=Documento.ESTADO_VENCIDO,
        ).count(),
        "alertas_criticas": alertas_activas.filter(
            severidad=Alerta.SEVERIDAD_CRITICA
        ).count(),
        "alertas_preventivas": alertas_activas.filter(
            severidad=Alerta.SEVERIDAD_PREVENTIVA
        ).count(),
        "por_comite": list(
            personas.values("comite__nombre")
            .annotate(total=Count("id"))
            .order_by("-total")[:10]
        ),
        "por_estado": list(
            personas.values("estado_general")
            .annotate(total=Count("id"))
            .order_by("estado_general")
        ),
    }
