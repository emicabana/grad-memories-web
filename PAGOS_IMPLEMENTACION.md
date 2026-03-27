# Sistema de Pagos Mejorado - GradMemories

## ¿Qué ha cambiado?

Se ha implementado un nuevo sistema de pagos con **dos opciones**:

### 1. **Mercado Pago** 💳
- Pago directo y seguro
- Redirige a la plataforma de Mercado Pago
- Confirmación automática

### 2. **Transferencia Bancaria** 🏦 ✨ NUEVO
- El usuario ve los datos de tu cuenta
- Realiza la transferencia por su banco
- Sube el comprobante como imagen
- Se envía automáticamente referencia por WhatsApp
- Genera link directo a WhatsApp para contactar

## Instalación y Configuración

### Paso 1: Instalar Dependencias

Si no tienes `express-fileupload` instalad, ejecuta:

```bash
npm install express-fileupload
```

### Paso 2: Configurar Variables de Entorno

Edita o crea tu archivo `.env` e incluye:

```env
# Tus datos bancarios existentes...
MP_ACCESS_TOKEN=TU_TOKEN_MP

# NUEVO: Configuración de Transferencia Bancaria
BANK_NAME=Tu Banco
ACCOUNT_HOLDER=GradMemories
BANK_CBU=9110000012345678901234
BANK_CUIT=20-12345678-9
BANK_ACCOUNT=123456789
CONTACT_PHONE=+54 9 11-5555-5555
CONTACT_WHATSAPP=+541155555555
```

### Paso 3: Reiniciar el Servidor

```bash
npm start
```

### Paso 4: Crear Carpeta de Comprobantes

El servidor creará automáticamente `uploads/transfer_proofs/`, pero puedes crearla manualmente:

```bash
mkdir -p uploads/transfer_proofs
```

## Cómo Funciona para el Usuario

### Flujo de Compra:

1. **Cliente agrega artículos al carrito**
   - Hace clic en "Pagar ahora"

2. **Selecciona método de pago**
   - Opción 1: Mercado Pago
   - Opción 2: Transferencia Bancaria

3. **Si elige Transferencia:**
   - Ve los datos de tu cuenta
   - Monto exacto a transferir
   - Realiza la transferencia por su banco
   - Captura el comprobante

4. **Sube el comprobante**
   - Selecciona la foto/PDF del comprobante
   - Hace clic en "Subir Comprobante"
   - Le aparece un botón de WhatsApp

5. **Contacta por WhatsApp**
   - Abre WhatsApp
   - Envía el comprobante
   - Espera confirmación del equipo

## Archivos Nuevos/Modificados

### Nuevos Archivos:
- `api/config/bankConfig.js` - Configuración de datos bancarios
- `PAYMENT_CONFIG.md` - Documentación técnica completa

### Archivos Modificados:
- `api/server.js` - Agregado express-fileupload
- `api/models/Order.js` - Campos para paymentMethod y comprobante
- `api/controllers/paymentController.js` - Nuevas funciones de transferencia
- `api/routes/payments.js` - Nuevas rutas de transferencia
- `carrito.html` - Interfaz de selección de pago
- `.env.example` - Variables de configuración

### Estructura de Carpetas:
```
uploads/
├── originals/
├── previews/
└── transfer_proofs/    ← Nuevos comprobantes aquí
```

## Endpoints Nuevos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/payments/create_transference_order` | Crea orden de transferencia |
| POST | `/api/payments/submit_transference_proof` | Sube comprobante |
| GET | `/api/payments/bank_details` | Obtiene datos bancarios |

## Seguridad

✅ **Implementado:**
- Datos bancarios en `.env` (no en el código)
- Comprobantes guardados con timestamp
- Validación de órdenes
- IDs únicos para cada transferencia

## Solución de Problemas

**"Falta express-fileupload"**
```bash
npm install express-fileupload
```

**"No se sube el comprobante"**
- Verifica que `uploads/transfer_proofs/` existe
- Comprueba permisos (755 para la carpeta)
- Mira los logs del servidor

**"No se abre WhatsApp"**
- Verifica el número en `.env` (sin espacios ni guiones)
- Formato: `5495029031`

**"No aparecen los datos bancarios en el modal"**
- Verifica que editaste `.env`
- Reinicia: `npm start`
- Mira la consola del servidor

## Próximas Mejoras

Puedes implementar:
- ✨ Verificación automática OCR de comprobantes
- ✨ Base de datos de transacciones confirmadas
- ✨ Dashboard de administrador para comprobantes
- ✨ Email automático al cliente
- ✨ Integración con APIs de bancos

## Contacto y Soporte

Para preguntas sobre el sistema de pagos:
- 📞 WhatsApp: +54 9 502-9031
- 📧 Email: contacto@gradmemories.com

## Cambios en el Modelo de Datos

**Order.js ahora incluye:**
```javascript
{
  paymentMethod: 'mercadopago' | 'transferencia',
  proofOfPaymentUrl: 'path/to/proof.jpg',
  transferenceReference: 'ref_code'
}
```

---

**¡Sistema listo!** El logo de WhatsApp ahora funciona como:
- 🔴 Botón flotante en todas las páginas (contacto general)
- 🟢 Opción de transferencia bancaria (con comprobante)
- 🟢 Contacto directo automático para confirmación
