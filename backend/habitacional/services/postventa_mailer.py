import logging
import mimetypes
import os
import threading
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone

logger = logging.getLogger(__name__)


def despachar_correo_postventa_async(ticket_id):
    """
    Despacha las notificaciones por correo en un hilo secundario asíncrono
    para no demorar la respuesta de la API al beneficiario.
    """
    thread = threading.Thread(
        target=_enviar_notificaciones_worker,
        args=(ticket_id,),
        daemon=True,
    )
    thread.start()


def _enviar_notificaciones_worker(ticket_id):
    """
    Función trabajadora que construye y envía el correo oficial a la constructora
    y el comprobante de respaldo al beneficiario (si indicó correo).
    """
    from django.db import connection
    connection.close()

    from habitacional.models import TicketPostventa

    try:
        ticket = (
            TicketPostventa.objects.prefetch_related("items").get(id=ticket_id)
        )
    except TicketPostventa.DoesNotExist:
        logger.warning(
            f"[POSTVENTA MAILER] Ticket con ID {ticket_id} no existe en la base de datos."
        )
        return
    except Exception as e:
        logger.exception(
            f"[POSTVENTA MAILER] Error recuperando ticket {ticket_id}: {e}"
        )
        return

    # 1. Enviar correo formal a la Constructora
    try:
        _enviar_correo_constructora(ticket)
    except Exception as e:
        logger.exception(
            f"[POSTVENTA MAILER] Error enviando correo a constructora para ticket {ticket.codigo}: {e}"
        )

    # 2. Si el beneficiario tiene correo, enviarle comprobante automático
    if ticket.email and ticket.email.strip():
        try:
            _enviar_comprobante_beneficiario(ticket)
        except Exception as e:
            logger.exception(
                f"[POSTVENTA MAILER] Error enviando comprobante a beneficiario {ticket.email}: {e}"
            )


def _enviar_correo_constructora(ticket):
    destinatario = getattr(
        settings, "CONSTRUCTORA_EMAIL_DEFAULT", "lucas.villar997@gmail.com"
    )
    if not destinatario:
        logger.warning(
            "[POSTVENTA MAILER] No hay correo de constructora configurado."
        )
        return

    es_urgente = ticket.urgencia == "urgente"
    prefijo_urgencia = "🚨 [URGENTE] " if es_urgente else "📋 "
    asunto = f"{prefijo_urgencia}Postventa {ticket.codigo} · {ticket.nombre} · {ticket.recinto or 'Vivienda'}"

    # Limpieza de teléfono para enlace directo WhatsApp
    tel_limpio = "".join(c for c in (ticket.telefono or "") if c.isdigit())
    if tel_limpio and not tel_limpio.startswith("56"):
        tel_limpio = "56" + tel_limpio
    whatsapp_url = f"https://wa.me/{tel_limpio}" if tel_limpio else None

    items = list(ticket.items.all())
    total_recintos = len(items) if items else 1

    # Construcción de texto plano alternativo
    lineas_texto = [
        "============================================================",
        f"NOTIFICACIÓN OFICIAL DE POSTVENTA - TICKET {ticket.codigo}",
        "============================================================",
        f"Fecha y Hora: {timezone.localtime(ticket.creado_en).strftime('%d/%m/%Y %H:%M')}",
        f"Urgencia: {'PRIORITARIA / URGENTE' if es_urgente else 'Normal'}",
        "",
        "ANTECEDENTES DEL BENEFICIARIO:",
        f"• Nombre: {ticket.nombre}",
        f"• RUT: {ticket.rut}",
        f"• Teléfono: {ticket.telefono or 'No informado'}",
        f"• Correo: {ticket.email or 'No informado'}",
        f"• Comité / Proyecto: {ticket.comite_nombre or 'Sin especificar'}",
        f"• Dirección Vivienda: {ticket.vivienda_direccion or 'Sin especificar'}",
        "",
        f"RECINTOS AFECTADOS ({total_recintos}):",
    ]

    if items:
        for idx, it in enumerate(items, 1):
            lineas_texto.append(f"\n[{idx}] RECINTO: {it.recinto}")
            lineas_texto.append(f"    Observaciones: {it.observaciones}")
            if it.foto:
                lineas_texto.append(f"    Foto: Adjuntada en este correo")
    else:
        lineas_texto.append(f"• Recinto: {ticket.recinto or 'General'}")
        lineas_texto.append(f"• Falla reportada: {ticket.descripcion}")

    lineas_texto.extend(
        [
            "",
            "------------------------------------------------------------",
            "Favor coordinar inspección técnica o reparación con la familia.",
            "Sistema SIGEP · Entidad Patrocinante / Habitabilidad Rural",
            "============================================================",
        ]
    )
    cuerpo_texto = "\n".join(lineas_texto)

    # Construcción HTML sobrio y profesional estilo Linear/Apple
    filas_recintos_html = ""
    if items:
        for idx, it in enumerate(items, 1):
            filas_recintos_html += f"""
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 12px;">
                <div style="font-weight: 700; color: #0f172a; font-size: 13px; margin-bottom: 6px;">
                    <span style="display: inline-block; background-color: #0f172a; color: #ffffff; border-radius: 50%; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 11px; margin-right: 6px;">{idx}</span>
                    {it.recinto}
                </div>
                <div style="color: #334155; font-size: 13px; line-height: 1.5; margin-bottom: 8px;">
                    {it.observaciones or 'Sin observaciones adicionales.'}
                </div>
                {'<div style="font-size: 11px; color: #0284c7; font-weight: 600;">📎 Fotografía de este recinto adjunta en este correo</div>' if it.foto else '<div style="font-size: 11px; color: #94a3b8;">Sin fotografía adjunta</div>'}
            </div>
            """
    else:
        filas_recintos_html = f"""
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 13px; margin-bottom: 6px;">{ticket.recinto or 'General'}</div>
            <div style="color: #334155; font-size: 13px; line-height: 1.5;">{ticket.descripcion}</div>
        </div>
        """

    badge_urgencia = (
        """<span style="background-color: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; border: 1px solid #fecaca; text-transform: uppercase;">🚨 Urgencia Prioritaria</span>"""
        if es_urgente
        else """<span style="background-color: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; border: 1px solid #e2e8f0;">Normal</span>"""
    )

    cuerpo_html = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Notificación de Postventa {ticket.codigo}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        
        <!-- Cabecera -->
        <div style="background-color: #0f172a; padding: 20px 24px; color: #ffffff;">
          <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 4px;">
            SIGEP · Habitabilidad Rural · D.S. N° 10
          </div>
          <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff; line-height: 1.3;">
            Notificación Oficial de Postventa · {ticket.codigo}
          </h1>
        </div>

        <div style="padding: 24px;">
          <!-- Estado y Urgencia -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; pb-3;">
            <div>
              <span style="font-size: 12px; color: #64748b;">Ingresado el:</span>
              <strong style="font-size: 12px; color: #0f172a;">{timezone.localtime(ticket.creado_en).strftime('%d/%m/%Y a las %H:%M hrs')}</strong>
            </div>
            <div>
              {badge_urgencia}
            </div>
          </div>

          <!-- Cuadro de Datos del Beneficiario -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 10px;">
              Antecedentes del Beneficiario y Vivienda
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 4px 0; color: #64748b; width: 130px;">Beneficiario:</td>
                <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">{ticket.nombre}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">RUT:</td>
                <td style="padding: 4px 0; font-family: monospace; font-weight: 600; color: #0f172a;">{ticket.rut}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Teléfono:</td>
                <td style="padding: 4px 0;">
                  <a href="tel:{ticket.telefono}" style="color: #0284c7; text-decoration: none; font-weight: 600;">{ticket.telefono or 'No informado'}</a>
                  {f' · <a href="{whatsapp_url}" target="_blank" style="color: #16a34a; text-decoration: none; font-weight: 600;">Abrir WhatsApp</a>' if whatsapp_url else ''}
                </td>
              </tr>
              {f'<tr><td style="padding: 4px 0; color: #64748b;">Correo:</td><td style="padding: 4px 0;"><a href="mailto:{ticket.email}" style="color: #0284c7; text-decoration: none;">{ticket.email}</a></td></tr>' if ticket.email else ''}
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Comité:</td>
                <td style="padding: 4px 0; color: #0f172a;">{ticket.comite_nombre or 'Sin especificar'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Dirección:</td>
                <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">{ticket.vivienda_direccion or 'Sin especificar'}</td>
              </tr>
            </table>
          </div>

          <!-- Recintos Afectados -->
          <div style="margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin-bottom: 12px;">
              Recintos Afectados y Falla Reportada ({total_recintos})
            </div>
            {filas_recintos_html}
          </div>

          <!-- Aviso de Archivos Adjuntos -->
          <div style="background-color: #ecfeff; border: 1px solid #cffafe; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #0e7490; margin-bottom: 24px;">
            <strong>Nota para la Constructora:</strong> Las fotografías del daño registradas por la familia se encuentran adjuntas directamente a este correo para coordinar los materiales e inspección técnica en terreno.
          </div>

          <!-- Pie -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
            Notificación automática generada por SIGEP · Entidad Patrocinante Habitacional<br>
            Plataforma oficial de seguimiento y postventa habitacional.
          </div>
        </div>
      </div>
    </body>
    </html>
    """

    remitente = getattr(
        settings,
        "DEFAULT_FROM_EMAIL",
        "SIGEP Postventa <notificaciones@sigep.cl>",
    )
    email = EmailMultiAlternatives(
        subject=asunto,
        body=cuerpo_texto,
        from_email=remitente,
        to=[destinatario],
    )
    email.attach_alternative(cuerpo_html, "text/html")

    # Adjuntar fotografías si existen físicamente en disco y no exceden 15MB
    if items:
        for idx, it in enumerate(items, 1):
            if it.foto:
                try:
                    ruta_archivo = it.foto.path
                    if os.path.exists(ruta_archivo):
                        tamano_mb = os.path.getsize(ruta_archivo) / (
                            1024 * 1024
                        )
                        if tamano_mb <= 15:
                            mime_type, _ = mimetypes.guess_type(ruta_archivo)
                            mime_type = mime_type or "image/jpeg"
                            with open(ruta_archivo, "rb") as f:
                                nombre_seguro = f"Foto_{idx}_{it.recinto.replace(' ', '_').replace('/', '_')}.jpg"
                                email.attach(
                                    nombre_seguro, f.read(), mime_type
                                )
                except Exception as adj_err:
                    logger.warning(
                        f"[POSTVENTA MAILER] No fue posible adjuntar foto de item {it.id}: {adj_err}"
                    )
    elif ticket.foto:
        try:
            ruta_archivo = ticket.foto.path
            if os.path.exists(ruta_archivo):
                with open(ruta_archivo, "rb") as f:
                    email.attach("Foto_Dano.jpg", f.read(), "image/jpeg")
        except Exception as adj_err:
            logger.warning(
                f"[POSTVENTA MAILER] No fue posible adjuntar foto principal: {adj_err}"
            )

    email.send(fail_silently=False)
    logger.info(
        f"[POSTVENTA MAILER] Correo para constructora enviado con éxito a {destinatario} para ticket {ticket.codigo}"
    )


def _enviar_comprobante_beneficiario(ticket):
    """
    Envía un comprobante oficial de recepción a la familia para su tranquilidad.
    """
    if not ticket.email:
        return

    asunto = f"Comprobante de Recepción · Solicitud Postventa {ticket.codigo}"

    cuerpo_texto = f"""
Estimado(a) {ticket.nombre},

Le informamos que su solicitud de postventa ha sido registrada exitosamente en nuestra plataforma oficial.
Código de Solicitud: {ticket.codigo}
RUT: {ticket.rut}
Fecha de Ingreso: {timezone.localtime(ticket.creado_en).strftime('%d/%m/%Y %H:%M')}

Los antecedentes y fotografías han sido derivados a la empresa constructora para coordinar la evaluación técnica.

Recuerde que no necesita recordar códigos complejos: puede consultar el avance, visitas y dictamen técnico en cualquier momento ingresando únicamente su RUT en el portal de postventa.

Atentamente,
Entidad Patrocinante Habitacional
    """.strip()

    cuerpo_html = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 20px; color: #0f172a;">
      <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 24px;">
        <h2 style="font-size: 16px; color: #0f172a; margin-top: 0;">Solicitud de Postventa Registrada</h2>
        <p style="font-size: 13px; color: #334155; line-height: 1.5;">
          Estimado(a) <strong>{ticket.nombre}</strong>, confirmamos que su solicitud ha sido ingresada conforme al sistema de postventa habitacional.
        </p>
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px;">
          <p style="margin: 0 0 6px 0;"><strong>Código de Registro:</strong> <span style="font-family: monospace;">{ticket.codigo}</span></p>
          <p style="margin: 0 0 6px 0;"><strong>RUT:</strong> <span style="font-family: monospace;">{ticket.rut}</span></p>
          <p style="margin: 0;"><strong>Estado Inicial:</strong> Recibida (derivada a constructora)</p>
        </div>
        <p style="font-size: 13px; color: #334155; line-height: 1.5;">
          El requerimiento técnico y las fotografías fueron enviados a la constructora responsable para programar la atención en terreno.
        </p>
        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
          💡 <em>Puede consultar en todo momento el avance de su caso ingresando únicamente su RUT en la pestaña <strong>"Consultar Estado por RUT"</strong> de nuestra plataforma.</em>
        </p>
        <div style="border-top: 1px solid #e2e8f0; margin-top: 20px; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center;">
          Plan Social · Entidad Patrocinante Habitacional
        </div>
      </div>
    </body>
    </html>
    """

    remitente = getattr(
        settings,
        "DEFAULT_FROM_EMAIL",
        "SIGEP Postventa <notificaciones@sigep.cl>",
    )
    email = EmailMultiAlternatives(
        subject=asunto,
        body=cuerpo_texto,
        from_email=remitente,
        to=[ticket.email.strip()],
    )
    email.attach_alternative(cuerpo_html, "text/html")
    email.send(fail_silently=False)
    logger.info(
        f"[POSTVENTA MAILER] Comprobante enviado a beneficiario {ticket.email} para ticket {ticket.codigo}"
    )
