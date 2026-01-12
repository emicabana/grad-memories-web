Setup rápido del backend de assets

Requisitos:
- Node 18+
- MongoDB (local o Atlas)
- ffmpeg instalado en el sistema (necesario para procesar videos)

Instalación:

```bash
npm install
cp .env.example .env
# editar .env con credenciales reales (MONGODB_URI, MP_ACCESS_TOKEN, JWT_SECRET, SERVER_URL)
npm start
```

Endpoints principales:
- `POST /api/auth/register` body {email,password}
- `POST /api/auth/login` body {email,password}
- `POST /api/uploads` (admin, Bearer token) form-data `file` archivo -> genera preview con marca de agua
- `POST /api/payments/create_preference` (auth) body { assetId }
- `POST /api/payments/webhook/mercadopago` webhook de Mercado Pago
- `GET /previews/<file>` previews públicas
- `GET /api/downloads/:assetId` (auth) descarga original solo para compradores

Notas:
- Los originales se almacenan en `uploads/originals` y previews en `uploads/previews`.
- Las marcas de agua en imágenes se aplican con `sharp`. En videos se aplica con `ffmpeg`.
- Mercado Pago se integra creando una preferencia; la verificación de pagos se maneja en el webhook.
- Este backend es modular y está pensado para integrarse con el frontend existente.
