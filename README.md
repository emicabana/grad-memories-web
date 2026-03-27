# GradMemories — Backend local testing

Instrucciones rápidas para probar pagos y webhooks en local.

Prerequisitos
- Node 18+, MongoDB local corriendo, `ffmpeg` en PATH.
- Copiar `.env.example` → `.env` y configurar `MONGODB_URI`, `MP_ACCESS_TOKEN`, `JWT_SECRET`.

Variables importantes en `.env`
- `MONGODB_URI` — URI de MongoDB (ej: `mongodb://localhost:27017/gradmemories`).
- `MP_ACCESS_TOKEN` — token de Mercado Pago (sandbox OK).
- `SERVER_URL` — URL pública o local. Para pruebas con Mercado Pago reales necesita ser HTTPS (ngrok recomendado).

Flujos de prueba locales (sin webhook HTTPS)
1) Crear preferencia utilizando script directo (usa la API de Mercado Pago desde tu máquina):

```bash
node scripts/mp_direct.js
```

2) Crear preferencia usando el endpoint del servidor (usa `SERVER_URL` solamente para back_urls; si no es HTTPS Mercado Pago puede rechazar `notification_url`):

```bash
node scripts/test_create_pref.js
```

3) Simular webhook localmente (marca la `Order` como `paid` sin pasar por Mercado Pago):

```bash
# Usage: node scripts/simulate_webhook.js <preference_id> [payment_id] [status]
node scripts/simulate_webhook.js <PREFERENCE_ID>
```

- El endpoint local `POST /api/payments/webhook/mercadopago` acepta cargas con `__simulate: true` y marcará la `Order` correspondiente como `paid` (solo en entornos no `production`).

Exponer HTTPS rápidamente (recomendado para pruebas reales de Mercado Pago)
- Instala `ngrok` y ejecuta `ngrok http 3000`.
- Copia la URL `https://...` y establece `SERVER_URL` en `.env` con esa URL.
- Reinicia el servidor y vuelve a crear la preferencia desde `POST /api/payments/create_preference`.

Comprobaciones útiles
- Health: `GET /api/health`.
- Previews públicas: `GET /previews/<filename>`.
- Logs de creación de preferencias: `logs/mp_debug.log`.

Scripts relevantes
- `scripts/mp_direct.js` — crea preferencias directamente contra la API de Mercado Pago.
- `scripts/test_create_pref.js` — login + llama a `/api/payments/create_preference`.
- `scripts/simulate_webhook.js` — envía payload simulado a `/api/payments/webhook/mercadopago`.

Si querés, puedo añadir instrucciones para integrar Checkout Pro/Bricks en el frontend o ampliar la validación de webhooks (firma/idemponentencia).