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
- `GET /api/dashboard/resumen/`
- `GET /api/alertas/`
- `GET /api/reportes/resumen/`

## Importacion Excel

El endpoint `POST /api/importar/excel/` espera `multipart/form-data`:

- `archivo`: `.xlsx` o `.xls`.
- `comite_nombre`: opcional; si falta se deduce desde el nombre del archivo.
- `comuna`: opcional.
- `ahorro_minimo`: opcional, por defecto `10`.

El importador:

- busca una hoja `BASE` o similar.
- detecta la fila de encabezados con `NOMBRE` y `RUT`.
- normaliza columnas frecuentes (`FEC NAC`, `FECH NAC`, `RSH`, `AHORRO`, `MINVU CONECTA`, etc.).
- calcula edad y marca persona mayor desde `edad >= 60`.
- registra RSH y ahorro como datos informativos, y genera alertas por cedula vencida o por vencer y observaciones internas por datos secundarios.
- crea o actualiza personas por RUT.

## Reglas implementadas

- Persona mayor: `edad >= 60`.
- RSH `<= 40`: preferente.
- RSH: dato informativo; no genera alerta ni cambia el estado de postulacion.
- Ahorro: dato informativo; no genera alerta ni cambia el estado de postulacion.
- Cedula vencida: alerta critica.
- Cedula por vencer en 30 dias: alerta preventiva.
- Alerta critica activa: persona bloqueada.
- Alertas preventivas que afectan aptitud: persona observada.
- Observaciones internas, como respaldo de discapacidad, no cambian el estado general.
- Sin alertas activas: persona apta.
