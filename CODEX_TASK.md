# Proyecto: Consulta Habitacional EP

## Objetivo

Construir un MVP de plataforma interna para Entidades Patrocinantes en Chile.

La plataforma debe permitir:

- importar bases Excel de comités habitacionales.
- buscar personas por RUT, nombre o comité.
- visualizar fichas individuales.
- generar alertas documentales y sociales.
- mostrar dashboards y reportes.

## Stack requerido

### Backend
- Python
- Django
- Django REST Framework
- PostgreSQL
- pandas
- openpyxl

### Frontend
- React
- Vite
- Tailwind CSS
- Axios
- React Router DOM

## Funcionalidades principales

### 1. Dashboard
Debe mostrar:
- total personas
- personas aptas
- observadas
- bloqueadas
- personas mayores
- discapacidad
- RSH sobre 40%
- ahorro insuficiente
- cédulas vencidas

### 2. Buscador
Debe permitir buscar por:
- RUT
- nombre
- comité
- teléfono

### 3. Ficha persona
Debe mostrar:
- identificación
- comité
- RSH
- ahorro
- postulación
- documentos
- alertas
- observaciones

### 4. Importador Excel
Debe:
- leer Excel con pandas
- leer hoja BASE
- validar columnas
- calcular edad
- detectar personas mayores
- detectar cédulas vencidas
- detectar ahorro insuficiente
- generar alertas
- crear o actualizar personas

### 5. Backend API

Endpoints mínimos:

GET /api/personas/
GET /api/personas/{id}/
GET /api/personas/buscar/?q=
POST /api/importar/excel/
GET /api/dashboard/resumen/

## Modelos requeridos

- Comite
- Persona
- CaracterizacionSocial
- RSH
- Ahorro
- Postulacion
- Documento
- Observacion
- Alerta
- ImportacionExcel

## Reglas importantes

### Persona mayor
edad >= 60

### RSH
- <= 40: preferente
- > 40: observación

### Cédula
- vencida: alerta crítica
- por vencer 30 días: alerta preventiva

### Estado general
- alerta crítica → bloqueada
- alertas preventivas → observada
- sin alertas → apta

## Frontend requerido

Rutas:

/dashboard
/personas
/personas/:id
/importar
/alertas
/reportes

## Resultado esperado

El proyecto debe quedar funcionando con:

- backend Django operativo
- frontend React operativo
- PostgreSQL configurado
- importador Excel funcional
- dashboard funcional
- buscador funcional
- ficha individual funcional
