from django.contrib import admin

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


class AlertaInline(admin.TabularInline):
    model = Alerta
    extra = 0
    fields = ("tipo", "severidad", "titulo", "activa", "origen")
    readonly_fields = ("origen",)


class DocumentoInline(admin.TabularInline):
    model = Documento
    extra = 0
    fields = ("tipo", "estado", "fecha_vencimiento", "observaciones")


@admin.register(Comite)
class ComiteAdmin(admin.ModelAdmin):
    list_display = ("nombre", "comuna", "region", "activo", "actualizado_en")
    search_fields = ("nombre", "comuna")
    list_filter = ("activo", "region")


@admin.register(Persona)
class PersonaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "rut", "comite", "estado_general", "edad", "persona_mayor")
    search_fields = ("nombre", "rut", "telefono", "comite__nombre")
    list_filter = ("estado_general", "persona_mayor", "discapacidad", "comite")
    inlines = [AlertaInline, DocumentoInline]


admin.site.register(CaracterizacionSocial)
admin.site.register(RSH)
admin.site.register(Ahorro)
admin.site.register(Postulacion)
admin.site.register(Documento)
admin.site.register(Observacion)
admin.site.register(Alerta)
admin.site.register(ImportacionExcel)
