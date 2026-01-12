<!-- Instrucciones para agentes de codificación (Copilot / AI) específicas del repo -->
# Copilot instructions — GradMemories API / frontend

Este repo contiene un frontend estático y un backend Node/Express modular en `api/`.
Sigue estas pautas para ser productivo rápidamente con cambios o correcciones.

- **Arquitectura (big picture):** El backend está en `api/` (entrada: `api/server.js`).
  - Rutas: `api/routes/*` registradas en `server.js` (`/api/auth`, `/api/uploads`, `/api/payments`, `/api/downloads`, `/api/admin`).
  - Controladores: `api/controllers/*` implementan la lógica por ruta.
  - Utilidades: `api/utils/` (p. ej. `storage.js`) maneja persistencia/archivos.
  - Previews estáticas: `uploads/previews` servidas como `/previews` desde `server.js`.

- **Flujos críticos:**
  - Uploads: `POST /api/uploads` (usa `multer`, procesa con `sharp` o `ffmpeg`, guarda en `uploads/originals` y `uploads/previews`).
  - Pagos: `POST /api/payments/create_preference` + webhook en `POST /api/payments/webhook/mercadopago`.
  - Descargas: `GET /api/downloads/:assetId` valida autorización y sirve originales sólo a compradores.

- **Dependencias e integraciones externas:**
  - Mercado Pago: token en `.env` (`MP_ACCESS_TOKEN`) y webhook endpoint.
  - MongoDB: `MONGODB_URI` en `.env` (conectar en `api/server.js`).
  - ffmpeg: requerido para procesamiento de video (instalación en el sistema).

- **Comandos y workflow para desarrolladores:**
  - Requisitos: Node 18+, MongoDB, ffmpeg en PATH.
  - Instalar y ejecutar localmente:
    - `npm install`
    - `cp .env.example .env` y configurar `MONGODB_URI`, `MP_ACCESS_TOKEN`, `JWT_SECRET`, `SERVER_URL`
    - `npm start` (usa `node api/server.js` según `package.json`).

- **Convenciones del proyecto (útiles para generar código):**
  - Autenticación: JWT; revisa `api/middleware/auth.js` y endpoints en `api/routes/auth.js`.
  - Archivos grandes/medios: subir por form-data `file` en `POST /api/uploads`.
  - Namespaces de ruta: siempre prefija con `/api/*` en el backend; previews se consumen desde `/previews/<file>`.
  - No exponer `uploads/originals` estáticamente; las descargas pasan por el controlador de `downloads`.

- **Ejemplos rápidos para cambios comunes:**
  - Añadir campo en modelo `api/models/Asset.js`: actualizar esquema, adaptar controladores en `api/controllers/uploadController.js` y rutas.
  - Cambiar el procesamiento de preview: editar `api/controllers/uploadController.js` y utilidades en `api/utils/storage.js`.

- **Qué evitar / notas prácticas:**
  - No cambiar la ruta `/previews` a menos que actualices `server.js` y las referencias en el frontend.
  - Verifica tokens y variables en `.env` antes de probar integraciones de pago.

Si algo no queda claro o quieres que incluya ejemplos más detallados (p. ej. fragmentos de `uploadController.js` o flujo de pagos), dímelo y lo amplío.
