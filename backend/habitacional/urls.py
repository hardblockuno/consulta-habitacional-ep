from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AlertaViewSet,
    DashboardResumenAPIView,
    ImportarExcelAPIView,
    ImportarObservacionesExcelAPIView,
    PersonaViewSet,
    ReportesResumenAPIView,
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
    path("dashboard/resumen/", DashboardResumenAPIView.as_view(), name="dashboard-resumen"),
    path("reportes/resumen/", ReportesResumenAPIView.as_view(), name="reportes-resumen"),
]
