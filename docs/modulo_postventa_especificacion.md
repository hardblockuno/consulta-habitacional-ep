# Módulo de Postventa Inteligente - Consulta Habitacional EP
## Documento de Arquitectura y Especificación Técnica (Ley 20.016 / SERVIU)

Este documento detalla el diseño de arquitectura, modelos de base de datos Django, especificaciones de agentes IA y contratos de API REST para la implementación del Módulo de Postventa Inteligente.

---

### Resumen Ejecutivo de Componentes

1. **Gestión de Ciclo de Vida y Máquina de Estados**:
   - `INGRESADO` -> `TRIAJE_IA` -> `CLASIFICADO_EMERGENCIA` / `EN_ANALISIS_TECNICO` / `REQUIERE_VALIDACION_EP`
   - `VISITA_AGENDADA` -> `INSPECCION_EN_TERRENO` -> `EN_REPARACION` -> `REPARADO_PENDIENTE_ACTA`
   - `CONFORMIDAD_FIRMADA` -> `CERRADO_AUDITABLE_SERVIU` (o `RECHAZADO_FUNDADO`)

2. **Garantías Legales Ley 20.016 (Art. 18 LGUC)**:
   - **10 Años (Estructurales)**: Cimientos, muros de corte, vigas, losas, envigados de techumbre. Referencia: Recepción DOM.
   - **5 Años (Instalaciones y Elementos Constructivos)**: Redes gas, electricidad, agua potable, alcantarillado, impermeabilización. Referencia: Recepción DOM.
   - **3 Años (Terminaciones)**: Yesos, pinturas, cerámicos, quincallería, puertas. Referencia: Inscripción en CBR.

3. **Modelos de Datos Principales**:
   - `ViviendaProyecto`: Almacena `fecha_recepcion_dom` y `fecha_inscripcion_cbr`.
   - `TicketPostventa`: Orquesta estado, urgencia, clasificación legal y salidas JSON de IA.
   - `FotoTicket`: Fotografías con georreferenciación y hash SHA256 para no repudio SERVIU.
   - `VisitaInspeccion`: Gestión de inspección y cuadrillas con checklist de causa raíz.
   - `ActaConformidad`: Registro de firma ológrafa digital, declaraciones y generación de PDF para liquidación de garantías SERVIU.

4. **Trío de Agentes IA**:
   - **Agente 1**: Triaje Legal y Detección de Emergencias Críticas (Gas/Eléctrico/Inundación).
   - **Agente 2**: Diagnóstico Técnico Preliminar (Patología constructiva, especialidad y cubicación de insumos).
   - **Agente 3**: Comunicación Empática (Mensajería humana y pedagógica hacia beneficiarios vulnerables).
