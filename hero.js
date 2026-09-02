// Wisselende bannerfoto's in de hero.
// Draait op elke pagina die .hero-slide-elementen heeft; staat er maar
// één slide (of geen), dan doet dit bestand niets.
(() => {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length < 2) return;

  // Wie beweging heeft uitgezet krijgt alleen de eerste foto te zien.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const OVERGANG = 1500;  // gelijk aan de duur van slide-op in style.css
  let huidige = 0;

  setInterval(() => {
    const vorige = slides[huidige];
    huidige = (huidige + 1) % slides.length;
    const nieuwe = slides[huidige];

    // De oude foto blijft ondoorzichtig liggen terwijl de nieuwe erover
    // heen fadet, zodat de sectiekleur er nooit doorheen schijnt.
    vorige.classList.add('vorig');
    vorige.classList.remove('actief');
    nieuwe.classList.add('actief', 'komt-op');

    setTimeout(() => {
      vorige.classList.remove('vorig');
      nieuwe.classList.remove('komt-op');
    }, OVERGANG);
  }, 5000);
})();
