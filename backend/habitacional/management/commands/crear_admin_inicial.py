import os
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from habitacional.models import PerfilUsuario


class Command(BaseCommand):
    help = "Crea un usuario administrador inicial si no existe ninguno en el sistema."

    def handle(self, *args, **options):
        admin_username = os.getenv("ADMIN_USERNAME", "admin").strip()
        admin_email = os.getenv("ADMIN_EMAIL", "admin@plansocial.cl").strip()
        admin_password = os.getenv("ADMIN_PASSWORD", "AdminPlanSocial2026!").strip()
        admin_nombre = "Administrador SIGEP"

        usuario = User.objects.filter(username=admin_username).first()
        if not usuario:
            usuario = User.objects.create_superuser(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                first_name=admin_nombre,
            )
            perfil, _ = PerfilUsuario.objects.get_or_create(usuario=usuario)
            perfil.rol = PerfilUsuario.ROL_ADMIN
            perfil.nombre_completo = admin_nombre
            perfil.cargo = "Desarrollador / Soporte Técnico"
            perfil.activo = True
            perfil.save()
            self.stdout.write(self.style.SUCCESS(f"Usuario administrador creado: {admin_username}"))
        else:
            perfil, _ = PerfilUsuario.objects.get_or_create(usuario=usuario)
            if perfil.rol != PerfilUsuario.ROL_ADMIN:
                perfil.rol = PerfilUsuario.ROL_ADMIN
                perfil.save()
            self.stdout.write(f"Usuario administrador ya existe: {admin_username}")
