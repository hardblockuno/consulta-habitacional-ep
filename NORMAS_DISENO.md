# Normas de Diseño e Implementación: Consulta Habitacional EP

## 🛑 Reglas Inquebrantables de Diseño e Implementación

Toda la plataforma, sus interfaces, componentes y flujos deben cumplir rigurosamente con tres estándares fundamentales:

1. **Cero Clichés de IA y Cero Apariencia Generada por IA.**
2. **Estándares de Diseño Silicon Valley (Linear, Apple, Vercel, Stripe).**
3. **Economía de Texto y Cero Redundancia (Sin Verborrea de IA).**

---

### 1. Principios de Diseño Silicon Valley (Estilo Linear / Apple)

#### A. Micro-Tipografía y Jerarquía Nítida
- **Tipografía Base:** Inter / SF Pro con suavizado estricto (`-webkit-font-smoothing: antialiased`).
- **Densidad de Información:** Tamaños de texto compactos y elegantes:
  - Títulos de sección: `text-xl font-semibold tracking-tight text-zinc-900`.
  - Etiquetas y meta-datos: `text-[11px] font-medium tracking-wider uppercase text-zinc-500`.
  - Cuerpo de datos: `text-[13px] text-zinc-700 leading-normal`.
  - Códigos y fechas: `font-mono text-xs tracking-tight font-medium text-zinc-800`.

#### B. Superficies, Bordes y Acabados (The Linear Look)
- **Bordes milimétricos:** Bordes sutiles y limpios de 1px (`border-zinc-200/80` o `border-slate-200`).
- **Micro-sombras:** Sombras extremadamente contenidas (`shadow-2xs`, `shadow-xs`), nunca difusas ni teatrales.
- **Controles Segmentados:** Conmutadores de pestañas estilo Apple/Linear (`bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70` con pestaña activa en blanco sólido y micro-sombra).
- **Indicadores de Estado (Status Dots):** Estados representados mediante puntos sólidos de 6px (`h-1.5 w-1.5 rounded-full`) acompañados de texto neutro, al estilo de Linear o GitHub:
  - *Pendiente:* Punto ámbar (`bg-amber-500`) + texto `text-zinc-700`.
  - *En atención:* Punto azul (`bg-blue-500`) + texto `text-zinc-700`.
  - *Finalizada:* Punto esmeralda (`bg-emerald-500`) + texto `text-zinc-700`.
  - *Urgente:* Punto rojo (`bg-rose-500`) + texto `text-rose-700`.

#### C. Componentes e Interacción
- **Botón Primario:** `bg-zinc-900 text-white hover:bg-zinc-800 text-[13px] font-medium rounded-md px-3.5 py-1.5 shadow-2xs transition-colors`.
- **Botón Secundario:** `bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-[13px] font-medium rounded-md px-3 py-1.5 shadow-2xs transition-colors`.
- **Campos de Entrada (Inputs):** `bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-all`.
- **Modales:** Fondos oscuros con desenfoque fino (`bg-zinc-900/40 backdrop-blur-xs`), cajas con bordes nítidos y sin elementos flotantes desproporcionados.

---

### 2. Prohibiciones Absolutas (Cero Clichés de IA)
- **Prohibido el uso de degradados espaciales:** Nada de gradientes morados, cianes brillantes o fondos "futuristas" (`bg-gradient-to-r...`).
- **Prohibido el uso de emojis en interfaces formales:** Nada de 🟡, 🔵, 🟢, ⚠️, 📋, 🚀, 🤖, ✨ en botones, tablas, selectores o estados.
- **Prohibido el lenguaje publicitario o exclamativo:** Nada de *"¡Éxito!"*, *"¡Bienvenido al portal inteligente!"* o promesas de IA. El lenguaje es estrictamente sobrio, técnico y administrativo chileno.
- **Prohibido el glassmorphism o neomorfismo:** Superficies limpias, planas y estructuradas con bordes de 1px.

---

### 3. Economía de Texto y Cero Redundancia (Sin Verborrea de IA)
- **Prohibido el texto redundante o explicativo innecesario:** Si una interfaz es intuitiva (títulos claros, botones explícitos, campos bien rotulados), no se deben agregar párrafos explicativos que repitan lo evidente.
- **Sin disclaimers ni sermones:** Evitar avisos largos o discursos sobre confidencialidad que saturan la vista.
- **Alto ratio señal/ruido:** Todo texto debe aportar una instrucción concreta o un dato indispensable. Reducir la cantidad de palabras al mínimo sin perder precisión técnica.
- **Directo al grano:** Formularios y listados van directo a los controles sin banners introductorios redundantes.
