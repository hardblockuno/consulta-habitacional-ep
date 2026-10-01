from decimal import Decimal, InvalidOperation

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import mixins, parsers, permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Ahorro,
    Alerta,
    Comite,
    Documento,
    ImportacionExcel,
    PerfilUsuario,
    Persona,
    TicketPostventa,
)
from .serializers import (
    AlertaSerializer,
    ImportacionExcelSerializer,
    PerfilUsuarioSerializer,
    PersonaDetailSerializer,
    PersonaListSerializer,
    TicketPostventaSerializer,
    UsuarioRegistroSerializer,
)
from .services.excel_importer import (
    ImportacionError,
    importar_excel,
    importar_observaciones_excel,
)
from .services.rukan_ai import (
    RukanAIConfigurationError,
    RukanAIError,
    RukanAIQuotaError,
    extraer_rukan_con_ia,
    rukan_ai_status,
)


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
        filtro = self.request.query_params.get("filtro", "").strip()
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
        if filtro == "cedulas_revision":
            queryset = queryset.filter(
                documentos__tipo=Documento.TIPO_CEDULA,
                documentos__estado__in=[
                    Documento.ESTADO_VENCIDO,
                    Documento.ESTADO_POR_VENCER,
                ],
            ).distinct()
        elif filtro == "adultos_mayores":
            queryset = queryset.filter(persona_mayor=True)
        elif filtro == "discapacidad":
            queryset = queryset.filter(discapacidad=True)
        elif filtro == "etnia":
            queryset = filter_personas_con_etnia(queryset)
        elif filtro == "unipersonal":
            queryset = filter_personas_unipersonales(queryset)
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
                {"detail": "ahorro_minimo debe ser un número válido."},
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


class ImportarObservacionesExcelAPIView(APIView):
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        archivo = request.FILES.get("archivo")
        if not archivo:
            return Response(
                {"detail": "Debes adjuntar un archivo Excel en el campo 'archivo'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        importacion = ImportacionExcel.objects.create(
            archivo=archivo,
            nombre_archivo=archivo.name,
        )

        try:
            resultado = importar_observaciones_excel(
                importacion=importacion,
                archivo_path=importacion.archivo.path,
                comite_nombre=request.data.get("comite_nombre", "").strip(),
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


class RukanAIExtractionAPIView(APIView):
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        archivo = request.FILES.get("archivo")
        if not archivo:
            return Response(
                {"detail": "Debes adjuntar un PDF Rukan en el campo 'archivo'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resultado = extraer_rukan_con_ia(archivo, archivo.name)
        except RukanAIConfigurationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except RukanAIQuotaError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except RukanAIError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(resultado, status=status.HTTP_200_OK)


class RukanAIStatusAPIView(APIView):
    def get(self, request):
        try:
            return Response(rukan_ai_status())
        except RukanAIConfigurationError as exc:
            return Response(
                {"provider": "unknown", "available": False, "message": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class DashboardResumenAPIView(APIView):
    def get(self, request):
        comite = request.query_params.get("comite", "").strip()
        return Response(dashboard_resumen_data(comite=comite))


class AlertaViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = AlertaSerializer

    def get_queryset(self):
        queryset = Alerta.objects.select_related("persona", "persona__comite")
        activa = self.request.query_params.get("activa", "1")
        severidad = self.request.query_params.get("severidad", "").strip()
        tipo = self.request.query_params.get("tipo", "").strip()
        q = self.request.query_params.get("q", "").strip()
        comite = self.request.query_params.get("comite", "").strip()
        if activa in {"1", "true", "True"}:
            queryset = queryset.filter(activa=True)
        if severidad:
            queryset = queryset.filter(severidad=severidad)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        if comite:
            queryset = queryset.filter(persona__comite__nombre__icontains=comite)
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
        comite = request.query_params.get("comite", "").strip()
        resumen = dashboard_resumen_data(comite=comite)
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


def dashboard_resumen_data(comite=None):
    personas = Persona.objects.all()
    alertas_activas = Alerta.objects.filter(activa=True)
    if comite:
        personas = personas.filter(comite__nombre__iexact=comite)
        alertas_activas = alertas_activas.filter(persona__comite__nombre__iexact=comite)

    # Detalle enriquecido por cada comité registrado
    comites_qs = Comite.objects.all().order_by("nombre")
    comites_resumen = []
    for c in comites_qs:
        c_pers = c.personas.all()
        c_total = c_pers.count()
        if c_total == 0:
            continue
        c_aptas = c_pers.filter(estado_general=Persona.ESTADO_APTA).count()
        c_observadas = c_pers.filter(estado_general=Persona.ESTADO_OBSERVADA).count()
        c_bloqueadas = c_pers.filter(estado_general=Persona.ESTADO_BLOQUEADA).count()
        c_mayores = c_pers.filter(persona_mayor=True).count()
        c_disc = c_pers.filter(discapacidad=True).count()
        c_etnia = filter_personas_con_etnia(c_pers).count()
        c_unip = filter_personas_unipersonales(c_pers).count()
        c_rsh_pref = c_pers.filter(rsh__porcentaje__lte=40).count()
        c_ahorro_prom = (
            c_pers.filter(ahorro__monto_uf__gt=0).aggregate(prom=Avg("ahorro__monto_uf"))["prom"]
            or 0
        )
        c_cedulas_rev = Documento.objects.filter(
            persona__comite=c,
            tipo=Documento.TIPO_CEDULA,
            estado__in=[Documento.ESTADO_VENCIDO, Documento.ESTADO_POR_VENCER],
        ).count()

        comites_resumen.append(
            {
                "id": c.id,
                "nombre": c.nombre,
                "comuna": c.comuna,
                "total_personas": c_total,
                "aptas": c_aptas,
                "observadas": c_observadas,
                "bloqueadas": c_bloqueadas,
                "porcentaje_aptos": round((c_aptas / c_total) * 100) if c_total > 0 else 0,
                "personas_mayores": c_mayores,
                "discapacidad": c_disc,
                "etnia": c_etnia,
                "unipersonales": c_unip,
                "rsh_preferente": c_rsh_pref,
                "ahorro_promedio_uf": round(float(c_ahorro_prom), 1),
                "cedulas_revision": c_cedulas_rev,
            }
        )

    return {
        "comite_filtrado": comite or None,
        "total_personas": personas.count(),
        "personas_aptas": personas.filter(estado_general=Persona.ESTADO_APTA).count(),
        "observadas": personas.filter(estado_general=Persona.ESTADO_OBSERVADA).count(),
        "bloqueadas": personas.filter(estado_general=Persona.ESTADO_BLOQUEADA).count(),
        "personas_mayores": personas.filter(persona_mayor=True).count(),
        "discapacidad": personas.filter(discapacidad=True).count(),
        "etnia": filter_personas_con_etnia(personas).count(),
        "unipersonales": filter_personas_unipersonales(personas).count(),
        "hijos_revision_18": count_personas_con_hijos_revision(personas),
        "cedulas_revision": Documento.objects.filter(
            persona__in=personas,
            tipo=Documento.TIPO_CEDULA,
            estado__in=[Documento.ESTADO_VENCIDO, Documento.ESTADO_POR_VENCER],
        ).count(),
        "rsh_sobre_40": personas.filter(rsh__porcentaje__gt=40).count(),
        "ahorro_insuficiente": Ahorro.objects.filter(persona__in=personas, insuficiente=True).count(),
        "cedulas_vencidas": Documento.objects.filter(
            persona__in=personas,
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
        "comites_resumen": comites_resumen,
    }


def filter_personas_con_etnia(queryset):
    return (
        queryset.exclude(etnia__isnull=True)
        .exclude(etnia__exact="")
        .exclude(etnia__iexact="no")
        .exclude(etnia__iexact="ninguna")
        .exclude(etnia__iexact="ninguno")
        .exclude(etnia__iexact="sin dato")
        .exclude(etnia__iexact="no aplica")
        .exclude(etnia__iexact="no informado")
        .exclude(etnia__iexact="no informada")
    )


def filter_personas_unipersonales(queryset):
    return queryset.filter(
        Q(caracterizacion_social__integrantes=1)
        | Q(caracterizacion_social__grupo_familiar__icontains="unipersonal")
        | Q(caracterizacion_social__tipo_familia__icontains="unipersonal")
        | Q(caracterizacion_social__grupo_familiar__icontains="persona sola")
        | Q(caracterizacion_social__tipo_familia__icontains="persona sola")
    ).distinct()


def count_personas_con_hijos_revision(personas):
    total = 0
    for persona in personas.select_related("caracterizacion_social"):
        caracterizacion = getattr(persona, "caracterizacion_social", None)
        hijos = getattr(caracterizacion, "hijos", []) or []
        if any(hijo.get("requiere_revision_documental") for hijo in hijos):
            total += 1
    return total



class TicketPostventaViewSet(viewsets.ModelViewSet):
    queryset = TicketPostventa.objects.all()
    serializer_class = TicketPostventaSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        queryset = super().get_queryset()
        estado = self.request.query_params.get("estado", "").strip()
        urgencia = self.request.query_params.get("urgencia", "").strip()
        q = self.request.query_params.get("q", "").strip()

        if estado:
            queryset = queryset.filter(estado=estado)
        if urgencia:
            queryset = queryset.filter(urgencia=urgencia)
        if q:
            queryset = queryset.filter(
                Q(codigo__icontains=q)
                | Q(rut__icontains=q)
                | Q(nombre__icontains=q)
                | Q(telefono__icontains=q)
                | Q(comite_nombre__icontains=q)
                | Q(vivienda_direccion__icontains=q)
                | Q(recinto__icontains=q)
                | Q(descripcion__icontains=q)
            )
        return queryset

    @action(detail=False, methods=["get"])
    def consultar(self, request):
        rut = request.query_params.get("rut", "").strip()
        codigo = request.query_params.get("codigo", "").strip()

        if not rut and not codigo:
            return Response(
                {"detail": "Debe indicar RUT o Código de solicitud para consultar."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset()
        if codigo:
            queryset = queryset.filter(codigo__iexact=codigo)
        elif rut:
            clean_rut = rut.replace(".", "").replace(" ", "").upper()
            queryset = queryset.filter(
                Q(rut__iexact=rut)
                | Q(rut__icontains=clean_rut)
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def resolver(self, request, pk=None):
        ticket = self.get_object()
        respuesta = request.data.get("respuesta_tecnica", "").strip()
        tecnico = request.data.get("tecnico_responsable", "").strip()

        if not respuesta:
            return Response(
                {"detail": "Debe ingresar una respuesta o solución técnica."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket.respuesta_tecnica = respuesta
        if tecnico:
            ticket.tecnico_responsable = tecnico
        ticket.estado = TicketPostventa.ESTADO_RESUELTA
        ticket.save()

        serializer = self.get_serializer(ticket)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def resumen(self, request):
        total = TicketPostventa.objects.count()
        recibidas = TicketPostventa.objects.filter(estado=TicketPostventa.ESTADO_RECIBIDA).count()
        en_gestion = TicketPostventa.objects.filter(estado=TicketPostventa.ESTADO_EN_GESTION).count()
        resueltas = TicketPostventa.objects.filter(estado=TicketPostventa.ESTADO_RESUELTA).count()
        urgentes = TicketPostventa.objects.filter(urgencia=TicketPostventa.URGENCIA_URGENTE).count()

        return Response({
            "total": total,
            "recibidas": recibidas,
            "en_gestion": en_gestion,
            "resueltas": resueltas,
            "urgentes": urgentes,
        })


class RegistroAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UsuarioRegistroSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        perfil = serializer.save()
        token, _ = Token.objects.get_or_create(user=perfil.usuario)
        return Response(
            {
                "token": token.key,
                "usuario": PerfilUsuarioSerializer(perfil).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identificador = str(request.data.get("email") or request.data.get("username", "")).strip()
        password = str(request.data.get("password", "")).strip()

        if not identificador or not password:
            return Response(
                {"detail": "Debe ingresar su correo electrónico y contraseña."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        matched_user = User.objects.filter(
            Q(email__iexact=identificador) | Q(username__iexact=identificador)
        ).first()

        username = matched_user.username if matched_user else identificador
        user = authenticate(username=username, password=password)
        if not user:
            return Response(
                {"detail": "Credenciales inválidas. Verifique correo y contraseña."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"detail": "La cuenta se encuentra inactiva. Contacte al administrador."},
                status=status.HTTP_403_FORBIDDEN,
            )

        perfil, _ = PerfilUsuario.objects.get_or_create(
            usuario=user,
            defaults={
                "rol": PerfilUsuario.ROL_ADMIN if user.is_superuser else PerfilUsuario.ROL_SOCIAL,
                "nombre_completo": user.get_full_name() or user.username,
            },
        )

        if not perfil.activo:
            return Response(
                {"detail": "El perfil de usuario se encuentra suspendido."},
                status=status.HTTP_403_FORBIDDEN,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "usuario": PerfilUsuarioSerializer(perfil).data,
        })


class PerfilAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        perfil, _ = PerfilUsuario.objects.get_or_create(
            usuario=request.user,
            defaults={
                "rol": PerfilUsuario.ROL_ADMIN if request.user.is_superuser else PerfilUsuario.ROL_SOCIAL,
                "nombre_completo": request.user.get_full_name() or request.user.username,
            },
        )
        return Response(PerfilUsuarioSerializer(perfil).data)


class LogoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"detail": "Sesión cerrada correctamente."})


class IsAdminOrDev(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        perfil = getattr(request.user, "perfil", None)
        return bool(perfil and perfil.rol == PerfilUsuario.ROL_ADMIN)


class UsuariosGestionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrDev]
    queryset = PerfilUsuario.objects.select_related("usuario").all().order_by("-creado_en")
    serializer_class = PerfilUsuarioSerializer

    def update(self, request, *args, **kwargs):
        perfil = self.get_object()
        rol = request.data.get("rol")
        activo = request.data.get("activo")
        cargo = request.data.get("cargo")
        telefono = request.data.get("telefono")
        nombre_completo = request.data.get("nombre_completo")

        if rol in dict(PerfilUsuario.ROL_CHOICES):
            if rol == PerfilUsuario.ROL_ADMIN and PerfilUsuario.objects.filter(rol=PerfilUsuario.ROL_ADMIN).exclude(id=perfil.id).exists():
                return Response(
                    {"detail": "Solo puede existir un único Administrador en la plataforma."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            perfil.rol = rol
        if activo is not None:
            perfil.activo = bool(activo)
            perfil.usuario.is_active = bool(activo)
            perfil.usuario.save(update_fields=["is_active"])
        if cargo is not None:
            perfil.cargo = str(cargo).strip()
        if telefono is not None:
            perfil.telefono = str(telefono).strip()
        if nombre_completo is not None:
            perfil.nombre_completo = str(nombre_completo).strip()
            perfil.usuario.first_name = perfil.nombre_completo
            perfil.usuario.save(update_fields=["first_name"])

        perfil.save()
        return Response(PerfilUsuarioSerializer(perfil).data)

    @action(detail=True, methods=["post"])
    def reset_password(self, request, pk=None):
        perfil = self.get_object()
        nueva_password = request.data.get("nueva_password", "").strip()
        if len(nueva_password) < 6:
            return Response(
                {"detail": "La nueva contraseña debe tener al menos 6 caracteres."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        perfil.usuario.set_password(nueva_password)
        perfil.usuario.save()
        Token.objects.filter(user=perfil.usuario).delete()
        return Response({"detail": f"Contraseña actualizada para {perfil.usuario.username}."})


class SistemaDiagnosticoAPIView(APIView):
    permission_classes = [IsAdminOrDev]

    def get(self, request):
        from django.conf import settings
        import sys

        ocr_status = {}
        try:
            ocr_status = rukan_ai_status()
        except Exception as exc:
            ocr_status = {"disponible": False, "error": str(exc)}

        total_usuarios = User.objects.count()
        usuarios_por_rol = list(
            PerfilUsuario.objects.values("rol")
            .annotate(total=Count("id"))
            .order_by("rol")
        )

        db_engine = settings.DATABASES["default"]["ENGINE"].split(".")[-1]

        return Response({
            "sistema": {
                "plataforma": "Plan Social · Sistema EP",
                "version": "1.2.0",
                "python": sys.version.split()[0],
                "base_datos": db_engine,
                "debug_activo": settings.DEBUG,
                "timezone": settings.TIME_ZONE,
                "servidor_tiempo": timezone.now().isoformat(),
            },
            "estadisticas_globales": {
                "total_comites": Comite.objects.count(),
                "total_personas": Persona.objects.count(),
                "total_documentos": Documento.objects.count(),
                "total_alertas_activas": Alerta.objects.filter(activa=True).count(),
                "total_tickets_postventa": TicketPostventa.objects.count(),
                "total_usuarios": total_usuarios,
                "usuarios_por_rol": usuarios_por_rol,
            },
            "motor_ocr_rukan": ocr_status,
        })


class DashboardCoordinacionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        resumen_gral = dashboard_resumen_data()
        tickets_resumen = {
            "total": TicketPostventa.objects.count(),
            "recibidas": TicketPostventa.objects.filter(estado=TicketPostventa.ESTADO_RECIBIDA).count(),
            "en_gestion": TicketPostventa.objects.filter(estado=TicketPostventa.ESTADO_EN_GESTION).count(),
            "resueltas": TicketPostventa.objects.filter(estado=TicketPostventa.ESTADO_RESUELTA).count(),
            "urgentes": TicketPostventa.objects.filter(urgencia=TicketPostventa.URGENCIA_URGENTE).count(),
        }

        total_ahorro = Ahorro.objects.aggregate(total=Avg("monto_actual"))["total"] or Decimal("0")

        return Response({
            "general": resumen_gral,
            "postventa": tickets_resumen,
            "metricas_ejecutivas": {
                "comites_activos": Comite.objects.filter(activo=True).count(),
                "total_familias": resumen_gral["total_personas"],
                "familias_aptas": resumen_gral["personas_aptas"],
                "porcentaje_aptos": round((resumen_gral["personas_aptas"] / resumen_gral["total_personas"] * 100), 1) if resumen_gral["total_personas"] > 0 else 0,
                "observadas": resumen_gral["observadas"],
                "bloqueadas": resumen_gral["bloqueadas"],
                "alertas_criticas": resumen_gral["alertas_criticas"],
                "ahorro_insuficiente": resumen_gral["ahorro_insuficiente"],
            },
            "comites": resumen_gral.get("comites_resumen", []),
        })

