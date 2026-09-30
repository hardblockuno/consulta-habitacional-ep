# Normas de Diseño e Implementación: Consulta Habitacional EP

## 🛑 Regla Inquebrantable: Cero Clichés de IA y Cero Apariencia Generada por IA

Todo el diseño, código, interfaz y textos de esta plataforma deben responder estrictamente a un estándar de **software institucional, formal, técnico y administrativo chileno** (estilo Ministerio de Vivienda y Urbanismo - MINVU / SERVIU / Entidades Patrocinantes).

---

### 1. Prohibiciones Visuales y de Interfaz (UI)
- **Cero degradados artificiales / futuristas:** Prohibido el uso de degradados espaciales, violetas, púrpuras, o cianes brillantes (`bg-gradient-to-r from-purple...`, `from-cyan-800 to-slate-900`, etc.).
- **Cero emojis en la interfaz formal:** Prohibido el uso de emojis en encabezados, botones, tarjetas, selectores o estados (nada de 🟡, 🔵, 🟢, ⚠️, 📋, 🚀, 🤖, ✨, 📱, 📲, ✍️). Los estados se representan con texto e insignias sobrias (*Pendiente*, *En atención*, *Finalizada*).
- **Cero efectos de fantasía:** Prohibido el uso de *glassmorphism* exagerado, resplandores (*glow*), sombras desmedidas o bordes hiper-redondeados que imiten plantillas genéricas de IA.
- **Cero iconografía de "chispas" o "asistentes mágicos":** No usar iconos de varitas, estrellas, chispas o robots.

---

### 2. Estándar Visual Aprobado
- **Paleta de Colores:** 
  - Fondo: Blanco (`#FFFFFF`) y grises neutros muy sutiles (`#F8FAFC`, `#F1F5F9`).
  - Bordes y líneas: Gris claro de 1px (`#E2E8F0`, `#CBD5E1`).
  - Tipografía: Tonos pizarra y carbón (`#0F172A`, `#1E293B`, `#475569`).
  - Acentos funcionales: Azul pizarra institucional (`#1E3A8A` / `#0F172A`), verde sobrio para conformidades y rojo sutil para urgencias.
- **Componentes:**
  - Botones estándar con esquinas suaves (`rounded-md`), fondo sólido o borde gris sutil.
  - Tablas limpias, formularios con etiquetas claras y campos bien definidos.
  - Insignias de estado con bordes de 1px y textos técnicos formales.

---

### 3. Redacción y Tono (Copywriting)
- **Lenguaje Técnico-Administrativo:**
  - Emplear términos formales: *Solicitud*, *Requerimiento*, *Beneficiario*, *Titular*, *Vivienda*, *Inspección técnica*, *Resolución*.
  - Prohibido el lenguaje publicitario, exagerado o con signos de exclamación teatrales (nada de *"¡Bienvenido al portal inteligente!"* o *"¡Tu solicitud fue recibida con éxito!"*).
  - Sustituir por redacción clara y directa: *"Solicitud Registrada en la Plataforma"*, *"Atención de Postventa Habitacional"*.
