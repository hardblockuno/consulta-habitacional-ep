from rest_framework import serializers

from .models import (
    Ahorro,
    Alerta,
    CaracterizacionSocial,
    Comite,
    Documento,
    ImportacionExcel,
    Observacion,
    Persona,
    Postulacion,
    RSH,
)


class ComiteSerializer(serializers.ModelSerializer):
    total_personas = serializers.IntegerField(read_only=True)

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
            "comite_nombre",
            "comite_comuna",
            "edad",
            "persona_mayor",
            "discapacidad",
            "estado_general",
            "rsh_porcentaje",
            "ahorro_monto",
            "alertas_activas",
        ]


class PersonaDetailSerializer(serializers.ModelSerializer):
    comite = ComiteSerializer(read_only=True)
    caracterizacion_social = CaracterizacionSocialSerializer(read_only=True)
    rsh = RSHSerializer(read_only=True)
    ahorro = AhorroSerializer(read_only=True)
    postulacion = PostulacionSerializer(read_only=True)
    documentos = DocumentoSerializer(many=True, read_only=True)
    observaciones = ObservacionSerializer(many=True, read_only=True)
    alertas = AlertaSerializer(many=True, read_only=True)

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
