# Configuración de Pagos - GradMemories

Este documento explica cómo configurar el sistema de pagos con Mercado Pago y Transferencia Bancaria.

## Variables de Entorno (.env)

Agrega las siguientes variables a tu archivo `.env`:

```
# Mercado Pago
MP_ACCESS_TOKEN=tu_token_mercado_pago

# Configuración de Transferencia Bancaria
BANK_NAME=Tu Banco
ACCOUNT_HOLDER=GradMemories
BANK_CBU=0000000000000000000000
BANK_CUIT=20-00000000-0
BANK_ACCOUNT=0000000000
CONTACT_PHONE=+54 9 502-9031
CONTACT_WHATSAPP=+5495029031
```

## Métodos de Pago Disponibles

### 1. Mercado Pago 💳
- El usuario elige la opción "Mercado Pago"
- Es redirigido automáticamente al checkout de Mercado Pago
- Se maneja mediante webhooks automáticos
- **No requiere configuración adicional** (solo el `MP_ACCESS_TOKEN`)

### 2. Transferencia Bancaria 🏦
- El usuario elige la opción "Transferencia Bancaria"
- Ve los datos de la cuenta bancaria configurada
- Realiza la transferencia y sube el comprobante
- El comprobante se guarda en `uploads/transfer_proofs/`
- Se genera un enlace directo a WhatsApp para contactar
- **Requiere que configures tus datos bancarios** en `.env`

## Flujo de Transferencia Bancaria

1. **Usuario selecciona "Transferencia Bancaria"**
   - Se crea una orden con estado `pending`

2. **Se muestran los datos bancarios**
   - CBU, CUIT, Número de Cuenta, etc.
   - Monto total a transferir

3. **Usuario realiza la transferencia**
   - Usa su banco para transferir el dinero
   - Captura el comprobante

4. **Usuario sube el comprobante**
   - Selecciona la imagen del comprobante
   - El sistema la guarda en `uploads/transfer_proofs/`
   - Se genera link directo a WhatsApp

5. **Contacto por WhatsApp**
   - Usuario envía el comprobante por WhatsApp
   - Equipo verifica y aprueba la orden
   - Archivos se liberan al usuario

## Datos Bancarios Recomendados

Para una institución financiera argentina (CBU format):
- **CBU**: 23 dígitos (formato: 0160000000000000000000)
- **CUIT**: 11 dígitos (formato: 20-00000000-0)
- **Número de Cuenta**: Los últimos 3 dígitos del CBU

## Ejemplo de .env Configurado

```env
# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-1234567890123456789012345678901234567890

# Banco
BANK_NAME=Banco Nación
ACCOUNT_HOLDER=GradMemories
BANK_CBU=0160000000000000000000
BANK_CUIT=20-12345678-9
BANK_ACCOUNT=000
CONTACT_PHONE=+54 9 11-5555-5555
CONTACT_WHATSAPP=+541155555555
```

## Archivos Generados

- **Órdenes**: Se guardan en MongoDB con campo `paymentMethod`
- **Comprobantes**: Se guardan en `uploads/transfer_proofs/{orderid}_{timestamp}.jpg`
- **URLs WhatsApp**: Se generan dinámicamente con el monto y referencia

## Solución de Problemas

### "No se puede subir el comprobante"
- Verifica que la carpeta `uploads/transfer_proofs/` está creada
- Comprueba permisos de escritura en el servidor

### "No aparecen los datos bancarios"
- Verifica que las variables `.env` están configuradas
- Reinicia el servidor después de cambiar `.env`

### "El WhatsApp no abre"
- Verifica el formato del número: debe ser sin espacios ni guiones
- Formato correcto: `5495029031` (sin el +)

## API Endpoints

### POST `/api/payments/create_transference_order`
Crea una orden para pago por transferencia.

**Body:**
```json
{
  "items": [
    { "assetId": "id_del_asset_1", "price": 100 },
    { "id": "id_del_asset_2", "price": 200 }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "orders": [{ "_id": "order_id" }],
  "bankDetails": { ... },
  "totalAmount": "300.00",
  "whatsappLink": "https://wa.me/5495029031?text=..."
}
```

### POST `/api/payments/submit_transference_proof`
Sube el comprobante de transferencia.

**Body (FormData):**
- `orderId`: ID de la orden
- `reference`: Referencia de la transferencia
- `proof`: Archivo de imagen (multipart)

### GET `/api/payments/bank_details`
Obtiene los datos bancarios configurados.

## Notas de Seguridad

- Los datos bancarios se guardan en `.env` (no commitar este archivo)
- Los comprobantes se guardan con timestamp para seguridad
- Se recomienda revisar comprobantes manualmente antes de liberar archivos
- Se pueden implementar sistemas de autoverificación OCR en futuro
