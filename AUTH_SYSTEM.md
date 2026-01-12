# Sistema de Autenticación - Funciones Implementadas

## Descripción General
Sistema completo de autenticación con email verificación y recuperación de contraseña. Almacenamiento en localStorage para prototipo rápido.

## Funciones Principales

### 1. **Generación de Códigos**
```javascript
generateVerificationCode()
```
- Genera un código aleatorio de 4 dígitos
- Devuelve string (ej: "1234")

### 2. **Verificación de Email**

#### `sendVerificationEmail(email)`
- Crea un código de 4 dígitos
- Expira en 10 minutos
- Guarda en localStorage bajo la clave `gradmemories_verification`
- Simula envío de email (muestra código en alert)
- Devuelve `true` si éxito, `false` si error

#### `verifyEmailCode(email, code)`
- Valida el código contra el email
- Verifica que no haya expirado (10 minutos)
- Elimina el código usado de localStorage
- Devuelve `{ ok: true }` si éxito
- Devuelve `{ ok: false, error: "mensaje" }` si falla

### 3. **Gestión de Usuarios**

#### `registerUser(email, password, nombre, colegio)`
- Registra un nuevo usuario
- Previene duplicados
- Devuelve `{ ok: true, user: {...} }` si éxito
- Almacena en localStorage bajo `gradmemories_users`

#### `getAllUsers()`
- Obtiene la lista completa de usuarios
- Devuelve array vacío si no hay usuarios

#### `loginUser(email, password)`
- Valida email y contraseña
- Guarda usuario en localStorage bajo `gradmemories_auth`
- Dispara evento `auth-changed`
- Devuelve `{ ok: true, user: {...} }` si éxito

#### `getCurrentUser()`
- Obtiene el usuario actualmente logueado
- Devuelve `null` si no hay usuario logueado

#### `saveCurrentUser(user)`
- Guarda usuario en localStorage
- Dispara evento `auth-changed`

#### `logoutUser()`
- Elimina usuario del localStorage
- Dispara evento `auth-changed`

### 4. **Recuperación de Contraseña**

#### `requestPasswordReset(email)`
- Envía código de reset (4 dígitos)
- Expira en 15 minutos
- Guarda en localStorage bajo `gradmemories_password_reset`
- Simula envío de email
- Devuelve `{ ok: true }` si éxito

#### `verifyPasswordReset(email, code, newPassword)`
- Verifica el código de reset
- Valida que no haya expirado (15 minutos)
- Actualiza la contraseña en localStorage
- Limpia el código usado
- Devuelve `{ ok: true }` si éxito

### 5. **Interfaz Modal**

#### `switchAuthForm(form)`
- Cambia entre formularios dentro del modal
- Valores posibles: `'login'`, `'signup'`, `'verify-email'`, `'forgot-password'`, `'reset-password'`
- Oculta/muestra los formularios con `display: none/block`

#### `toggleAuthModal(show)`
- Abre/cierra el modal de autenticación
- Si `show` es `undefined`, alterna el estado
- Siempre abre en formulario de login

#### `initAuthModal()`
- Configura todos los event listeners
- Debe llamarse al cargar la página (se hace automáticamente)
- Inicializa 5 formularios y sus botones

### 6. **Interfaz de Usuario**

#### `updateAuthUI()`
- Actualiza el botón de login en la navbar
- Muestra nombre del usuario si está logueado
- Muestra "Iniciar sesión" si no hay usuario

#### `showUserMenu()`
- Muestra diálogo de confirmación para logout
- Cierra sesión si el usuario confirma

#### `requireLogin()`
- Guard function para verificar login
- Si no hay usuario: muestra alert y abre modal
- Devuelve `true` si está logueado, `false` si no
- Se usa antes de agregar al carrito o hacer checkout

## Flujos de Usuario

### Flujo 1: Signup con Verificación de Email
1. Usuario hace clic en "Regístrate"
2. Completa: nombre, colegio, email, contraseña
3. Sistema envía código (4 dígitos) a localStorage
4. Usuario ingresa código en modal de verificación
5. Sistema valida código (10 min máximo)
6. Usuario auto-logueado y modal cierra

### Flujo 2: Login
1. Usuario ingresa email y contraseña
2. Sistema valida contra usuarios en localStorage
3. Usuario guardado en localStorage y modal cierra
4. Navbar actualiza a mostrar nombre

### Flujo 3: Recuperar Contraseña
1. Usuario hace clic en "¿Olvidaste tu contraseña?"
2. Ingresa email en formulario
3. Sistema envía código (4 dígitos) a localStorage
4. Usuario ingresa código y nueva contraseña
5. Contraseña actualizada en localStorage
6. Modal regresa al login
7. Usuario puede hacer login con nueva contraseña

## Protección de Compras

```javascript
requireLogin()
```
Se llama antes de cualquier acción de compra:
- En evento detail pages: antes de "Agregar al Carrito"
- En carrito.html: antes de checkout/pago

Si usuario no está logueado:
- Muestra mensaje
- Abre modal de login
- Retorna `false` para prevenir acción

## Almacenamiento (localStorage)

| Clave | Contenido | Estructura |
|-------|-----------|-----------|
| `gradmemories_auth` | Usuario actual logueado | `{ id, email, nombre, colegio, emailVerified }` |
| `gradmemories_users` | Todos los usuarios registrados | Array de usuarios |
| `gradmemories_verification` | Códigos de verificación de email | Array con `{ email, code, expiresAt }` |
| `gradmemories_password_reset` | Códigos de reset de contraseña | Array con `{ email, code, expiresAt }` |

## Almacenamiento (sessionStorage)

Se usa para datos temporales durante flujos multi-paso:
- `temp_signup_email` - Email durante verificación de signup
- `temp_signup_data` - Datos de usuario pendientes de registro
- `temp_reset_email` - Email durante reset de contraseña

Estos se limpian automáticamente al completar el flujo.

## Eventos Personalizados

### `auth-changed`
Se dispara cuando:
- Usuario hace login
- Usuario hace logout
- Usuario completa signup

Escuchadores:
- navbar.js: actualiza UI y nombre en botón

## Limitaciones Actuales

⚠️ **Para Producción Necesita:**
1. Backend real para autenticación (JWT tokens)
2. Hashing de contraseñas (bcrypt, argon2)
3. Servicio de email real (SendGrid, Mailgun, SES)
4. HTTPS obligatorio
5. CSRF protection
6. Rate limiting en endpoints de autenticación
7. Validación de email (confirmar dirección real)
8. 2FA o autenticación multifactor

## Testing

Se incluye `test_auth.html` con pruebas automáticas de:
- Signup con verificación de código
- Login
- Recuperación de contraseña

Abre `test_auth.html` en navegador para probar.

## Ejemplo de Uso

### Verificar si usuario está logueado
```javascript
const user = getCurrentUser();
if (user) {
    console.log(`Hola ${user.nombre}`);
} else {
    console.log('No hay usuario logueado');
}
```

### Requerir login para una acción
```javascript
if (!requireLogin()) return; // Para si no está logueado

// Continuar con la acción
addToCart(item);
```

### Escuchar cambios de autenticación
```javascript
window.addEventListener('auth-changed', () => {
    console.log('El estado de autenticación cambió');
    updateUI();
});
```
