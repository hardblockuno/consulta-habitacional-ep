# Consulta Habitacional EP

MVP monorepo para una plataforma interna de Entidades Patrocinantes en Chile.

## Sitio web directo

Tambien hay una version estatica lista para uso local y futura publicacion en GitHub Pages:

```text
docs/
  index.html
  app.js
  styles.css
```

Para abrirla localmente, usa el archivo:

```powershell
Start-Process .\docs\index.html
```

Tambien puedes abrirla con doble clic en:

```text
Abrir Consulta Habitacional.bat
```

Esa version no necesita Django, PostgreSQL ni npm. Importa Excel directamente en el navegador y guarda los datos en `localStorage` del navegador. Tambien permite exportar/importar un respaldo JSON para mover datos entre equipos.

### Rukan con extraccion IA

La herramienta Rukan tiene dos modos:

- OCR local: funciona solo con la web estatica y guarda la nomina en este navegador.
- Extraccion con IA: envia cada PDF Rukan al backend local para que OpenAI devuelva un JSON estructurado con socio consultado e integrantes del hogar.

Para usar IA sin exponer la clave en GitHub Pages:

1. Copia `backend/.env.example` como `backend/.env`.
2. En `backend/.env`, agrega tu clave:

```text
OPENAI_API_KEY=tu_clave_openai
OPENAI_MODEL=gpt-5-mini
```

3. Abre con doble clic:

```text
Abrir Consulta Habitacional IA.bat
```

4. En la web, entra a `Nomina Rukan`, marca `Usar extraccion con IA` y deja el endpoint:

```text
http://127.0.0.1:8000/api/rukan/ia-extraer/
```

Nota de seguridad: la clave queda solo en `backend/.env`, archivo que no debe subirse a GitHub. La IA procesa los PDF enviados al backend configurado; usa este modo solo con autorizacion interna para tratar esos documentos.

La pantalla de carga permite dos tipos de archivo:

- Base principal del comite: crea o actualiza personas por RUT/RUN.
- Observaciones y correcciones: se carga despues de la base principal, cruza por RUT/RUN y agrega observaciones internas o actualiza datos como telefono, direccion, etnia, integrantes, RSH, MINVU Conecta o vencimiento de cedula cuando el Excel trae esas columnas.
- Tipos de vivienda: la base principal puede traer una columna por postulante como `TIPO VIVIENDA`, `TIPO DE VIVIENDA`, `CLASIFICACION VIVIENDA`, `VIVIENDA ASIGNADA` o equivalente. La web la guarda en cada persona y usa la hoja `Financiamiento` solo como detalle complementario cuando exista.

### Accesos rapidos para trabajar entre PCs

Para evitar repetir comandos manualmente, hay dos archivos de doble clic:

```text
Iniciar Trabajo.bat
Guardar Cambios.bat
```

Usa `Iniciar Trabajo.bat` antes de empezar. Este archivo ejecuta `git pull` y luego abre la version estatica en `docs/index.html`.

Usa `Guardar Cambios.bat` al terminar. Este archivo muestra el estado, pide un mensaje de commit y ejecuta:

```powershell
git add .
git commit -m "mensaje escrito"
git push
```

Si hay datos sensibles o archivos personales, revisa antes de guardar. La carpeta `Bases datos Comites 2026/` esta ignorada por Git.

Para publicarla despues en GitHub Pages:

1. Sube el proyecto a GitHub.
2. En `Settings > Pages`, elige `Deploy from a branch`.
3. Selecciona la rama principal y la carpeta `/docs`.
4. Guarda los cambios.

Nota: GitHub Pages solo publica archivos estaticos. Si necesitas usuarios, permisos, base centralizada o datos compartidos entre equipos, usa el backend Django/PostgreSQL descrito mas abajo.

## Continuar desde otro PC con Codex

Este repositorio incluye `CONTEXTO_CODEX.md`, pensado para abrir el proyecto en otro computador y seguir trabajando aunque el chat original de Codex no aparezca ahi.

En el otro PC:

```powershell
cd "$env:USERPROFILE\Desktop"
git clone https://github.com/hardblockuno/consulta-habitacional-ep.git
cd consulta-habitacional-ep
```

Luego abre la carpeta con Codex y escribe:

```text
Lee README.md y CONTEXTO_CODEX.md. Quiero seguir trabajando en este proyecto desde aqui.
```

## Stack

- Backend: Django, Django REST Framework, PostgreSQL, pandas, openpyxl.
- Frontend: React, Vite, Tailwind CSS, Axios, React Router DOM.

## Estructura

```text
backend/
  config/
  habitacional/
    services/excel_importer.py
frontend/
  src/
docker-compose.yml
```

## Backend

```powershell
cd backend
Copy-Item .env.example .env
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Levanta PostgreSQL:

```powershell
cd ..
docker compose up -d postgres
```

Migra y ejecuta:

```powershell
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

Para validar sin PostgreSQL local:

```powershell
$env:USE_SQLITE="1"
python manage.py migrate
python manage.py test
```

## Frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

La app queda en `http://localhost:5173` y consume `http://localhost:8000/api`.

## API principal

- `GET /api/personas/`
- `GET /api/personas/{id}/`
- `GET /api/personas/buscar/?q=`
- `POST /api/importar/excel/`
- `POST /api/importar/observaciones/`
- `POST /api/rukan/ia-extraer/`
- `GET /api/dashboard/resumen/`
- `GET /api/alertas/`
- `GET /api/reportes/resumen/`

## Importacion Excel

El endpoint `POST /api/importar/excel/` espera `multipart/form-data`:

- `archivo`: `.xlsx` o `.xls`.
- `comite_nombre`: opcional; si falta se deduce desde el nombre del archivo.
- `comuna`: opcional.
- `ahorro_minimo`: opcional y referencial, por defecto `10`; no genera alerta ni cambia el estado.

El importador:

- busca una hoja `BASE` o similar.
- detecta la fila de encabezados con `RUT/RUN` y nombre completo o nombres/apellidos separados.
- normaliza columnas frecuentes y variantes (`NOMBRE`, `NOMBRES`, `APELLIDO PATERNO`, `RUN POSTULANTE`, `FECHA NACIMIENTO`, `TRAMO RSH`, `FECHA VENC. CI`, `MINVU CONECTA`, etc.).
- si no reconoce automaticamente el formato, muestra un mapeo manual para indicar que columna corresponde a `RUT/RUN`, nombre, apellidos y datos opcionales.
- calcula edad y marca persona mayor desde `edad >= 60`.
- registra RSH y ahorro como datos informativos, y genera alertas por cedula vencida o por vencer y observaciones internas por datos secundarios.
- detecta hijos/cargas familiares cuando existen columnas como `NOMBRE HIJO 1`, `FEC NAC HIJO 1`, `EDAD HIJO 1`, `CARGA`, `DEPENDIENTE`, etc.
- marca revision documental interna si un hijo/carga ya cumplio 18 anos o cumple 18 dentro de los proximos 90 dias.
- crea o actualiza personas por RUT.
- detecta el tipo de vivienda por persona desde la base principal y, cuando existe, cruza la hoja de financiamiento como detalle del comite.

El endpoint `POST /api/importar/observaciones/` espera `multipart/form-data`:

- `archivo`: `.xlsx` o `.xls`.
- `comite_nombre`: opcional; si se informa, solo aplica filas de personas que pertenecen a ese comite.

Este segundo importador:

- busca una columna `RUT/RUN` para asociar cada fila con una persona ya cargada.
- reconoce columnas de observaciones como `OBS`, `OBSERVACION`, `COMENTARIO`, `NOTA`, `MOTIVO`, `REVISION` o `DETALLE`.
- reconoce columnas de correccion frecuentes como telefono, correo, direccion, etnia, integrantes, RSH, MINVU Conecta y vencimiento de cedula.
- conserva las observaciones existentes y evita duplicar textos identicos.
- recalcula las alertas internas y el estado de la persona despues de aplicar correcciones.

## Reglas implementadas

- Persona mayor: `edad >= 60`.
- Etnia o pueblo originario: se identifica cuando el campo de etnia/pueblo originario contiene un valor informado distinto de `No`, `Ninguna`, `Sin dato` o equivalentes.
- Postulacion unipersonal: se identifica cuando el grupo familiar registra `1` integrante o cuando el tipo/grupo familiar indica `unipersonal` o `persona sola`.
- Tipos de vivienda: se leen primero desde la columna de la base principal asociada a cada postulante. La web normaliza codigos internos como `TIPO`, `TIPO AHORRO 35 UF`, `MOVILIDAD REDUCIDA POSTULANTE` o `NEURODIVERGENCIA HIJO` hacia el tipo de vivienda equivalente en financiamiento. Si un mismo tipo aparece repetido en financiamiento, por ejemplo `VIVIENDA BASE` hasta 40% y `VIVIENDA BASE` 50-90%, el RSH de la persona decide la variante correcta: hasta 40% usa la fila 30 UF y sobre 40% usa la fila 35 UF.
- Regla operativa 35 UF: toda persona con RSH mayor a 40% se clasifica inmediatamente en la variante 35 UF, incluso cuando el texto de la base sea generico o exista una coincidencia de financiamiento de 40%.
- Listas operativas por vivienda: en Dashboard, cada fila de tipo de vivienda permite abrir la nomina de personas asociadas y entrar a su ficha individual.
- Adulto mayor y etnia/pueblo originario son criterios de excepcion relevantes para postulaciones unipersonales.
- Cuando una persona registra etnia/pueblo originario, el sistema agrega una observacion interna para revisar y confirmar el certificado de acreditacion indigena. Esta observacion no cambia la aptitud.
- RSH `<= 40`: preferente.
- RSH: dato informativo; no genera alerta ni cambia el estado de postulacion.
- Ahorro: dato informativo; no genera alerta ni cambia el estado de postulacion.
- Cedula vencida: alerta critica.
- Cedula por vencer en 30 dias: alerta preventiva.
- Alerta critica activa: persona bloqueada.
- Alertas preventivas que afectan aptitud: persona observada.
- Observaciones internas, como respaldo de discapacidad, no cambian el estado general.
- Hijos o cargas que cumplen 18 anos generan revision documental interna; no cambian el estado general por si solos.
- Sin alertas activas: persona apta.
