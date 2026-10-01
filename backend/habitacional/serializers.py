from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Ahorro,
    Alerta,
    CaracterizacionSocial,
    Comite,
    Documento,
    ImportacionExcel,
    PerfilUsuario,
    TicketPostventa,
    SugerenciaFeedback,
    Observacion,
    Persona,
    Postulacion,
    RSH,
)


class ComiteSerializer(serializers.ModelSerializer):
    total_personas = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Comite
        fields = [
            "id",
            "nombre",
            "comuna",
            "region",
            "origen",
            "activo",
            "total_personas",
            "creado_en",
            "actualizado_en",
        ]


class CaracterizacionSocialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaracterizacionSocial
        fields = [
            "comuna",
            "parentesco",
            "tipo_familia",
            "grupo_familiar",
            "integrantes",
            "hijos",
            "observaciones",
        ]


class RSHSerializer(serializers.ModelSerializer):
    class Meta:
        model = RSH
        fields = ["porcentaje", "tramo", "es_preferente", "fuente", "actualizado_en"]


class AhorroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ahorro
        fields = [
            "numero_cuenta",
            "banco",
            "monto_actual",
            "ahorro_minimo",
            "fecha_corte",
            "insuficiente",
            "actualizado_en",
        ]


class PostulacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Postulacion
        fields = ["programa", "estado", "minvu_conecta", "observaciones", "actualizado_en"]


class DocumentoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)

    class Meta:
        model = Documento
        fields = [
            "id",
            "tipo",
            "tipo_display",
            "estado",
            "estado_display",
            "fecha_vencimiento",
            "observaciones",
            "actualizado_en",
        ]


class ObservacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Observacion
        fields = ["id", "texto", "autor", "creado_en"]


class AlertaSerializer(serializers.ModelSerializer):
    persona_nombre = serializers.CharField(source="persona.nombre", read_only=True)
    persona_rut = serializers.CharField(source="persona.rut", read_only=True)
    persona_id = serializers.IntegerField(source="persona.id", read_only=True)
    comite = serializers.CharField(source="persona.comite.nombre", read_only=True)
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)
    severidad_display = serializers.CharField(source="get_severidad_display", read_only=True)

    class Meta:
        model = Alerta
        fields = [
            "id",
            "persona_id",
            "persona_nombre",
            "persona_rut",
            "comite",
            "tipo",
            "tipo_display",
            "severidad",
            "severidad_display",
            "titulo",
            "detalle",
            "activa",
            "impacta_estado",
            "origen",
            "creado_en",
        ]


class PersonaListSerializer(serializers.ModelSerializer):
    comite_nombre = serializers.CharField(source="comite.nombre", read_only=True)
    comite_comuna = serializers.CharField(source="comite.comuna", read_only=True)
    postulacion_unipersonal = serializers.SerializerMethodField()
    rsh_porcentaje = serializers.DecimalField(
        source="rsh.porcentaje",
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )
    ahorro_monto = serializers.DecimalField(
        source="ahorro.monto_actual",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    alertas_activas = serializers.IntegerField(read_only=True)

    class Meta:
        model = Persona
        fields = [
            "id",
            "rut",
            "nombre",
            "telefono",
            "correo",
            "etnia",
            "comite_nombre",
            "comite_comuna",
            "edad",
            "persona_mayor",
            "discapacidad",
            "postulacion_unipersonal",
            "estado_general",
            "rsh_porcentaje",
            "ahorro_monto",
            "alertas_activas",
        ]

    def get_postulacion_unipersonal(self, obj):
        caracterizacion = getattr(obj, "caracterizacion_social", None)
        if not caracterizacion:
            return False
        if caracterizacion.integrantes == 1:
            return True
        texto = " ".join(
            filter(
                None,
                [caracterizacion.grupo_familiar, caracterizacion.tipo_familia],
            )
        ).lower()
        return "unipersonal" in texto or "persona sola" in texto


class PersonaDetailSerializer(serializers.ModelSerializer):
    comite = ComiteSerializer(read_only=True)
    caracterizacion_social = CaracterizacionSocialSerializer(read_only=True)
    rsh = RSHSerializer(read_only=True)
    ahorro = AhorroSerializer(read_only=True)
    postulacion = PostulacionSerializer(read_only=True)
    documentos = DocumentoSerializer(many=True, read_only=True)
    observaciones = ObservacionSerializer(many=True, read_only=True)
    alertas = AlertaSerializer(many=True, read_only=True)
    postulacion_unipersonal = serializers.SerializerMethodField()

    class Meta:
        model = Persona
        fields = [
            "id",
            "rut",
            "nombre",
            "correo",
            "telefono",
            "direccion",
            "sexo",
            "estado_civil",
            "nacionalidad",
            "etnia",
            "fecha_nacimiento",
            "edad",
            "persona_mayor",
            "discapacidad",
            "neurodivergencia",
            "postulacion_unipersonal",
            "estado_general",
            "comite",
            "caracterizacion_social",
            "rsh",
            "ahorro",
            "postulacion",
            "documentos",
            "observaciones",
            "alertas",
            "datos_originales",
            "actualizado_en",
        ]

    def get_postulacion_unipersonal(self, obj):
        return PersonaListSerializer().get_postulacion_unipersonal(obj)


class ImportacionExcelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportacionExcel
        fields = [
            "id",
            "nombre_archivo",
            "hoja",
            "estado",
            "total_filas",
            "creados",
            "actualizados",
            "omitidos",
            "errores",
            "creado_en",
            "finalizado_en",
        ]


class TicketPostventaSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    urgencia_display = serializers.CharField(source="get_urgencia_display", read_only=True)

    class Meta:
        model = TicketPostventa
        fields = [
            "id",
            "codigo",
            "rut",
            "nombre",
            "telefono",
            "comite_nombre",
            "vivienda_direccion",
            "recinto",
            "descripcion",
            "foto",
            "estado",
            "estado_display",
            "urgencia",
            "urgencia_display",
            "respuesta_tecnica",
            "tecnico_responsable",
            "fecha_resolucion",
            "creado_en",
            "actualizado_en",
        ]
        read_only_fields = ["id", "codigo", "fecha_resolucion", "creado_en", "actualizado_en"]


class PerfilUsuarioSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="usuario.username", read_only=True)
    email = serializers.EmailField(source="usuario.email", read_only=True)
    rol_display = serializers.CharField(source="get_rol_display", read_only=True)
    es_admin = serializers.SerializerMethodField()

    class Meta:
        model = PerfilUsuario
        fields = [
            "id",
            "username",
            "email",
            "rol",
            "rol_display",
            "nombre_completo",
            "cargo",
            "telefono",
            "activo",
            "es_admin",
            "creado_en",
        ]

    def get_es_admin(self, obj):
        return obj.rol == PerfilUsuario.ROL_ADMIN or obj.usuario.is_superuser


class UsuarioRegistroSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    nombre_completo = serializers.CharField(max_length=255)
    rol = serializers.ChoiceField(
        choices=PerfilUsuario.ROL_CHOICES,
        default=PerfilUsuario.ROL_SOCIAL,
    )
    cargo = serializers.CharField(max_length=150, required=False, allow_blank=True)
    telefono = serializers.CharField(max_length=40, required=False, allow_blank=True)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_email(self, value):
        val = value.strip().lower()
        if not val:
            raise serializers.ValidationError("Debe indicar un correo electrónico.")
        if User.objects.filter(email__iexact=val).exists() or User.objects.filter(username__iexact=val).exists():
            raise serializers.ValidationError("Este correo ya está registrado en la plataforma.")
        return val

    def validate_rol(self, value):
        if value == PerfilUsuario.ROL_ADMIN:
            raise serializers.ValidationError(
                "El rol de Administrador / Soporte es exclusivo y no está disponible en la creación de cuentas."
            )
        return value

    def create(self, validated_data):
        email = validated_data["email"].strip().lower()
        username = (validated_data.get("username") or email).strip().lower()[:150]
        password = validated_data["password"]
        nombre_completo = validated_data.get("nombre_completo", "").strip()
        rol = validated_data.get("rol", PerfilUsuario.ROL_SOCIAL)
        cargo = validated_data.get("cargo", "").strip()
        telefono = validated_data.get("telefono", "").strip()

        # Si el username derivado ya existe por alguna razón pero no el email, asegurar unicidad
        base_username = username
        counter = 1
        while User.objects.filter(username__iexact=username).exists():
            username = f"{base_username[:140]}_{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=nombre_completo,
        )

        perfil, _ = PerfilUsuario.objects.get_or_create(usuario=user)
        perfil.rol = rol
        perfil.nombre_completo = nombre_completo
        perfil.cargo = cargo
        perfil.telefono = telefono
        perfil.activo = True
        perfil.save()

        return perfil


class SugerenciaFeedbackSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    autor_username = serializers.CharField(source="usuario.username", read_only=True)

    class Meta:
        model = SugerenciaFeedback
        fields = [
            "id",
            "usuario",
            "autor_username",
            "nombre_autor",
            "correo_autor",
            "rol_autor",
            "modulo",
            "ruta",
            "tipo",
            "tipo_display",
            "mensaje",
            "estado",
            "estado_display",
            "respuesta_soporte",
            "creado_en",
            "actualizado_en",
        ]
        read_only_fields = [
            "id",
            "usuario",
            "autor_username",
            "nombre_autor",
            "correo_autor",
            "rol_autor",
            "creado_en",
            "actualizado_en",
        ]
