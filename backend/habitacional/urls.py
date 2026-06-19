from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AlertaViewSet,
    DashboardResumenAPIView,
    ImportarExcelAPIView,
    ImportarObservacionesExcelAPIView,
    PersonaViewSet,
    ReportesResumenAPIView,
    RukanAIExtractionAPIView,
    RukanAIStatusAPIView,
)

router = DefaultRouter()
router.register("personas", PersonaViewSet, basename="personas")
router.register("alertas", AlertaViewSet, basename="alertas")

urlpatterns = [
    path("", include(router.urls)),
    path("importar/excel/", ImportarExcelAPIView.as_view(), name="importar-excel"),
    path(
        "importar/observaciones/",
        ImportarObservacionesExcelAPIView.as_view(),
        name="importar-observaciones",
    ),
    path("rukan/ia-extraer/", RukanAIExtractionAPIView.as_view(), name="rukan-ia-extraer"),
    path("rukan/ia-estado/", RukanAIStatusAPIView.as_view(), name="rukan-ia-estado"),
    path("dashboard/resumen/", DashboardResumenAPIView.as_view(), name="dashboard-resumen"),
    path("reportes/resumen/", ReportesResumenAPIView.as_view(), name="reportes-resumen"),
]
