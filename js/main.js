/* Hero slider: rotación automática, dots y pausa al hacer hover/touch */
(function(){
    let currentSlide = 0;
    const slides = document.querySelectorAll(".hero-slider .slide");
    const dotsContainer = document.querySelector('.slider-dots');
    const slider = document.querySelector('.hero-slider');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    let intervalId = null;

    function showSlide(index) {
        slides.forEach((s, i) => s.classList.toggle('active', i === index));
        updateDots(index);
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function createDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const btn = document.createElement('button');
            btn.className = 'dot';
            btn.setAttribute('aria-label', `Ir a imagen ${i+1}`);
            btn.dataset.index = i;
            btn.addEventListener('click', () => {
                currentSlide = i;
                showSlide(currentSlide);
                resetInterval();
            });
            dotsContainer.appendChild(btn);
        });
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }

    function updateDots(activeIndex) {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === activeIndex));
    }

    function startInterval() {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(nextSlide, 4000);
    }

    function resetInterval() {
        startInterval();
    }

    if (slider) {
        slider.addEventListener('mouseenter', () => { if (intervalId) clearInterval(intervalId); });
        slider.addEventListener('mouseleave', () => { startInterval(); });
        slider.addEventListener('touchstart', () => { if (intervalId) clearInterval(intervalId); }, {passive:true});
        slider.addEventListener('touchend', () => { startInterval(); }, {passive:true});
    }

    // Prev / Next buttons
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetInterval(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });

    // Ocultar botones si no hay más de una imagen
    if (slides.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }

    // Navegación por teclado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { prevSlide(); resetInterval(); }
        if (e.key === 'ArrowRight') { nextSlide(); resetInterval(); }
    });

    // Inicializar
    createDots();
    showSlide(0);
    startInterval();
})();
