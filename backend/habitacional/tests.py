from decimal import Decimal
from datetime import date, timedelta
from pathlib import Path
from tempfile import TemporaryDirectory

import pandas as pd
from django.test import TestCase
from django.utils import timezone

from .models import Alerta, Comite, Documento, ImportacionExcel, Persona
from .services.excel_importer import construir_mapa_columnas, importar_excel, importar_observaciones_excel


class ImportadorExcelTests(TestCase):
    def test_importa_base_y_calcula_alertas(self):
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE DEMO.xlsx"
            df = pd.DataFrame(
                [
                    ["BASE COMITE"],
                    ["NOMBRE", "RUT", "FEC NAC", "RSH", "AHORRO", "DISCAPACIDAD"],
                    ["Persona Prueba", "11111111", "1960-01-01", 70, 5, "SI"],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Demo",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona Prueba")
        self.assertEqual(persona.edad, timezone.localdate().year - 1960)
        self.assertTrue(persona.persona_mayor)
        self.assertEqual(persona.estado_general, Persona.ESTADO_APTA)
        self.assertEqual(persona.rsh.porcentaje, Decimal("70.00"))
        self.assertTrue(persona.ahorro.insuficiente)
        self.assertFalse(persona.alertas.get().impacta_estado)
        self.assertEqual(
            Alerta.objects.filter(persona=persona, activa=True).count(),
            1,
        )

    def test_rsh_sobre_40_no_deja_persona_observada(self):
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE RSH.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "FEC NAC", "RSH", "AHORRO"],
                    ["Persona RSH Alto", "22222222", "1990-01-01", 80, 20],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite RSH",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona RSH Alto")
        self.assertEqual(persona.estado_general, Persona.ESTADO_APTA)
        self.assertEqual(persona.alertas.count(), 0)

    def test_fecha_nacimiento_dos_digitos_calcula_adulto_mayor(self):
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE EDAD.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "FEC NAC", "EDAD"],
                    ["Persona Mayor Dos Digitos", "33333333", "31/12/59", 66],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Edad",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona Mayor Dos Digitos")
        nacimiento = date(1959, 12, 31)
        edad = timezone.localdate().year - nacimiento.year
        if (timezone.localdate().month, timezone.localdate().day) < (nacimiento.month, nacimiento.day):
            edad -= 1
        self.assertEqual(persona.fecha_nacimiento, nacimiento)
        self.assertEqual(persona.edad, edad)
        self.assertTrue(persona.persona_mayor)

    def test_detecta_integrantes_con_encabezados_y_textos_flexibles(self):
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE GRUPO FAMILIAR.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "FEC NAC", "N° Grupo Familiar"],
                    ["Persona Grupo Numerico", "44444444", "1990-01-01", "4 integrantes"],
                    ["Persona Grupo Texto", "55555555", "1991-01-01", "2 adultos + 2 niños"],
                    ["Persona Unipersonal", "66666666", "1992-01-01", "Unipersonal"],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Grupo Familiar",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        self.assertEqual(Persona.objects.get(nombre="Persona Grupo Numerico").caracterizacion_social.integrantes, 4)
        self.assertEqual(Persona.objects.get(nombre="Persona Grupo Texto").caracterizacion_social.integrantes, 4)
        self.assertEqual(Persona.objects.get(nombre="Persona Unipersonal").caracterizacion_social.integrantes, 1)

    def test_mapea_abreviaciones_de_grupo_familiar(self):
        for encabezado in ["GRO FAM", "GPO FAM", "GRP FAM", "G FAMILIAR"]:
            with self.subTest(encabezado=encabezado):
                mapa = construir_mapa_columnas(["NOMBRE", "RUT", encabezado])
                self.assertEqual(mapa["grupo_familiar"], encabezado)
                self.assertEqual(mapa["integrantes"], encabezado)
                self.assertNotEqual(mapa.get("tipo_familia"), encabezado)

    def test_importa_integrantes_con_encabezado_gro_fam(self):
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE GRO FAM.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRES", "CEDULA IDENTIDAD", "FEC NAC", "GRO FAM", "TIPO FAMILIA"],
                    ["Persona Abreviacion", "77777777", "1990-01-01", 3, "NUCLEAR"],
                    ["Persona Unipersonal Abreviacion", "88888888", "1991-01-01", 1, "UNIPERSONAL"],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Gro Fam",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        self.assertEqual(Persona.objects.get(nombre="Persona Abreviacion").caracterizacion_social.integrantes, 3)
        self.assertEqual(Persona.objects.get(nombre="Persona Unipersonal Abreviacion").caracterizacion_social.integrantes, 1)

    def test_ahorro_bajo_minimo_no_genera_alerta_ni_observacion(self):
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE AHORRO.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "FEC NAC", "AHORRO"],
                    ["Persona Ahorro Bajo", "33333333", "1990-01-01", 5],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Ahorro",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona Ahorro Bajo")
        self.assertEqual(persona.estado_general, Persona.ESTADO_APTA)
        self.assertTrue(persona.ahorro.insuficiente)
        self.assertEqual(persona.alertas.count(), 0)

    def test_importa_base_con_encabezados_alternativos(self):
        fecha_vigente = timezone.localdate() + timedelta(days=120)
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "NOMINA COMITE FORMATOS DISTINTOS.xlsx"
            df = pd.DataFrame(
                [
                    ["ANTECEDENTES DEL POSTULANTE"],
                    [
                        "RUN POSTULANTE",
                        "NOMBRES",
                        "APELLIDO PATERNO",
                        "APELLIDO MATERNO",
                        "FECHA NACIMIENTO",
                        "TRAMO RSH",
                        "FECHA VENC. CI",
                        "CREDENCIAL DISCAPACIDAD",
                        "TOTAL INTEGRANTES",
                        "PUEBLO ORIGINARIO",
                    ],
                    [
                        "12345678",
                        "Ana Maria",
                        "Perez",
                        "Soto",
                        "1985-03-02",
                        "40%",
                        fecha_vigente.isoformat(),
                        "NO",
                        1,
                        "Mapuche",
                    ],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="Nomina")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Formatos",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(rut="12345678-5")
        self.assertEqual(persona.nombre, "Ana Maria Perez Soto")
        self.assertEqual(persona.etnia, "Mapuche")
        self.assertEqual(persona.rsh.porcentaje, Decimal("40.00"))
        self.assertEqual(persona.caracterizacion_social.integrantes, 1)
        self.assertEqual(persona.estado_general, Persona.ESTADO_APTA)
        titulos = set(persona.alertas.values_list("titulo", flat=True))
        self.assertIn("Revisar certificado de acreditación indígena", titulos)
        self.assertIn("Criterio de excepción unipersonal", titulos)
        self.assertFalse(persona.alertas.filter(impacta_estado=True).exists())

    def test_importa_observaciones_y_correcciones_por_rut(self):
        with TemporaryDirectory() as tmpdir:
            base = Path(tmpdir) / "BASE COMITE OBS.xlsx"
            df_base = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "FEC NAC", "TELEFONO", "TOTAL INTEGRANTES"],
                    ["Persona Observada", "66666666", "1995-01-01", "111", 2],
                ]
            )
            observaciones = Path(tmpdir) / "OBSERVACIONES COMITE OBS.xlsx"
            df_observaciones = pd.DataFrame(
                [
                    ["RUN", "OBSERVACION", "TELEFONO NUEVO", "PUEBLO ORIGINARIO", "TOTAL INTEGRANTES"],
                    ["66666666", "Actualizar respaldo interno", "999", "Mapuche", 1],
                ]
            )
            with pd.ExcelWriter(base, engine="openpyxl") as writer:
                df_base.to_excel(writer, index=False, header=False, sheet_name="BASE")
            with pd.ExcelWriter(observaciones, engine="openpyxl") as writer:
                df_observaciones.to_excel(writer, index=False, header=False, sheet_name="OBS")

            importacion_base = ImportacionExcel.objects.create(
                archivo=str(base),
                nombre_archivo=base.name,
            )
            importar_excel(
                importacion=importacion_base,
                archivo_path=base,
                comite_nombre="Comite Obs",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

            importacion_obs = ImportacionExcel.objects.create(
                archivo=str(observaciones),
                nombre_archivo=observaciones.name,
            )
            importar_observaciones_excel(
                importacion=importacion_obs,
                archivo_path=observaciones,
                comite_nombre="Comite Obs",
            )
            self.assertEqual(importacion_obs.errores, [])
            self.assertEqual(importacion_obs.actualizados, 1)

        persona = Persona.objects.get(nombre="Persona Observada")
        persona.refresh_from_db()
        self.assertEqual(persona.telefono, "999")
        self.assertEqual(persona.etnia, "Mapuche")
        self.assertEqual(persona.caracterizacion_social.integrantes, 1)
        self.assertEqual(persona.estado_general, Persona.ESTADO_APTA)
        self.assertTrue(persona.observaciones.filter(texto__icontains="Actualizar respaldo interno").exists())
        self.assertTrue(persona.alertas.filter(titulo="Revisar certificado de acreditación indígena").exists())

    def test_cedula_vencida_bloquea_persona(self):
        fecha_vencida = timezone.localdate() - timedelta(days=1)
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE CEDULA VENCIDA.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "VENCIMIENTO CEDULA"],
                    ["Persona Cedula Vencida", "44444444", fecha_vencida.isoformat()],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Cedula",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona Cedula Vencida")
        self.assertEqual(persona.estado_general, Persona.ESTADO_BLOQUEADA)
        self.assertTrue(
            persona.alertas.filter(
                severidad=Alerta.SEVERIDAD_CRITICA,
                impacta_estado=True,
            ).exists()
        )
        self.assertTrue(
            persona.documentos.filter(
                tipo=Documento.TIPO_CEDULA,
                estado=Documento.ESTADO_VENCIDO,
            ).exists()
        )

    def test_cedula_por_vencer_deja_persona_observada(self):
        fecha_por_vencer = timezone.localdate() + timedelta(days=30)
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE CEDULA POR VENCER.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "VENCIMIENTO CEDULA"],
                    ["Persona Cedula Por Vencer", "55555555", fecha_por_vencer.isoformat()],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Cedula",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona Cedula Por Vencer")
        self.assertEqual(persona.estado_general, Persona.ESTADO_OBSERVADA)
        self.assertTrue(
            persona.alertas.filter(
                severidad=Alerta.SEVERIDAD_PREVENTIVA,
                impacta_estado=True,
            ).exists()
        )
        self.assertTrue(
            persona.documentos.filter(
                tipo=Documento.TIPO_CEDULA,
                estado=Documento.ESTADO_POR_VENCER,
            ).exists()
        )

    def test_hijo_proximo_a_18_genera_alerta_interna_sin_observar(self):
        fecha_hijo = timezone.localdate().replace(year=timezone.localdate().year - 18) + timedelta(days=30)
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "BASE COMITE HIJOS.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "NOMBRE HIJO 1", "FEC NAC HIJO 1"],
                    ["Persona Con Hijo", "66666666", "Hija Proxima", fecha_hijo.isoformat()],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, header=False, sheet_name="BASE")

            importacion = ImportacionExcel.objects.create(
                archivo=str(archivo),
                nombre_archivo=archivo.name,
            )

            importar_excel(
                importacion=importacion,
                archivo_path=archivo,
                comite_nombre="Comite Hijos",
                comuna="Temuco",
                ahorro_minimo=Decimal("10"),
            )

        persona = Persona.objects.get(nombre="Persona Con Hijo")
        self.assertEqual(persona.estado_general, Persona.ESTADO_APTA)
        self.assertEqual(len(persona.caracterizacion_social.hijos), 1)
        self.assertTrue(
            persona.alertas.filter(
                titulo="Revisar hijo/a por mayoría de edad",
                impacta_estado=False,
            ).exists()
        )


class RolesYAutenticacionTests(TestCase):
    def test_registro_usuario_con_rol(self):
        resp = self.client.post(
            "/api/auth/registro/",
            {
                "username": "tecnico.juan",
                "email": "juan@plansocial.cl",
                "password": "Password123!",
                "nombre_completo": "Juan Pérez",
                "rol": "tecnico",
                "cargo": "Arquitecto Inspector",
            },
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertIn("token", resp.data)
        self.assertEqual(resp.data["usuario"]["rol"], "tecnico")
        self.assertEqual(resp.data["usuario"]["nombre_completo"], "Juan Pérez")

    def test_login_y_perfil_usuario(self):
        self.client.post(
            "/api/auth/registro/",
            {
                "username": "social.maria",
                "email": "maria@plansocial.cl",
                "password": "Password123!",
                "nombre_completo": "María González",
                "rol": "social",
            },
            content_type="application/json",
        )

        login_resp = self.client.post(
            "/api/auth/login/",
            {"username": "social.maria", "password": "Password123!"},
            content_type="application/json",
        )
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.data["token"]

        perfil_resp = self.client.get(
            "/api/auth/perfil/",
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        self.assertEqual(perfil_resp.status_code, 200)
        self.assertEqual(perfil_resp.data["rol"], "social")
        self.assertFalse(perfil_resp.data["es_admin"])

    def test_login_fallido_credenciales_invalidas(self):
        resp = self.client.post(
            "/api/auth/login/",
            {"username": "inexistente", "password": "wrong"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 401)

    def test_bloqueo_autoregistro_como_admin(self):
        resp = self.client.post(
            "/api/auth/registro/",
            {
                "email": "hacker@test.cl",
                "password": "Password123!",
                "nombre_completo": "Intruso Admin",
                "rol": "admin",
            },
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("rol", resp.data)

    def test_envio_y_gestion_sugerencia_feedback(self):
        # Crear usuario normal
        reg_resp = self.client.post(
            "/api/auth/registro/",
            {
                "email": "profesional@plansocial.cl",
                "password": "Password123!",
                "nombre_completo": "Profesional Demanda",
                "rol": "social",
            },
            content_type="application/json",
        )
        token = reg_resp.data["token"]

        # Enviar sugerencia desde el panel de demanda
        sug_resp = self.client.post(
            "/api/feedback/",
            {
                "modulo": "Organización de la Demanda",
                "ruta": "/demanda",
                "tipo": "mejora",
                "mensaje": "Sería útil poder filtrar por porcentaje de vulnerabilidad directo en la tabla.",
            },
            HTTP_AUTHORIZATION=f"Token {token}",
            content_type="application/json",
        )
        self.assertEqual(sug_resp.status_code, 201)
        self.assertEqual(sug_resp.data["modulo"], "Organización de la Demanda")
        self.assertEqual(sug_resp.data["estado"], "pendiente")
        self.assertEqual(sug_resp.data["nombre_autor"], "Profesional Demanda")

    def test_comite_list_y_eliminacion_en_cascada(self):
        # Crear usuario para autenticación
        reg_resp = self.client.post(
            "/api/auth/registro/",
            {
                "email": "coordinador@plansocial.cl",
                "password": "Password123!",
                "nombre_completo": "Coordinador Comités",
                "rol": "coordinador",
            },
            content_type="application/json",
        )
        token = reg_resp.data["token"]
        auth_header = {"HTTP_AUTHORIZATION": f"Token {token}"}

        # Crear comité y personas vinculadas
        comite = Comite.objects.create(nombre="Comité Los Pinos", comuna="Temuco")
        p1 = Persona.objects.create(
            comite=comite,
            rut="12345678-9",
            nombre="Juan Perez",
        )
        p2 = Persona.objects.create(
            comite=comite,
            rut="98765432-1",
            nombre="Maria Soto",
        )

        # 1. Verificar listado de comités con conteo de personas
        list_resp = self.client.get("/api/comites/", **auth_header)
        self.assertEqual(list_resp.status_code, 200)
        comite_item = next(
            (c for c in list_resp.data if c["id"] == comite.id),
            None,
        )
        self.assertIsNotNone(comite_item)
        self.assertEqual(comite_item["nombre"], "Comité Los Pinos")
        self.assertEqual(comite_item["total_personas"], 2)

        # 2. Eliminar comité vía API DELETE
        del_resp = self.client.delete(f"/api/comites/{comite.id}/", **auth_header)
        self.assertEqual(del_resp.status_code, 200)
        self.assertEqual(del_resp.data["personas_eliminadas"], 2)

        # 3. Confirmar que el comité y las personas fueron eliminados de la BD
        self.assertFalse(Comite.objects.filter(id=comite.id).exists())
        self.assertFalse(Persona.objects.filter(id=p1.id).exists())
        self.assertFalse(Persona.objects.filter(id=p2.id).exists())

    def test_analizador_hibrido_y_excepciones_unipersonales_serviu(self):
        from habitacional.services.gemini_excel_analyzer import evaluar_excepcion_unipersonal_serviu

        # 1. Adulto mayor (65 años) -> Habilitado
        res1 = evaluar_excepcion_unipersonal_serviu(edad=65, persona_mayor=True)
        self.assertTrue(res1["habilitado_serviu"])
        self.assertIn("Adulto Mayor", res1["detalle"])

        # 2. Joven de 25 años Mapuche -> Habilitado
        res2 = evaluar_excepcion_unipersonal_serviu(edad=25, etnia="Mapuche")
        self.assertTrue(res2["habilitado_serviu"])
        self.assertIn("Pueblo Originario", res2["detalle"])

        # 3. Persona de 40 años con discapacidad -> Habilitada
        res3 = evaluar_excepcion_unipersonal_serviu(edad=40, tiene_discapacidad=True)
        self.assertTrue(res3["habilitado_serviu"])
        self.assertIn("Discapacidad", res3["detalle"])

        # 4. Persona de 30 años sin ninguna excepción -> No habilitado (Alerta crítica)
        res4 = evaluar_excepcion_unipersonal_serviu(edad=30, persona_mayor=False, tiene_discapacidad=False, etnia="")
        self.assertFalse(res4["habilitado_serviu"])
        self.assertIn("No cumple causales", res4["detalle"])

    def test_aprendizaje_motor_persistencia_y_autonomia(self):
        from habitacional.services.aprendizaje_motor import (
            evaluar_necesidad_de_ia,
            registrar_nuevo_aprendizaje,
            cargar_alias_aprendidos,
            destilar_y_guardar_lecciones_gemini,
            estadisticas_aprendizaje,
        )
        from habitacional.services.excel_importer import construir_mapa_columnas

        with TemporaryDirectory() as tmpdir:
            with self.settings(APP_DATA_DIR=Path(tmpdir)):
                # 1. Evaluar necesidad de IA con columnas estándar ya conocidas por el motor determinista
                columnas_estandar = ["RUT", "NOMBRE", "EDAD", "BANCO", "NRO CUENTA", "RSH %"]
                mapa_local = construir_mapa_columnas(columnas_estandar)
                necesita_ia, motivo = evaluar_necesidad_de_ia(columnas_estandar, mapa_local)
                # Debe determinar que NO necesita IA (0 tokens consumidos)
                self.assertFalse(necesita_ia)

                # 2. Registrar un alias no estándar aprendido
                alias_raro = "ENTIDAD_BANCARIA_ASOCIADA"
                guardado = registrar_nuevo_aprendizaje("banco", alias_raro, fuente="Test Unitario")
                self.assertTrue(guardado)

                # Verificar que no guarde duplicados
                duplicado = registrar_nuevo_aprendizaje("banco", alias_raro, fuente="Test Unitario")
                self.assertFalse(duplicado)

                # 3. Comprobar que construir_mapa_columnas ahora reconoce la columna automáticamente
                columnas_con_alias_aprendido = ["RUT", "NOMBRE", alias_raro]
                nuevo_mapa = construir_mapa_columnas(columnas_con_alias_aprendido)
                self.assertEqual(nuevo_mapa.get("banco"), alias_raro)

                # 4. Verificar estadísticas de aprendizaje
                stats = estadisticas_aprendizaje()
                self.assertGreaterEqual(stats["total_alias_aprendidos_permanentes"], 1)
                self.assertIn("banco", stats["detalle_por_campo"])

    def test_importacion_con_decreto_diferenciado_ds01_vs_ds49(self):
        # 1. Unipersonal sin excepción en DS49 queda bloqueado (Alerta crítica SERVIU)
        with TemporaryDirectory() as tmpdir:
            archivo_ds49 = Path(tmpdir) / "COMITE_DS49.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "EDAD", "INTEGRANTES"],
                    ["Postulante Solo DS49", "12345678", 32, 1],
                ]
            )
            with pd.ExcelWriter(archivo_ds49, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, sheet_name="BASE")

            imp_ds49 = ImportacionExcel.objects.create(archivo=str(archivo_ds49), nombre_archivo=archivo_ds49.name)
            importar_excel(
                importacion=imp_ds49,
                archivo_path=archivo_ds49,
                comite_nombre="Comité Fondo Solidario",
                comuna="Temuco",
                decreto="DS49",
            )
            p_ds49 = Persona.objects.get(nombre="Postulante Solo DS49")
            self.assertEqual(p_ds49.comite.decreto, "DS49")
            self.assertEqual(p_ds49.estado_general, Persona.ESTADO_BLOQUEADA)
            self.assertTrue(p_ds49.alertas.filter(severidad=Alerta.SEVERIDAD_CRITICA).exists())

        # 2. Unipersonal sin excepción en DS01 NO queda bloqueado (Habilitado para sectores medios)
        with TemporaryDirectory() as tmpdir:
            archivo_ds01 = Path(tmpdir) / "COMITE_DS01.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "EDAD", "INTEGRANTES"],
                    ["Postulante Solo DS01", "87654321", 32, 1],
                ]
            )
            with pd.ExcelWriter(archivo_ds01, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, sheet_name="BASE")

            imp_ds01 = ImportacionExcel.objects.create(archivo=str(archivo_ds01), nombre_archivo=archivo_ds01.name)
            importar_excel(
                importacion=imp_ds01,
                archivo_path=archivo_ds01,
                comite_nombre="Comité Sectores Medios",
                comuna="Temuco",
                decreto="DS01",
            )
            p_ds01 = Persona.objects.get(nombre="Postulante Solo DS01")
            self.assertEqual(p_ds01.comite.decreto, "DS01")
            self.assertEqual(p_ds01.estado_general, Persona.ESTADO_APTA)
            self.assertFalse(p_ds01.alertas.filter(severidad=Alerta.SEVERIDAD_CRITICA).exists())


class GeminiAnalyzerRobustnessTests(TestCase):
    def test_gemini_timeout_is_3_point_5_seconds(self):
        from habitacional.services.gemini_excel_analyzer import GEMINI_TIMEOUT_SECONDS
        self.assertEqual(GEMINI_TIMEOUT_SECONDS, 3.5)

    def test_gemini_http_503_fallback(self):
        from unittest.mock import patch
        from urllib.error import HTTPError
        from io import BytesIO
        from habitacional.services.gemini_excel_analyzer import analizar_esquema_con_gemini

        http_503 = HTTPError(
            url="https://generativelanguage.googleapis.com",
            code=503,
            msg="Service Unavailable",
            hdrs={},
            fp=BytesIO(b"Service Unavailable"),
        )
        with self.settings(ALLOW_GEMINI_TESTS=True, GEMINI_API_KEY="test-key"):
            with patch("habitacional.services.gemini_excel_analyzer.urlopen", side_effect=http_503):
                resultado = analizar_esquema_con_gemini(["RUT", "NOMBRE"], [{"RUT": "1-9", "NOMBRE": "Juan"}])
                self.assertEqual(resultado, {})

    def test_gemini_timeout_fallback(self):
        from unittest.mock import patch
        from habitacional.services.gemini_excel_analyzer import analizar_esquema_con_gemini

        timeout_err = TimeoutError("The read operation timed out after 3.5 seconds")
        with self.settings(ALLOW_GEMINI_TESTS=True, GEMINI_API_KEY="test-key"):
            with patch("habitacional.services.gemini_excel_analyzer.urlopen", side_effect=timeout_err):
                resultado = analizar_esquema_con_gemini(["RUT", "NOMBRE"], [{"RUT": "1-9", "NOMBRE": "Juan"}])
                self.assertEqual(resultado, {})


class PerquencoIngestionAuditTests(TestCase):
    def test_reconocimiento_columnas_base_perquenco(self):
        from habitacional.services.excel_importer import construir_mapa_columnas

        columnas_perquenco = [
            "Nº", "NOMBRE", "RUT", "DV", "FONO", "DIRECCION RSH", "ROL SII",
            "DIRECCION TERRENO", "SUPERFICIE TERRENO", "FOJA", "NUMERO", "AÑO", "CBR",
            "ETNIA", "SEXO", "ESTADO CIVIL", "NOMBRE CONYUGE", "RUT CONYUGE",
            "FECHA DE NACIMIENTO CONYUGE", "SEXO CONYUGE", "PAIS",
            "FECHA DE NACIMIENTO ", "EDAD HOY", "DISCAPACIDAD", "Nº CUENTA", "BANCO",
            "UF AL MES SEP 2026", "UF AL DIA 01.10.2026", "RSH", "MINVU CONECTA",
            "COMUNA", "GRUPO FAMILIAR", "PARENTEZCO", "TIPO FAMILIA", "EXCEPCION",
            "DEFICIT HABITABILIDAD", "PROPIEDADES Y/O SUBSIDIOS", "SUBSIDIO DE ARRIENDO",
            "TIPO VIVIENDA", "JUSTIFICACION 3º DORMITORIO CON AHORRO", "JUSTIFICACION",
            "AHORRO", "CUENTA", "BANCO.1", "AHORRO DIA 25.8.25", "OBSERVACIONES",
            "FACTOR AISLAMIENTO", "PARIENTE 1", "RUT 1", "estado civil", "FEC NAC 1",
            "EDAD 1", "PARENTEZCO 1", "DISCAPACIDAD 1", "PARIENTE 2", "RUT 2",
            "ESTADO CIVIL_1", "FEC NAC 2", "EDAD 2", "PARENTEZCO 2", "DISCAPACIDAD 2",
        ]
        mapa = construir_mapa_columnas(columnas_perquenco)

        self.assertEqual(mapa.get("rut"), "RUT")
        self.assertEqual(mapa.get("dv"), "DV")
        self.assertEqual(mapa.get("nombre"), "NOMBRE")
        self.assertEqual(mapa.get("fecha_nacimiento"), "FECHA DE NACIMIENTO ")
        self.assertEqual(mapa.get("edad"), "EDAD HOY")
        self.assertEqual(mapa.get("sexo"), "SEXO")
        self.assertEqual(mapa.get("etnia"), "ETNIA")
        self.assertEqual(mapa.get("telefono"), "FONO")
        self.assertEqual(mapa.get("direccion"), "DIRECCION RSH")
        self.assertEqual(mapa.get("discapacidad"), "DISCAPACIDAD")
        self.assertEqual(mapa.get("numero_cuenta"), "Nº CUENTA")
        self.assertEqual(mapa.get("banco"), "BANCO")
        self.assertEqual(mapa.get("rsh"), "RSH")
        self.assertEqual(mapa.get("minvu_conecta"), "MINVU CONECTA")
        self.assertEqual(mapa.get("ahorro"), "AHORRO")
        self.assertEqual(mapa.get("tipo_familia"), "TIPO FAMILIA")
        self.assertEqual(mapa.get("parentesco"), "PARENTEZCO")

    def test_normalizar_rut_con_columna_dv(self):
        from habitacional.services.excel_importer import normalizar_rut

        self.assertEqual(normalizar_rut("20393800", "4"), "20393800-4")
        self.assertEqual(normalizar_rut("20353246", "6"), "20353246-6")
        self.assertEqual(normalizar_rut("9809472", "5"), "9809472-5")
        self.assertEqual(normalizar_rut("20393800-4", "4"), "20393800-4")
        self.assertEqual(normalizar_rut("11111111", None), "11111111-1")

    def test_escalado_porcentaje_rsh_fraccionario(self):
        with TemporaryDirectory() as tmpdir:
            archivo = Path(tmpdir) / "PERQUENCO_MINI.xlsx"
            df = pd.DataFrame(
                [
                    ["NOMBRE", "RUT", "DV", "RSH", "MINVU CONECTA"],
                    ["Postulante Preferente", "11111111", "1", 0.4, 0.4],
                    ["Postulante No Preferente", "22222222", "2", 0.8, 0.8],
                ]
            )
            with pd.ExcelWriter(archivo, engine="openpyxl") as writer:
                df.to_excel(writer, index=False)

            imp = ImportacionExcel.objects.create(archivo=str(archivo), nombre_archivo=archivo.name)
            importar_excel(
                importacion=imp,
                archivo_path=archivo,
                comite_nombre="Comité Fraccionarios",
            )

            p1 = Persona.objects.get(nombre="Postulante Preferente")
            self.assertEqual(p1.rsh.porcentaje, Decimal("40.00"))
            self.assertTrue(p1.rsh.es_preferente)
            self.assertEqual(p1.postulacion.minvu_conecta, Decimal("40.00"))

            p2 = Persona.objects.get(nombre="Postulante No Preferente")
            self.assertEqual(p2.rsh.porcentaje, Decimal("80.00"))
            self.assertFalse(p2.rsh.es_preferente)
            self.assertEqual(p2.postulacion.minvu_conecta, Decimal("80.00"))

    def test_ingesta_real_perquenco_si_existe(self):
        ruta_perquenco = Path(r"C:\Users\lucas\Downloads\BASE PERQUENCO 01.10.2026.xlsx")
        if not ruta_perquenco.exists():
            return

        imp = ImportacionExcel.objects.create(
            archivo=str(ruta_perquenco),
            nombre_archivo=ruta_perquenco.name,
            decreto="DS49",
        )
        importar_excel(
            importacion=imp,
            archivo_path=ruta_perquenco,
            comite_nombre="Comité Perquenco Real",
            comuna="Perquenco",
            decreto="DS49",
        )

        self.assertEqual(imp.total_filas, 155)
        self.assertEqual(imp.estado, ImportacionExcel.ESTADO_COMPLETADA)
        self.assertEqual(len(imp.errores), 0)

        # Verificar titular Abigail con RUT y fecha nacimiento reales
        abigail = Persona.objects.get(rut="20393800-4")
        self.assertEqual(abigail.fecha_nacimiento.year, 2000)
        self.assertEqual(abigail.edad, 26)
        self.assertEqual(abigail.rsh.porcentaje, Decimal("40.00"))
        self.assertTrue(abigail.rsh.es_preferente)
        self.assertEqual(abigail.ahorro.banco, "ESTADO")
        self.assertEqual(abigail.ahorro.numero_cuenta, "00130833110")

        # Verificar Curin Concha con RSH 80% (no preferente) y Etnia Mapuche
        curin = Persona.objects.get(rut="20353246-6")
        self.assertEqual(curin.etnia, "MAPUCHE")
        self.assertEqual(curin.rsh.porcentaje, Decimal("80.00"))
        self.assertFalse(curin.rsh.es_preferente)


class ImportarExcelAPIViewRobustnessTests(TestCase):
    def test_importar_excel_sin_archivo_retorna_400(self):
        from rest_framework.test import APIRequestFactory
        from habitacional.views import ImportarExcelAPIView

        factory = APIRequestFactory()
        request = factory.post("/api/habitacional/importar-excel/", {})
        view = ImportarExcelAPIView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)

    def test_importar_excel_error_inesperado_retorna_500_estructurado(self):
        from unittest.mock import patch
        from rest_framework.test import APIRequestFactory
        from django.core.files.uploadedfile import SimpleUploadedFile
        from habitacional.views import ImportarExcelAPIView

        archivo = SimpleUploadedFile("test.xlsx", b"dummy content", content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        factory = APIRequestFactory()
        request = factory.post(
            "/api/habitacional/importar-excel/",
            {"archivo": archivo, "comite_nombre": "Test 500"},
            format="multipart",
        )

        with patch("habitacional.views.importar_excel", side_effect=RuntimeError("Fallo inesperado del sistema")):
            view = ImportarExcelAPIView.as_view()
            response = view(request)

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data.get("estado"), ImportacionExcel.ESTADO_ERROR)
        self.assertTrue(len(response.data.get("errores", [])) > 0)
        self.assertIn("Fallo inesperado del sistema", response.data["errores"][0]["error"])

    def test_importar_excel_error_de_importacion_retorna_400_estructurado(self):
        from unittest.mock import patch
        from rest_framework.test import APIRequestFactory
        from django.core.files.uploadedfile import SimpleUploadedFile
        from habitacional.services.excel_importer import ImportacionError
        from habitacional.views import ImportarExcelAPIView

        archivo = SimpleUploadedFile("test.xlsx", b"dummy content", content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        factory = APIRequestFactory()
        request = factory.post(
            "/api/habitacional/importar-excel/",
            {"archivo": archivo, "comite_nombre": "Test 400"},
            format="multipart",
        )

        with patch("habitacional.views.importar_excel", side_effect=ImportacionError("Encabezado RUT no encontrado")):
            view = ImportarExcelAPIView.as_view()
            response = view(request)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data.get("estado"), ImportacionExcel.ESTADO_ERROR)
        self.assertIn("Encabezado RUT no encontrado", response.data["errores"][0]["error"])






