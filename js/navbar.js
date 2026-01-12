const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const cartCountEls = document.querySelectorAll('.cart-count');
const cartBtnEls = document.querySelectorAll('.btn-cart');
const cartSidebar = document.getElementById('cart-sidebar');
const cartSidebarOverlay = document.getElementById('cart-sidebar-overlay');
const closeSidebarBtn = document.querySelector('.close-sidebar');

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    mobileMenu.classList.toggle("open");
});

function getCartFromStorage(){
    try { const raw = localStorage.getItem('gradmemories_cart'); return raw ? JSON.parse(raw) : []; } catch(e){ return []; }
}

function formatCurrency(v){
    const n = Number(v) || 0;
    return '$' + (n === Math.floor(n) ? n.toFixed(0) : n.toFixed(2));
}

function computeCartTotal(cart){
    try{ return cart.reduce((s,it)=> s + (Number(it.price)||0) * (Number(it.qty)||1), 0); }catch(e){ return 0; }
}

function ensureCartTotalEl(){
    cartBtnEls.forEach(btn=>{
        if(!btn.querySelector('.cart-total')){
            const span = document.createElement('span');
            span.className = 'cart-total';
            span.setAttribute('aria-hidden','true');
            span.style.marginLeft = '8px';
            btn.appendChild(span);
        }
    });
}

function toggleSidebar(open){
    if(open === undefined) open = !cartSidebar.classList.contains('open');
    if(open){
        cartSidebar.classList.add('open');
        cartSidebarOverlay.classList.add('open');
        renderSidebarCart();
    } else {
        cartSidebar.classList.remove('open');
        cartSidebarOverlay.classList.remove('open');
    }
}

function renderSidebarCart(){
    const cart = getCartFromStorage();
    const contentEl = document.getElementById('cart-sidebar-content');
    const totalEl = document.getElementById('sidebar-total');
    
    if(cart.length === 0){
        contentEl.innerHTML = '<div class="cart-empty-msg">Tu carrito está vacío</div>';
        totalEl.textContent = '$0';
        return;
    }
    
    let total = 0;
    let html = '';
    cart.forEach((item, idx) => {
        const itemTotal = (Number(item.price)||0) * (Number(item.qty)||1);
        total += itemTotal;
        const thumbnail = item.thumbnail || 'assets/portada/foto1.jpg';
        const title = item.title || item.id;
        const price = item.price || 0;
        const qty = item.qty || 1;
        
        html += `
            <div class="sidebar-item">
                <img src="${thumbnail}" alt="${title}" class="sidebar-item-img">
                <div class="sidebar-item-info">
                    <div class="sidebar-item-title">${title}</div>
                    <div class="sidebar-item-price">${formatCurrency(price)} × ${qty}</div>
                    <div class="sidebar-item-total">${formatCurrency(itemTotal)}</div>
                </div>
            </div>
        `;
    });
    
    contentEl.innerHTML = html;
    totalEl.textContent = formatCurrency(total);
}

function updateCartUI(){
    const cart = getCartFromStorage();
    const count = cart.length || 0;
    const total = computeCartTotal(cart);
    cartCountEls.forEach(el => el.textContent = count);
    ensureCartTotalEl();
    document.querySelectorAll('.cart-total').forEach(el=> el.textContent = formatCurrency(total));
    // Actualizar sidebar si está abierto
    if(cartSidebar && cartSidebar.classList.contains('open')){
        renderSidebarCart();
    }
}

// Event listeners para abrir/cerrar sidebar
if(cartSidebar){
    cartBtnEls.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleSidebar();
        });
    });
    
    if(closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => toggleSidebar(false));
    if(cartSidebarOverlay) cartSidebarOverlay.addEventListener('click', () => toggleSidebar(false));
}

// Inicializar UI y reaccionar a cambios de storage / eventos custom
updateCartUI();
window.addEventListener('storage', (e)=>{
    if(e.key === 'gradmemories_cart') updateCartUI();
});
window.addEventListener('cart-updated', () => updateCartUI());

