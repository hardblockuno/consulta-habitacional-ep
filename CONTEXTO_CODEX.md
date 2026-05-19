# Contexto para continuar en Codex

Este archivo resume el estado del proyecto para poder abrirlo en otro PC, pedirle a Codex que lo lea y seguir trabajando sin depender del chat original.

## Proyecto

Repositorio oficial:

```text
https://github.com/hardblockuno/consulta-habitacional-ep
```

Sitio publicado con GitHub Pages:

```text
https://hardblockuno.github.io/consulta-habitacional-ep/
```

El proyecto es una plataforma de consulta habitacional para una Entidad Patrocinante. Tiene:

- Backend Django + Django REST Framework en `backend/`.
- Frontend React + Vite + Tailwind en `frontend/`.
- Version estatica directa para GitHub Pages en `docs/`.
- Archivo de apertura rapida `Abrir Consulta Habitacional.bat`.

La version que se usa de forma mas simple hoy es la estatica en `docs/`. Importa archivos Excel en el navegador y guarda datos en `localStorage`.

## Como continuar en otro PC

1. Instalar Git:

```text
https://git-scm.com/downloads
```

2. Instalar Python:

```text
https://www.python.org/downloads/
```

3. Clonar el repositorio:

```powershell
cd "$env:USERPROFILE\Desktop"
git clone https://github.com/hardblockuno/consulta-habitacional-ep.git
cd consulta-habitacional-ep
```

4. Abrir esta carpeta con Codex.

5. En el nuevo chat de Codex, escribir:

```text
Lee README.md y CONTEXTO_CODEX.md. Quiero seguir trabajando en este proyecto desde aqui.
```

## Como ejecutar la web simple

Opcion de doble clic:

```text
Abrir Consulta Habitacional.bat
```

Opcion por terminal:

```powershell
cd docs
python -m http.server 8765
```

Despues abrir:

```text
http://localhost:8765
```

## Flujo para trabajar entre dos PCs

Antes de empezar en un PC:

```powershell
git pull
```

Despues de hacer cambios:

```powershell
git add .
git commit -m "Describe el cambio"
git push
```

En el otro PC, volver a sincronizar:

```powershell
git pull
```

## Reglas funcionales importantes

- RSH es solo informativo.
- RSH no genera alerta, motivo ni estado observado.
- Ahorro es solo informativo.
- Ahorro no genera alerta, motivo ni estado observado.
- Cedula vencida si afecta el estado y deja a la persona bloqueada.
- Cedula por vencer si afecta el estado y deja a la persona observada.
- Observaciones internas de documentacion secundaria no cambian la aptitud de postulacion.
- Discapacidad y adulto mayor deben mostrarse como identificadores visuales en la lista de personas.
- La ficha de persona debe mostrar grupo familiar y su valor.

## Archivos principales

- `docs/index.html`: entrada del sitio estatico publicado.
- `docs/app.js`: logica principal de la version directa.
- `docs/styles.css`: estilos de la version directa.
- `backend/habitacional/services/excel_importer.py`: importador Excel del backend.
- `backend/habitacional/models.py`: modelos Django.
- `README.md`: instrucciones generales de ejecucion.

## Datos sensibles

No subir bases Excel reales ni datos personales al repositorio. La carpeta `Bases datos Comites 2026/` esta ignorada por Git.

Si se necesita trabajar con datos en otro PC, copiarlos por separado o volver a importarlos desde la web.
