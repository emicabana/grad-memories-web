# 📊 Panel Administrador - GradMemories

## Acceso al Panel Administrador

### URL
```
http://localhost/admin.html
o
file:///ruta/a/admin.html
```

### Credenciales
**Contraseña Administrador:** `admin123`

⚠️ **Nota:** En producción, cambiar esta contraseña en `js/admin.js` (línea 6)

---

## Características del Panel

### 1. **Dashboard**
Vista general del sistema con estadísticas:
- Total de eventos registrados
- Total de fotos subidas
- Total de videos subidos
- Ingresos potenciales (basado en precios)
- Lista de todos los eventos con conteo de medios

### 2. **Subir Media**
Formulario para subir fotos y videos:

**Campos:**
- Evento (dropdown con eventos existentes)
- Tipo de Media (Foto $500 o Video $1000)
- Fotografo/Videógrafo (nombre del autor)
- Archivo (foto o video)

**Proceso:**
1. Seleccionar evento
2. Seleccionar tipo de media
3. Ingresar nombre del fotógrafo
4. Seleccionar archivo
5. Hacer click en "Subir Media"

**Resultado:**
- Archivo se almacena en localStorage (base64)
- Se genera un código único (ID)
- Se asigna automáticamente al evento

### 3. **Gestionar Medios**
Panel para ver, buscar y eliminar medios:

**Funciones:**
- Filtrar por evento
- Ver vista previa de fotos
- Ver información del media (código, fotógrafo, precio, fecha)
- Copiar código ID al portapapeles
- Eliminar media individual

**Código ID Format:**
```
EventoID-IMG/VID + últimos 3 dígitos del ID
Ejemplo: 1-IMG847, 2-VID256
```

### 4. **Gestionar Eventos**
Crear y eliminar eventos:

**Crear Evento:**
- Nombre (obligatorio)
- Fecha (obligatorio)
- Institución (obligatorio)
- Descripción (opcional)

**Eliminar Evento:**
- Botón "Eliminar" en cada tarjeta
- Elimina el evento y TODOS sus medios asociados

**Eventos Predeterminados:**
1. Baile de Egresados 2024 (15/12/2024)
2. Gala de Graduación 2024 (18/12/2024)
3. Fiesta de Egresados 2024 (05/12/2024)

---

## Almacenamiento de Datos

### localStorage Keys

| Clave | Contenido | Estructura |
|-------|-----------|-----------|
| `gradmemories_admin_auth` | Estado de autenticación | `"true"` o no existe |
| `gradmemories_events` | Eventos registrados | Array de eventos |
| `gradmemories_media` | Medios (fotos/videos) | Array de medios |

### Estructura de Evento
```json
{
  "id": "1",
  "name": "Baile de Egresados 2024",
  "date": "2024-12-15",
  "institution": "Colegio Nacional Buenos Aires",
  "description": "Evento de baile...",
  "createdAt": "2024-12-12T10:30:00.000Z"
}
```

### Estructura de Media
```json
{
  "id": "1734067800000",
  "eventId": "1",
  "type": "foto",
  "photographer": "María González",
  "fileName": "foto1.jpg",
  "fileData": "data:image/jpeg;base64,...",
  "price": 500,
  "uploadedAt": "2024-12-12T10:30:00.000Z"
}
```

---

## Seguridad

### Nivel Actual (Prototipo)
- ✅ Acceso protegido con contraseña
- ✅ Solo acceso localStorage local
- ✅ Datos no persisten en servidor

### Para Producción Necesita
- 🔒 Backend real con autenticación JWT
- 🔒 HTTPS obligatorio
- 🔒 Validación en servidor
- 🔒 Bases de datos reales
- 🔒 Permisos de roles
- 🔒 Auditoría de cambios
- 🔒 Backup de datos

---

## Flujo de Trabajo Recomendado

### Día 1: Preparar Eventos
1. Acceder al panel (`admin.html`)
2. Ingresar contraseña: `admin123`
3. Ir a sección "Eventos"
4. Crear eventos si es necesario
5. Anotar los IDs de eventos (aparecen en dashboard)

### Día 2-7: Subir Medios
1. Acceder al panel
2. Ir a sección "Subir Media"
3. Para cada foto/video:
   - Seleccionar evento
   - Seleccionar tipo (foto/video)
   - Ingresar fotógrafo
   - Seleccionar archivo
   - Hacer click en "Subir Media"
4. Verificar en "Dashboard" el progreso

### Antes del Evento (Público)
1. Acceder a "Gestionar Medios"
2. Verificar que todos los medios estén cargados
3. Copiar códigos ID si es necesario
4. Eliminar medios incorrectos si es necesario

---

## Integración con Páginas Públicas

Los medios subidos se mostrarán en las páginas de eventos públicas:
- `evento-baile-egresados-2024.html`
- `evento-gala-graduacion-2024.html`
- `evento-fiesta-egresados-2024.html`

El sistema busca automáticamente los medios del evento correspondiente.

---

## Limitaciones Actuales

⚠️ **Almacenamiento Local:**
- Los datos se guardan en `localStorage` del navegador
- Máximo ~5-10MB de datos
- Si se borra `localStorage`, se pierden todos los datos
- No sincroniza entre navegadores/dispositivos

⚠️ **Archivos:**
- Las imágenes/videos se convierten a base64 en memoria
- Archivos grandes pueden ser lentos
- No hay compresión automática

---

## Cambiar Contraseña

1. Abre `js/admin.js`
2. Busca la línea: `const ADMIN_PASSWORD = 'admin123';`
3. Cambia `'admin123'` por la nueva contraseña