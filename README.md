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

La pantalla de carga permite dos tipos de archivo:

- Base principal del comite: crea o actualiza personas por RUT/RUN.
- Observaciones y correcciones: se carga despues de la base principal, cruza por RUT/RUN y agrega observaciones internas o actualiza datos como telefono, direccion, etnia, integrantes, RSH, MINVU Conecta o vencimiento de cedula cuando el Excel trae esas columnas.
- Desglose de tipos de vivienda: si el Excel trae una hoja `Financiamiento` o similar con columnas `TIPO VIVIENDA` y `N° VIVIENDAS`, la web guarda ese resumen en el comite activo y lo muestra en Dashboard por clasificacion.

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
- detecta, cuando existe, la hoja de financiamiento con el desglose de tipos de vivienda y la conserva como dato del comite.

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
- Tipos de vivienda: se leen desde la hoja de financiamiento del Excel y se agrupan como vivienda base, grupo familiar, neurodivergencia, discapacidad o combinada.
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
