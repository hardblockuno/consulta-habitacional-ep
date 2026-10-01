from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AlertaViewSet,
    DashboardCoordinacionAPIView,
    DashboardResumenAPIView,
    ImportarExcelAPIView,
    ImportarObservacionesExcelAPIView,
    LoginAPIView,
    LogoutAPIView,
    PerfilAPIView,
    PersonaViewSet,
    RegistroAPIView,
    ReportesResumenAPIView,
    RukanAIExtractionAPIView,
    RukanAIStatusAPIView,
    SistemaDiagnosticoAPIView,
    TicketPostventaViewSet,
    UsuariosGestionViewSet,
)

router = DefaultRouter()
router.register("personas", PersonaViewSet, basename="personas")
router.register("alertas", AlertaViewSet, basename="alertas")
router.register("postventa/tickets", TicketPostventaViewSet, basename="postventa-tickets")
router.register("auth/usuarios", UsuariosGestionViewSet, basename="auth-usuarios")

urlpatterns = [
    path("", include(router.urls)),
    # Autenticación y Cuentas
    path("auth/registro/", RegistroAPIView.as_view(), name="auth-registro"),
    path("auth/login/", LoginAPIView.as_view(), name="auth-login"),
    path("auth/perfil/", PerfilAPIView.as_view(), name="auth-perfil"),
    path("auth/logout/", LogoutAPIView.as_view(), name="auth-logout"),
    path("auth/diagnostico/", SistemaDiagnosticoAPIView.as_view(), name="auth-diagnostico"),
    # Dashboards de Áreas
    path("dashboard/coordinacion/", DashboardCoordinacionAPIView.as_view(), name="dashboard-coordinacion"),
    path("dashboard/resumen/", DashboardResumenAPIView.as_view(), name="dashboard-resumen"),
    path("reportes/resumen/", ReportesResumenAPIView.as_view(), name="reportes-resumen"),
    # Importaciones y OCR
    path("importar/excel/", ImportarExcelAPIView.as_view(), name="importar-excel"),
    path(
        "importar/observaciones/",
        ImportarObservacionesExcelAPIView.as_view(),
        name="importar-observaciones",
    ),
    path("rukan/ia-extraer/", RukanAIExtractionAPIView.as_view(), name="rukan-ia-extraer"),
    path("rukan/ia-estado/", RukanAIStatusAPIView.as_view(), name="rukan-ia-estado"),
]
