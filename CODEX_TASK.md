# Proyecto: Consulta Habitacional EP

## Objetivo

Construir un MVP de plataforma interna para Entidades Patrocinantes en Chile.

La plataforma debe permitir:

- importar bases Excel de comites habitacionales.
- buscar personas por RUT, nombre, comite o telefono.
- visualizar fichas individuales.
- registrar datos habitacionales y sociales relevantes.
- generar alertas documentales que afecten la aptitud cuando corresponda.
- mostrar dashboards y reportes informativos.

## Estado actual del proyecto

El repositorio tiene tres capas:

- `docs/`: version estatica principal para uso simple y publicacion en GitHub Pages.
- `backend/`: API Django + Django REST Framework.
- `frontend/`: interfaz React + Vite + Tailwind para consumir la API.

La version recomendada para uso inmediato es `docs/`, porque no requiere Django, PostgreSQL ni npm.

## Funcionalidades principales

### Dashboard

Debe mostrar:

- total personas.
- personas aptas.
- observadas.
- bloqueadas.
- personas mayores.
- discapacidad.
- RSH sobre 40% como dato informativo.
- cedulas vencidas.
- alertas criticas y preventivas.

### Buscador

Debe permitir buscar por:

- RUT.
- nombre.
- comite.
- telefono.

La lista de personas debe mostrar identificadores visuales para:

- persona mayor.
- discapacidad.

### Ficha persona

Debe mostrar:

- identificacion.
- comite.
- RSH.
- ahorro.
- postulacion.
- documentos.
- alertas.
- observaciones.
- grupo familiar y su valor.
- hijos/cargas familiares y revision por mayoria de edad.

### Importador Excel

Debe:

- leer Excel.
- detectar hoja `BASE` o similar.
- detectar encabezados con `NOMBRE` y `RUT`.
- normalizar columnas frecuentes.
- calcular edad.
- detectar personas mayores.
- registrar RSH como dato informativo.
- registrar ahorro como dato informativo.
- detectar cedulas vencidas o por vencer.
- detectar hijos/cargas que ya cumplieron 18 anos o estan proximos a cumplirlos.
- crear o actualizar personas por RUT.

## Reglas funcionales vigentes

### Persona mayor

`edad >= 60`.

### RSH

- `<= 40`: preferente.
- `> 40`: dato informativo.
- No genera alerta.
- No genera motivo.
- No cambia el estado general.

### Ahorro

- Es dato informativo.
- Puede compararse contra una referencia para reportes.
- No genera alerta.
- No genera motivo.
- No cambia el estado general.

### Cedula

- Vencida: alerta critica y persona bloqueada.
- Por vencer dentro de 30 dias: alerta preventiva y persona observada.

### Discapacidad

- Debe mostrarse como identificador visual.
- Puede generar observacion o alerta interna de respaldo.
- No cambia el estado general por si sola.

### Hijos/cargas familiares y mayoria de edad

- Se detectan desde columnas como `NOMBRE HIJO 1`, `FEC NAC HIJO 1`, `EDAD HIJO 1`, `CARGA` o `DEPENDIENTE`.
- Si un hijo/carga ya cumplio 18 anos, requiere revision documental interna.
- Si un hijo/carga cumple 18 dentro de los proximos 90 dias, requiere revision documental interna.
- La revision de hijos/cargas no cambia el estado general por si sola.

### Estado general

- Alerta critica activa que impacta estado: persona bloqueada.
- Alerta preventiva activa que impacta estado: persona observada.
- Sin alertas activas que impacten estado: persona apta.

## Datos sensibles

No subir bases Excel reales ni datos personales al repositorio.

La carpeta `Bases datos Comites 2026/` debe mantenerse ignorada por Git.
