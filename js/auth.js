// Auth Modal Manager
const AUTH_STORAGE_KEY = 'gradmemories_auth';
const USERS_STORAGE_KEY = 'gradmemories_users';
const VERIFICATION_STORAGE_KEY = 'gradmemories_verification';
const PASSWORD_RESET_STORAGE_KEY = 'gradmemories_password_reset';

// Generar código de verificación (4 dígitos)
function generateVerificationCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Enviar código de verificación de email (simulado)
function sendVerificationEmail(email) {
    const code = generateVerificationCode();
    const verificationData = {
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos
    };
    
    try {
        let verifications = [];
        const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY);
        if (raw) verifications = JSON.parse(raw);
        
        // Remover verificaciones antiguas del mismo email
        verifications = verifications.filter(v => v.email !== email);
        verifications.push(verificationData);
        
        localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(verifications));
        
        // En una app real, esto enviaría un email real
        console.log(`[SIMULADO] Email de verificación enviado a ${email}: ${code}`);
        alert(`Se envió un código de verificación a ${email}\n\n(Simulado: ${code})`);
        
        return true;
    } catch (e) {
        return false;
    }
}

// Verificar código de email
function verifyEmailCode(email, code) {
    try {
        const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY);
        if (!raw) return { ok: false, error: 'Código inválido o expirado' };
        
        const verifications = JSON.parse(raw);
        const verification = verifications.find(v => v.email === email);
        
        if (!verification) return { ok: false, error: 'No hay verificación pendiente' };
        if (new Date() > new Date(verification.expiresAt)) return { ok: false, error: 'Código expirado' };
        if (verification.code !== code) return { ok: false, error: 'Código incorrecto' };
        
        // Remover verificación
        const filtered = verifications.filter(v => v.email !== email);
        localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(filtered));
        
        return { ok: true };
    } catch (e) {
        return { ok: false, error: 'Error al verificar código' };
    }
}

// Obtener usuario actual logueado
function getCurrentUser() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

// Guardar usuario logueado
function saveCurrentUser(user) {
    try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        window.dispatchEvent(new Event('auth-changed'));
    } catch (e) {}
}

// Logout
function logoutUser() {
    try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        window.dispatchEvent(new Event('auth-changed'));
    } catch (e) {}
}

// Obtener todos los usuarios registrados
function getAllUsers() {
    try {
        const raw = localStorage.getItem(USERS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

// Registrar usuario (con verificación de email)
function registerUser(email, password, nombre, colegio) {
    const users = getAllUsers();
    
    // Verificar si el email ya existe
    if (users.some(u => u.email === email)) {
        return { ok: false, error: 'El email ya está registrado' };
    }
    
    // Verificar si el email fue verificado
    const verifications = JSON.parse(localStorage.getItem(VERIFICATION_STORAGE_KEY) || '[]');
    const verified = verifications.some(v => v.email === email && v.verified === true);
    
    // Agregar nuevo usuario
    const newUser = {
        id: Date.now().toString(),
        email,
        password, // En producción, esto debe ser hasheado
        nombre,
        colegio,
        emailVerified: verified,
        registeredAt: new Date().toISOString()
    };
    
    users.push(newUser);
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        return { ok: true, user: newUser };
    } catch (e) {
        return { ok: false, error: 'Error al guardar usuario' };
    }
}

// Login
function loginUser(email, password) {
    const users = getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return { ok: false, error: 'Email o contraseña incorrectos' };
    }
    
    saveCurrentUser({
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        colegio: user.colegio,
        emailVerified: user.emailVerified || false
    });
    
    return { ok: true, user };
}

// Solicitar reset de contraseña
function requestPasswordReset(email) {
    const users = getAllUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
        return { ok: false, error: 'No hay cuenta con ese email' };
    }
    
    const code = generateVerificationCode();
    const resetData = {
        email,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos
    };
    
    try {
        let resets = [];
        const raw = localStorage.getItem(PASSWORD_RESET_STORAGE_KEY);
        if (raw) resets = JSON.parse(raw);
        
        // Remover resets antiguos del mismo email
        resets = resets.filter(r => r.email !== email);
        resets.push(resetData);
        
        localStorage.setItem(PASSWORD_RESET_STORAGE_KEY, JSON.stringify(resets));
        
        console.log(`[SIMULADO] Email de reset enviado a ${email}: ${code}`);
        alert(`Se envió un código de recuperación a ${email}\n\n(Simulado: ${code})`);
        
        return { ok: true };
    } catch (e) {
        return { ok: false, error: 'Error al procesar solicitud' };
    }
}

// Verificar código de reset y cambiar contraseña
function verifyPasswordReset(email, code, newPassword) {
    try {
        const raw = localStorage.getItem(PASSWORD_RESET_STORAGE_KEY);
        if (!raw) return { ok: false, error: 'Código inválido o expirado' };
        
        const resets = JSON.parse(raw);
        const reset = resets.find(r => r.email === email);
        
        if (!reset) return { ok: false, error: 'No hay reset pendiente' };
        if (new Date() > new Date(reset.expiresAt)) return { ok: false, error: 'Código expirado' };
        if (reset.code !== code) return { ok: false, error: 'Código incorrecto' };
        
        // Actualizar contraseña del usuario
        const users = getAllUsers();
        const userIdx = users.findIndex(u => u.email === email);
        if (userIdx < 0) return { ok: false, error: 'Usuario no encontrado' };
        
        users[userIdx].password = newPassword;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        
        // Remover reset
        const filtered = resets.filter(r => r.email !== email);
        localStorage.setItem(PASSWORD_RESET_STORAGE_KEY, JSON.stringify(filtered));
        
        return { ok: true };
    } catch (e) {
        return { ok: false, error: 'Error al verificar código' };
    }
}

// Cambiar entre formularios
function switchAuthForm(form) {
    const forms = ['login', 'signup', 'verify-email', 'forgot-password', 'reset-password'];
    forms.forEach(f => {
        const el = document.getElementById(`auth-${f}-form`);
        if (el) el.style.display = f === form ? 'block' : 'none';
    });
}

// Abrir/cerrar modal
function toggleAuthModal(show) {
    const modal = document.getElementById('auth-modal');
    const overlay = document.getElementById('auth-modal-overlay');
    
    if (!modal || !overlay) return;
    
    if (show === undefined) show = !modal.classList.contains('open');
    
    if (show) {
        modal.classList.add('open');
        overlay.classList.add('open');
        switchAuthForm('login'); // Por defecto, mostrar login
    } else {
        modal.classList.remove('open');
        overlay.classList.remove('open');
    }
}

// Inicializar modal en la página
function initAuthModal() {
    const modal = document.getElementById('auth-modal');
    const overlay = document.getElementById('auth-modal-overlay');
    const closeBtn = document.querySelector('.auth-modal-close');
    const loginBtns = document.querySelectorAll('.btn-login');
    
    // Login
    const loginSubmit = document.getElementById('auth-login-submit');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToForgot = document.getElementById('switch-to-forgot');
    
    // Signup
    const signupSubmit = document.getElementById('auth-signup-submit');
    const switchToLogin = document.getElementById('switch-to-login');
    
    // Verify Email
    const verifyEmailSubmit = document.getElementById('auth-verify-email-submit');
    const resendCode = document.getElementById('resend-verification-code');
    
    // Forgot Password
    const forgotPasswordSubmit = document.getElementById('auth-forgot-password-submit');
    const forgotBackToLogin = document.getElementById('forgot-back-to-login');
    
    // Reset Password
    const resetPasswordSubmit = document.getElementById('auth-reset-password-submit');
    
    if (!modal) return;
    
    // Abrir modal al presionar login
    loginBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const user = getCurrentUser();
            if (user) {
                showUserMenu();
            } else {
                toggleAuthModal(true);
            }
        });
    });
    
    // Cerrar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => toggleAuthModal(false));
    }
    if (overlay) overlay.addEventListener('click', () => toggleAuthModal(false));
    
    // === LOGIN ===
    if (loginSubmit) {
        loginSubmit.addEventListener('click', () => {
            const email = document.getElementById('auth-login-email').value;
            const password = document.getElementById('auth-login-password').value;
            
            if (!email || !password) {
                alert('Por favor completa todos los campos');
                return;
            }
            
            const result = loginUser(email, password);
            if (result.ok) {
                toggleAuthModal(false);
                updateAuthUI();
                alert(`¡Bienvenido, ${result.user.nombre}!`);
            } else {
                alert(result.error);
            }
        });
    }
    
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthForm('signup');
        });
    }
    
    const switchToForgotLink = document.getElementById('switch-to-forgot');
    if (switchToForgotLink) {
        switchToForgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthForm('forgot-password');
        });
    }
    
    if (switchToForgot) {
        switchToForgot.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthForm('forgot-password');
        });
    }
    
    // === SIGNUP ===
    if (signupSubmit) {
        signupSubmit.addEventListener('click', () => {
            const nombre = document.getElementById('auth-signup-nombre').value;
            const colegio = document.getElementById('auth-signup-colegio').value;
            const email = document.getElementById('auth-signup-email').value;
            const password = document.getElementById('auth-signup-password').value;
            
            if (!nombre || !colegio || !email || !password) {
                alert('Por favor completa todos los campos');
                return;
            }
            
            if (password.length < 6) {
                alert('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            
            // Enviar código de verificación
            if (sendVerificationEmail(email)) {
                // Guardar email temporal para verificación
                sessionStorage.setItem('temp_signup_email', email);
                sessionStorage.setItem('temp_signup_data', JSON.stringify({ nombre, colegio, email, password }));
                switchAuthForm('verify-email');
            }
        });
    }
    
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthForm('login');
        });
    }
    
    // === VERIFY EMAIL ===
    if (verifyEmailSubmit) {
        verifyEmailSubmit.addEventListener('click', () => {
            const code = document.getElementById('auth-verify-email-code').value;
            const email = sessionStorage.getItem('temp_signup_email');
            const data = JSON.parse(sessionStorage.getItem('temp_signup_data') || '{}');
            
            if (!code) {
                alert('Por favor ingresa el código');
                return;
            }
            
            const result = verifyEmailCode(email, code);
            if (result.ok) {
                // Marcar email como verificado
                const verifications = JSON.parse(localStorage.getItem(VERIFICATION_STORAGE_KEY) || '[]');
                const idx = verifications.findIndex(v => v.email === email);
                if (idx >= 0) verifications[idx].verified = true;
                localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(verifications));
                
                // Registrar usuario
                const registerResult = registerUser(data.email, data.password, data.nombre, data.colegio);
                if (registerResult.ok) {
                    loginUser(data.email, data.password);
                    sessionStorage.removeItem('temp_signup_email');
                    sessionStorage.removeItem('temp_signup_data');
                    toggleAuthModal(false);
                    updateAuthUI();
                    alert(`¡Bienvenido, ${data.nombre}!`);
                }
            } else {
                alert(result.error);
            }
        });
    }
    
    if (resendCode) {
        resendCode.addEventListener('click', (e) => {
            e.preventDefault();
            const email = sessionStorage.getItem('temp_signup_email');
            if (email) sendVerificationEmail(email);
        });
    }
    
    // === FORGOT PASSWORD ===
    if (forgotPasswordSubmit) {
        forgotPasswordSubmit.addEventListener('click', () => {
            const email = document.getElementById('auth-forgot-password-email').value;
            
            if (!email) {
                alert('Por favor ingresa tu email');
                return;
            }
            
            const result = requestPasswordReset(email);
            if (result.ok) {
                sessionStorage.setItem('temp_reset_email', email);
                switchAuthForm('reset-password');
            } else {
                alert(result.error);
            }
        });
    }
    
    if (forgotBackToLogin) {
        forgotBackToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthForm('login');
        });
    }
    
    // === RESET PASSWORD ===
    if (resetPasswordSubmit) {
        resetPasswordSubmit.addEventListener('click', () => {
            const code = document.getElementById('auth-reset-password-code').value;
            const newPassword = document.getElementById('auth-reset-password-new').value;
            const email = sessionStorage.getItem('temp_reset_email');
            
            if (!code || !newPassword) {
                alert('Por favor completa todos los campos');
                return;
            }
            
            if (newPassword.length < 6) {
                alert('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            
            const result = verifyPasswordReset(email, code, newPassword);
            if (result.ok) {
                sessionStorage.removeItem('temp_reset_email');
                switchAuthForm('login');
                alert('Contraseña actualizada. Por favor inicia sesión');
            } else {
                alert(result.error);
            }
        });
    }
}

// Actualizar UI según estado de login
function updateAuthUI() {
    const user = getCurrentUser();
    const loginBtns = document.querySelectorAll('.btn-login');
    
    loginBtns.forEach(btn => {
        if (user) {
            btn.textContent = `${user.nombre}`;
            btn.classList.add('logged-in');
        } else {
            btn.textContent = 'Iniciar sesión';
            btn.classList.remove('logged-in');
        }
    });
}

// Mostrar menu de usuario (logout)
function showUserMenu() {
    const user = getCurrentUser();
    if (!user) return;
    
    const action = confirm(`¿${user.nombre}, deseas cerrar sesión?`);
    if (action) {
        logoutUser();
        updateAuthUI();
        alert('Sesión cerrada');
    }
}

// Verificar si usuario está logueado (para compra)
function requireLogin() {
    const user = getCurrentUser();
    if (!user) {
        alert('Debes iniciar sesión para comprar');
        toggleAuthModal(true);
        return false;
    }
    return true;
}

// Escuchar cambios de autenticación
window.addEventListener('auth-changed', () => {
    updateAuthUI();
});

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    initAuthModal();
    updateAuthUI();
});
