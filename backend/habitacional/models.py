from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class TimeStampedModel(models.Model):
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Comite(TimeStampedModel):
    DECRETO_DS49 = "DS49"
    DECRETO_DS01 = "DS01"
    DECRETO_DS19 = "DS19"
    DECRETO_DS27 = "DS27"
    DECRETO_DS10 = "DS10"
    DECRETO_CHOICES = [
        (DECRETO_DS49, "DS49 · Fondo Solidario de Elección de Vivienda"),
        (DECRETO_DS01, "DS01 · Sectores Medios (Tramos 1, 2 y 3)"),
        (DECRETO_DS19, "DS19 · Integración Social y Territorial"),
        (DECRETO_DS27, "DS27 · Mejoramiento de Vivienda y Barrios"),
        (DECRETO_DS10, "DS10 · Habitabilidad Rural"),
    ]

    nombre = models.CharField(max_length=255)
    comuna = models.CharField(max_length=120, blank=True)
    region = models.CharField(max_length=120, blank=True, default="La Araucania")
    origen = models.CharField(max_length=255, blank=True)
    decreto = models.CharField(
        max_length=20,
        choices=DECRETO_CHOICES,
        default=DECRETO_DS49,
        db_index=True,
    )
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ["nombre"]
        constraints = [
            models.UniqueConstraint(
                fields=["nombre", "comuna"],
                name="uniq_comite_nombre_comuna",
            )
        ]

    def __str__(self):
        return f"{self.nombre} ({self.decreto})"



class Persona(TimeStampedModel):
    ESTADO_APTA = "apta"
    ESTADO_OBSERVADA = "observada"
    ESTADO_BLOQUEADA = "bloqueada"
    ESTADO_CHOICES = [
        (ESTADO_APTA, "Apta"),
        (ESTADO_OBSERVADA, "Observada"),
        (ESTADO_BLOQUEADA, "Bloqueada"),
    ]

    comite = models.ForeignKey(Comite, related_name="personas", on_delete=models.PROTECT)
    rut = models.CharField(max_length=16, unique=True, db_index=True)
    nombre = models.CharField(max_length=255, db_index=True)
    correo = models.EmailField(blank=True)
    telefono = models.CharField(max_length=40, blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    sexo = models.CharField(max_length=30, blank=True)
    estado_civil = models.CharField(max_length=80, blank=True)
    nacionalidad = models.CharField(max_length=80, blank=True)
    etnia = models.CharField(max_length=120, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    edad = models.PositiveSmallIntegerField(null=True, blank=True)
    persona_mayor = models.BooleanField(default=False)
    discapacidad = models.BooleanField(default=False)
    neurodivergencia = models.BooleanField(default=False)
    estado_general = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default=ESTADO_APTA,
        db_index=True,
    )
    datos_originales = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["nombre"]
        indexes = [
            models.Index(fields=["comite", "estado_general"], name="idx_pers_comite_est"),
            models.Index(fields=["comite", "persona_mayor"], name="idx_pers_comite_may"),
            models.Index(fields=["comite", "discapacidad"], name="idx_pers_comite_disc"),
            models.Index(fields=["nombre"]),
            models.Index(fields=["telefono"]),
            models.Index(fields=["estado_general"]),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.rut})"

    def calcular_edad(self, fecha_referencia=None):
        if not self.fecha_nacimiento:
            return self.edad
        fecha_referencia = fecha_referencia or timezone.localdate()
        edad = fecha_referencia.year - self.fecha_nacimiento.year
        if (fecha_referencia.month, fecha_referencia.day) < (
            self.fecha_nacimiento.month,
            self.fecha_nacimiento.day,
        ):
            edad -= 1
        return max(edad, 0)

    def actualizar_estado_general(self):
        alertas = self.alertas.filter(activa=True)
        alertas_estado = alertas.filter(impacta_estado=True)
        if alertas_estado.filter(severidad=Alerta.SEVERIDAD_CRITICA).exists():
            estado = self.ESTADO_BLOQUEADA
        elif alertas_estado.filter(severidad=Alerta.SEVERIDAD_PREVENTIVA).exists():
            estado = self.ESTADO_OBSERVADA
        else:
            estado = self.ESTADO_APTA
        if self.estado_general != estado:
            self.estado_general = estado
            self.save(update_fields=["estado_general", "actualizado_en"])
        return estado


class CaracterizacionSocial(TimeStampedModel):
    persona = models.OneToOneField(
        Persona,
        related_name="caracterizacion_social",
        on_delete=models.CASCADE,
    )
    comuna = models.CharField(max_length=120, blank=True)
    parentesco = models.CharField(max_length=120, blank=True)
    tipo_familia = models.CharField(max_length=120, blank=True)
    grupo_familiar = models.CharField(max_length=120, blank=True)
    integrantes = models.PositiveSmallIntegerField(null=True, blank=True)
    hijos = models.JSONField(default=list, blank=True)
    observaciones = models.TextField(blank=True)

    def __str__(self):
        return f"Caracterización {self.persona.rut}"


class RSH(TimeStampedModel):
    persona = models.OneToOneField(Persona, related_name="rsh", on_delete=models.CASCADE)
    porcentaje = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    tramo = models.CharField(max_length=80, blank=True)
    es_preferente = models.BooleanField(default=False)
    fuente = models.CharField(max_length=120, blank=True, default="Excel")

    def __str__(self):
        return f"RSH {self.persona.rut}"


class Ahorro(TimeStampedModel):
    persona = models.OneToOneField(Persona, related_name="ahorro", on_delete=models.CASCADE)
    numero_cuenta = models.CharField(max_length=80, blank=True)
    banco = models.CharField(max_length=120, blank=True)
    monto_actual = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    ahorro_minimo = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    fecha_corte = models.DateField(null=True, blank=True)
    insuficiente = models.BooleanField(default=False)

    def __str__(self):
        return f"Ahorro {self.persona.rut}"


class Postulacion(TimeStampedModel):
    persona = models.OneToOneField(
        Persona,
        related_name="postulacion",
        on_delete=models.CASCADE,
    )
    programa = models.CharField(max_length=120, blank=True)
    estado = models.CharField(max_length=120, blank=True)
    minvu_conecta = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    observaciones = models.TextField(blank=True)

    def __str__(self):
        return f"Postulacion {self.persona.rut}"


class Documento(TimeStampedModel):
    TIPO_CEDULA = "cedula"
    TIPO_LIBRETA = "libreta"
    TIPO_RSH = "rsh"
    TIPO_DISCAPACIDAD = "discapacidad"
    TIPO_OTRO = "otro"
    TIPO_CHOICES = [
        (TIPO_CEDULA, "Cédula"),
        (TIPO_LIBRETA, "Libreta"),
        (TIPO_RSH, "RSH"),
        (TIPO_DISCAPACIDAD, "Discapacidad"),
        (TIPO_OTRO, "Otro"),
    ]

    ESTADO_VIGENTE = "vigente"
    ESTADO_POR_VENCER = "por_vencer"
    ESTADO_VENCIDO = "vencido"
    ESTADO_NO_INFORMADO = "no_informado"
    ESTADO_CHOICES = [
        (ESTADO_VIGENTE, "Vigente"),
        (ESTADO_POR_VENCER, "Por vencer"),
        (ESTADO_VENCIDO, "Vencido"),
        (ESTADO_NO_INFORMADO, "No informado"),
    ]

    persona = models.ForeignKey(Persona, related_name="documentos", on_delete=models.CASCADE)
    tipo = models.CharField(max_length=40, choices=TIPO_CHOICES)
    estado = models.CharField(
        max_length=40,
        choices=ESTADO_CHOICES,
        default=ESTADO_NO_INFORMADO,
    )
    fecha_vencimiento = models.DateField(null=True, blank=True)
    archivo = models.FileField(upload_to="documentos/", null=True, blank=True)
    observaciones = models.TextField(blank=True)

    class Meta:
        ordering = ["tipo", "fecha_vencimiento"]
        indexes = [
            models.Index(fields=["tipo", "estado"]),
            models.Index(fields=["fecha_vencimiento"]),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} {self.persona.rut}"


class Observacion(TimeStampedModel):
    persona = models.ForeignKey(Persona, related_name="observaciones", on_delete=models.CASCADE)
    texto = models.TextField()
    autor = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ["-creado_en"]

    def __str__(self):
        return f"Observación {self.persona.rut}"


class Alerta(TimeStampedModel):
    TIPO_DOCUMENTAL = "documental"
    TIPO_SOCIAL = "social"
    TIPO_FINANCIERA = "financiera"
    TIPO_RSH = "rsh"
    TIPO_SISTEMA = "sistema"
    TIPO_CHOICES = [
        (TIPO_DOCUMENTAL, "Documental"),
        (TIPO_SOCIAL, "Social"),
        (TIPO_FINANCIERA, "Financiera"),
        (TIPO_RSH, "RSH"),
        (TIPO_SISTEMA, "Sistema"),
    ]

    SEVERIDAD_PREVENTIVA = "preventiva"
    SEVERIDAD_CRITICA = "critica"
    SEVERIDAD_CHOICES = [
        (SEVERIDAD_PREVENTIVA, "Preventiva"),
        (SEVERIDAD_CRITICA, "Critica"),
    ]

    persona = models.ForeignKey(Persona, related_name="alertas", on_delete=models.CASCADE)
    tipo = models.CharField(max_length=40, choices=TIPO_CHOICES)
    severidad = models.CharField(max_length=40, choices=SEVERIDAD_CHOICES)
    titulo = models.CharField(max_length=180)
    detalle = models.TextField(blank=True)
    activa = models.BooleanField(default=True)
    impacta_estado = models.BooleanField(default=True)
    origen = models.CharField(max_length=80, blank=True, default="manual")

    class Meta:
        ordering = ["-creado_en"]
        indexes = [
            models.Index(fields=["persona", "activa", "impacta_estado"], name="idx_alerta_p_act_imp"),
            models.Index(fields=["persona", "activa", "severidad"], name="idx_alerta_p_act_sev"),
            models.Index(fields=["activa", "severidad"]),
            models.Index(fields=["tipo"]),
        ]

    def __str__(self):
        return f"{self.titulo} - {self.persona.rut}"


class ImportacionExcel(TimeStampedModel):
    ESTADO_PROCESANDO = "procesando"
    ESTADO_COMPLETADA = "completada"
    ESTADO_ERROR = "error"
    ESTADO_CHOICES = [
        (ESTADO_PROCESANDO, "Procesando"),
        (ESTADO_COMPLETADA, "Completada"),
        (ESTADO_ERROR, "Error"),
    ]

    archivo = models.FileField(upload_to="importaciones/")
    nombre_archivo = models.CharField(max_length=255)
    hoja = models.CharField(max_length=120, blank=True)
    decreto = models.CharField(
        max_length=20,
        choices=Comite.DECRETO_CHOICES,
        default=Comite.DECRETO_DS49,
        blank=True,
    )
    estado = models.CharField(
        max_length=30,
        choices=ESTADO_CHOICES,
        default=ESTADO_PROCESANDO,
    )
    total_filas = models.PositiveIntegerField(default=0)
    creados = models.PositiveIntegerField(default=0)
    actualizados = models.PositiveIntegerField(default=0)
    omitidos = models.PositiveIntegerField(default=0)
    errores = models.JSONField(default=list, blank=True)
    finalizado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-creado_en"]

    def __str__(self):
        return self.nombre_archivo





class TicketPostventa(TimeStampedModel):
    ESTADO_RECIBIDA = "recibida"
    ESTADO_EN_GESTION = "en_gestion"
    ESTADO_RESUELTA = "resuelta"
    ESTADO_CHOICES = [
        (ESTADO_RECIBIDA, "Recibida"),
        (ESTADO_EN_GESTION, "En gestión"),
        (ESTADO_RESUELTA, "Resuelta"),
    ]

    URGENCIA_NORMAL = "normal"
    URGENCIA_URGENTE = "urgente"
    URGENCIA_CHOICES = [
        (URGENCIA_NORMAL, "Normal"),
        (URGENCIA_URGENTE, "Urgente"),
    ]

    codigo = models.CharField(max_length=32, unique=True, editable=False, db_index=True)
    rut = models.CharField(max_length=16, db_index=True)
    nombre = models.CharField(max_length=255)
    telefono = models.CharField(max_length=40, blank=True)
    comite_nombre = models.CharField(max_length=255, blank=True)
    vivienda_direccion = models.CharField(max_length=255, blank=True)
    recinto = models.CharField(max_length=100, blank=True)
    descripcion = models.TextField()
    foto = models.ImageField(upload_to="postventa/fotos/%Y/%m/", null=True, blank=True)

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default=ESTADO_RECIBIDA,
        db_index=True,
    )
    urgencia = models.CharField(
        max_length=20,
        choices=URGENCIA_CHOICES,
        default=URGENCIA_NORMAL,
        db_index=True,
    )

    respuesta_tecnica = models.TextField(blank=True)
    tecnico_responsable = models.CharField(max_length=150, blank=True)
    fecha_resolucion = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-creado_en"]
        indexes = [
            models.Index(fields=["rut"]),
            models.Index(fields=["estado"]),
            models.Index(fields=["urgencia"]),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.get_estado_display()})"

    def save(self, *args, **kwargs):
        if not self.codigo:
            year = timezone.localdate().year
            count = TicketPostventa.objects.filter(creado_en__year=year).count() + 1
            self.codigo = f"PV-{year}-{count:04d}"
        if self.estado == self.ESTADO_RESUELTA and not self.fecha_resolucion:
            self.fecha_resolucion = timezone.now()
        elif self.estado != self.ESTADO_RESUELTA:
            self.fecha_resolucion = None
        super().save(*args, **kwargs)


class PerfilUsuario(TimeStampedModel):
    ROL_ADMIN = "admin"
    ROL_COORDINADOR = "coordinador"
    ROL_SOCIAL = "social"
    ROL_TECNICO = "tecnico"
    ROL_CHOICES = [
        (ROL_ADMIN, "Administrador / Soporte"),
        (ROL_COORDINADOR, "Coordinador General / Gerencia"),
        (ROL_SOCIAL, "Profesional Área Social"),
        (ROL_TECNICO, "Profesional Área Técnica"),
    ]

    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name="perfil")
    rol = models.CharField(
        max_length=20,
        choices=ROL_CHOICES,
        default=ROL_SOCIAL,
        db_index=True,
    )
    nombre_completo = models.CharField(max_length=255, blank=True)
    cargo = models.CharField(max_length=150, blank=True)
    telefono = models.CharField(max_length=40, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ["usuario__username"]

    def __str__(self):
        return f"{self.usuario.username} ({self.get_rol_display()})"


@receiver(post_save, sender=User)
def asegurar_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        rol = PerfilUsuario.ROL_ADMIN if instance.is_superuser else PerfilUsuario.ROL_SOCIAL
        PerfilUsuario.objects.get_or_create(
            usuario=instance,
            defaults={
                "rol": rol,
                "nombre_completo": instance.get_full_name() or instance.username,
            },
        )


class SugerenciaFeedback(TimeStampedModel):
    TIPO_MEJORA = "mejora"
    TIPO_PROBLEMA = "problema"
    TIPO_IDEA = "idea"
    TIPO_CHOICES = [
        (TIPO_MEJORA, "Sugerencia de Mejora"),
        (TIPO_PROBLEMA, "Reporte de Problema / Observación"),
        (TIPO_IDEA, "Nueva Funcionalidad"),
    ]

    ESTADO_PENDIENTE = "pendiente"
    ESTADO_REVISADO = "revisado"
    ESTADO_IMPLEMENTADO = "implementado"
    ESTADO_DESCARTADO = "descartado"
    ESTADO_CHOICES = [
        (ESTADO_PENDIENTE, "Pendiente"),
        (ESTADO_REVISADO, "En Revisión"),
        (ESTADO_IMPLEMENTADO, "Implementada"),
        (ESTADO_DESCARTADO, "Descartada"),
    ]

    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sugerencias",
    )
    nombre_autor = models.CharField(max_length=255, blank=True)
    correo_autor = models.EmailField(blank=True)
    rol_autor = models.CharField(max_length=50, blank=True)

    modulo = models.CharField(max_length=150)
    ruta = models.CharField(max_length=255, blank=True)
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES, default=TIPO_MEJORA)
    mensaje = models.TextField()
    estado = models.CharField(max_length=30, choices=ESTADO_CHOICES, default=ESTADO_PENDIENTE)
    respuesta_soporte = models.TextField(blank=True)

    class Meta:
        ordering = ["-creado_en"]

    def __str__(self):
        return f"[{self.modulo}] {self.get_tipo_display()} - {self.nombre_autor or 'Anónimo'}"

