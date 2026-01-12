// Admin Panel Management System
const ADMIN_STORAGE_KEY = 'gradmemories_admin_auth';
const EVENTS_STORAGE_KEY = 'gradmemories_events';
const MEDIA_STORAGE_KEY = 'gradmemories_media';
const ADMIN_PASSWORD = 'admin123'; // Contraseña por defecto (cambiar en producción)

let adminAuthenticated = false;
let currentEvent = null;
let selectedFile = null;

// ================== AUTENTICACIÓN ==================

function isAdminAuthenticated() {
    try {
        const auth = localStorage.getItem(ADMIN_STORAGE_KEY);
        return auth === 'true';
    } catch (e) {
        return false;
    }
}

function adminLogin(password) {
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        adminAuthenticated = true;
        showAdminPanel();
        return true;
    }
    return false;
}

function adminLogout() {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    adminAuthenticated = false;
    hideAdminPanel();
}

// ================== EVENTOS ==================

function getDefaultEvents() {
    return [
        {
            id: '1',
            name: 'Baile de Egresados 2024',
            date: '2024-12-15',
            institution: 'Colegio Nacional Buenos Aires',
            description: 'Evento de baile para egresados del año 2024',
            createdAt: new Date().toISOString()
        },
        {
            id: '2',
            name: 'Gala de Graduación 2024',
            date: '2024-12-18',
            institution: 'Instituto San Martín',
            description: 'Ceremonia de graduación formal',
            createdAt: new Date().toISOString()
        },
        {
            id: '3',
            name: 'Fiesta de Egresados 2024',
            date: '2024-12-05',
            institution: 'Escuela Técnica N°1',
            description: 'Fiesta de despedida para egresados',
            createdAt: new Date().toISOString()
        }
    ];
}

function getEvents() {
    try {
        const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
        if (!raw) {
            const defaults = getDefaultEvents();
            localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(defaults));
            return defaults;
        }
        return JSON.parse(raw);
    } catch (e) {
        return getDefaultEvents();
    }
}

function createEvent(name, date, institution, description) {
    const events = getEvents();
    const newEvent = {
        id: Date.now().toString(),
        name,
        date,
        institution,
        description,
        createdAt: new Date().toISOString()
    };
    events.push(newEvent);
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    return newEvent;
}

function deleteEvent(eventId) {
    let events = getEvents();
    events = events.filter(e => e.id !== eventId);
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    
    // Eliminar medios asociados
    let media = getMedia();
    media = media.filter(m => m.eventId !== eventId);
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(media));
}

// ================== MEDIA ==================

function getMedia() {
    try {
        const raw = localStorage.getItem(MEDIA_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function addMedia(eventId, type, photographer, fileName, fileData) {
    const media = getMedia();
    const newMedia = {
        id: Date.now().toString(),
        eventId,
        type, // 'foto' o 'video'
        photographer,
        fileName,
        fileData, // base64 string
        price: type === 'foto' ? 500 : 1000,
        uploadedAt: new Date().toISOString()
    };
    media.push(newMedia);
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(media));
    return newMedia;
}

function deleteMedia(mediaId) {
    let media = getMedia();
    media = media.filter(m => m.id !== mediaId);
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(media));
}

function getMediaByEvent(eventId) {
    const media = getMedia();
    return eventId ? media.filter(m => m.eventId === eventId) : media;
}

function getMediaStats() {
    const media = getMedia();
    const fotos = media.filter(m => m.type === 'foto').length;
    const videos = media.filter(m => m.type === 'video').length;
    const total = fotos + videos;
    const ingresos = media.reduce((sum, m) => sum + m.price, 0);
    return { fotos, videos, total, ingresos };
}

// ================== UI - MOSTRADORES ==================

function showAdminPanel() {
    document.getElementById('admin-login-modal').style.display = 'none';
    document.getElementById('admin-header').style.display = 'block';
    document.getElementById('admin-content').style.display = 'block';
    
    // Inicializar UI
    loadEventSelectors();
    loadDashboard();
    loadMediaList();
    loadExistingEvents();
}

function hideAdminPanel() {
    document.getElementById('admin-login-modal').style.display = 'flex';
    document.getElementById('admin-header').style.display = 'none';
    document.getElementById('admin-content').style.display = 'none';
    
    // Limpiar formularios
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-error').style.display = 'none';
}

function loadDashboard() {
    const events = getEvents();
    const stats = getMediaStats();
    
    document.getElementById('stat-eventos').textContent = events.length;
    document.getElementById('stat-fotos').textContent = stats.fotos;
    document.getElementById('stat-videos').textContent = stats.videos;
    document.getElementById('stat-ingresos').textContent = `$${stats.ingresos}`;
    
    // Listar eventos
    const eventsList = document.getElementById('events-list');
    eventsList.innerHTML = '';
    events.forEach(event => {
        const eventMedia = getMediaByEvent(event.id);
        const html = `
            <div class="bg-[#0f1221] p-4 rounded-lg border border-gray-700">
                <h4 class="text-purple-300 font-semibold mb-2">${event.name}</h4>
                <p class="text-gray-400 text-sm mb-2">${event.institution}</p>
                <p class="text-gray-500 text-xs mb-3">${event.date}</p>
                <div class="flex gap-2 text-sm">
                    <span class="text-blue-400">📷 ${eventMedia.filter(m => m.type === 'foto').length} fotos</span>
                    <span class="text-green-400">🎥 ${eventMedia.filter(m => m.type === 'video').length} videos</span>
                </div>
            </div>
        `;
        eventsList.innerHTML += html;
    });
}

function loadEventSelectors() {
    const events = getEvents();
    
    // Upload event selector
    const uploadSelect = document.getElementById('upload-event');
    uploadSelect.innerHTML = '<option value="">-- Selecciona un evento --</option>';
    events.forEach(event => {
        const option = document.createElement('option');
        option.value = event.id;
        option.textContent = event.name;
        uploadSelect.appendChild(option);
    });
    
    // Filter event selector
    const filterSelect = document.getElementById('filter-event');
    filterSelect.innerHTML = '<option value="">-- Todos los eventos --</option>';
    events.forEach(event => {
        const option = document.createElement('option');
        option.value = event.id;
        option.textContent = event.name;
        filterSelect.appendChild(option);
    });
}

function loadMediaList(eventFilter = '') {
    const mediaList = getMediaByEvent(eventFilter);
    const container = document.getElementById('media-container');
    const noMedia = document.getElementById('no-media');
    
    if (mediaList.length === 0) {
        container.style.display = 'none';
        noMedia.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    noMedia.style.display = 'none';
    container.innerHTML = '';
    
    mediaList.forEach(media => {
        const event = getEvents().find(e => e.id === media.eventId);
        const isImage = media.type === 'foto';
        const codeId = `${event.id}-${isImage ? 'IMG' : 'VID'}${String(media.id).slice(-3)}`;
        
        const html = `
            <div class="media-card">
                <div class="media-preview">
                    ${isImage ? `<img src="${media.fileData}" alt="Foto">` : `
                        <div class="text-center">
                            <div style="font-size: 40px;">🎥</div>
                            <div style="font-size: 12px; color: #9ca3af; margin-top: 5px;">Video</div>
                        </div>
                    `}
                </div>
                <div class="media-info">
                    <h4>${codeId}</h4>
                    <p>👤 ${media.photographer}</p>
                    <p>💵 $${media.price}</p>
                    <p style="font-size: 0.75rem;">${new Date(media.uploadedAt).toLocaleDateString()}</p>
                    <div class="media-actions">
                        <button class="btn-copy" onclick="copyToClipboard('${codeId}')">Copiar ID</button>
                        <button class="btn-danger" onclick="deleteMediaItem('${media.id}')">Eliminar</button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

function loadExistingEvents() {
    const events = getEvents();
    const container = document.getElementById('existing-events');
    container.innerHTML = '';
    
    events.forEach(event => {
        const html = `
            <div class="event-btn" data-event-id="${event.id}">
                <div style="font-weight: bold; color: #a78bfa; margin-bottom: 5px;">${event.name}</div>
                <div style="font-size: 0.8rem; color: #9ca3af;">${event.date}</div>
                <button class="btn-danger" style="width: 100%; margin-top: 8px;" onclick="deleteEventItem('${event.id}')">Eliminar</button>
            </div>
        `;
        container.innerHTML += html;
    });
}

function showMessage(elementId, message, type = 'success') {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    element.style.display = 'block';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`ID copiado: ${text}`);
    });
}

// ================== EVENTOS DE INTERFACE ==================

document.addEventListener('DOMContentLoaded', () => {
    // Login
    document.getElementById('admin-login-btn').addEventListener('click', () => {
        const password = document.getElementById('admin-password').value;
        if (!password) {
            document.getElementById('admin-error').textContent = '⚠️ Ingresa la contraseña';
            document.getElementById('admin-error').style.display = 'block';
            return;
        }
        
        if (adminLogin(password)) {
            document.getElementById('admin-error').style.display = 'none';
        } else {
            document.getElementById('admin-error').textContent = '❌ Contraseña incorrecta';
            document.getElementById('admin-error').style.display = 'block';
        }
    });
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        if (confirm('¿Deseas cerrar la sesión de administrador?')) {
            adminLogout();
        }
    });
    
    // Navegación de secciones
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(section).classList.add('active');
        });
    });
    
    // File input
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                selectedFile = {
                    name: file.name,
                    data: event.target.result
                };
                document.getElementById('file-name').textContent = `✓ ${file.name}`;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Upload button
    document.getElementById('upload-btn').addEventListener('click', () => {
        const eventId = document.getElementById('upload-event').value;
        const type = document.getElementById('upload-type').value;
        const photographer = document.getElementById('upload-photographer').value;
        const uploadMsg = document.getElementById('upload-message');
        
        if (!eventId || !type || !photographer || !selectedFile) {
            showMessage('upload-message', '⚠️ Completa todos los campos y selecciona un archivo', 'error');
            return;
        }
        
        addMedia(eventId, type, photographer, selectedFile.name, selectedFile.data);
        showMessage('upload-message', `✓ ${type === 'foto' ? 'Foto' : 'Video'} subido correctamente`, 'success');
        
        // Limpiar formulario
        document.getElementById('upload-event').value = '';
        document.getElementById('upload-type').value = '';
        document.getElementById('upload-photographer').value = '';
        document.getElementById('file-name').textContent = '';
        selectedFile = null;
        fileInput.value = '';
        
        loadMediaList();
        loadDashboard();
    });
    
    // Create event
    document.getElementById('create-event-btn').addEventListener('click', () => {
        const name = document.getElementById('event-name').value;
        const date = document.getElementById('event-date').value;
        const institution = document.getElementById('event-institution').value;
        const description = document.getElementById('event-description').value;
        const eventMsg = document.getElementById('eventos-message');
        
        if (!name || !date || !institution) {
            showMessage('eventos-message', '⚠️ Completa todos los campos requeridos', 'error');
            return;
        }
        
        createEvent(name, date, institution, description);
        showMessage('eventos-message', '✓ Evento creado correctamente', 'success');
        
        // Limpiar formulario
        document.getElementById('event-name').value = '';
        document.getElementById('event-date').value = '';
        document.getElementById('event-institution').value = '';
        document.getElementById('event-description').value = '';
        
        loadEventSelectors();
        loadExistingEvents();
        loadDashboard();
    });
    
    // Filter media
    document.getElementById('filter-event').addEventListener('change', (e) => {
        loadMediaList(e.target.value);
    });
    
    // Verificar autenticación al cargar
    if (isAdminAuthenticated()) {
        showAdminPanel();
    } else {
        hideAdminPanel();
    }
});

// Funciones globales para eliminar
function deleteMediaItem(mediaId) {
    if (confirm('¿Eliminar este media?')) {
        deleteMedia(mediaId);
        loadMediaList(document.getElementById('filter-event').value);
        loadDashboard();
    }
}

function deleteEventItem(eventId) {
    const event = getEvents().find(e => e.id === eventId);
    if (confirm(`¿Eliminar el evento "${event.name}" y todos sus medios?`)) {
        deleteEvent(eventId);
        loadEventSelectors();
        loadExistingEvents();
        loadMediaList();
        loadDashboard();
    }
}
