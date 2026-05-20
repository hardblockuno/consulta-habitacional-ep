from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Comite(TimeStampedModel):
    nombre = models.CharField(max_length=255)
    comuna = models.CharField(max_length=120, blank=True)
    region = models.CharField(max_length=120, blank=True, default="La Araucania")
    origen = models.CharField(max_length=255, blank=True)
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
        return self.nombre


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
