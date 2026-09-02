// Wisselende bannerfoto's in de hero.
//
// De lijst staat hier één keer, in plaats van in elke pagina apart: een foto
// toevoegen of weghalen doe je alleen hieronder. De slides worden opgebouwd
// in elke .hero die een .hero-overlay bevat.
const AB_BANNERS = [
  'Assets/Banner/ben-wicks-iDCtsz-INHI-unsplash.jpg',
  'Assets/Banner/ashton-bingham-SAHBl2UpXco-unsplash.jpg',
  'Assets/Banner/compagnons-OV44gxH71DU-unsplash.jpg',
  'Assets/Banner/casey-horner-4rDCa5hBlCs-unsplash.jpg',
  'Assets/Banner/katie-smith-uQs1802D0CQ-unsplash.jpg',
  'Assets/Banner/dariusz-sankowski-mj2NwYH3wBA-unsplash.jpg'
];

(() => {
  const OVERGANG = 1500;  // gelijk aan de duur van slide-op in style.css
  const WISSEL   = 30000;  // elke 30 seconden een andere foto

  const heros = [...document.querySelectorAll('.hero')]
    .filter(hero => hero.querySelector('.hero-overlay'));

  if (heros.length === 0 || AB_BANNERS.length === 0) return;

  const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  heros.forEach(hero => {
    const overlay = hero.querySelector('.hero-overlay');

    const slides = AB_BANNERS.map(() => {
      const slide = document.createElement('div');
      slide.className = 'hero-slide';
      hero.insertBefore(slide, overlay);
      return slide;
    });

    // Elke paginaweergave begint bij een willekeurige foto. Anders zie je bij
    // het doorklikken steeds dezelfde eerste banner, omdat de teller bij
    // iedere nieuwe pagina weer op nul begint.
    let huidige = Math.floor(Math.random() * slides.length);
    slides[huidige].classList.add('actief');

    // Een foto wordt pas opgehaald vlak voor hij aan de beurt is. Zonder dit
    // haalt elke bezoeker alle banners tegelijk binnen, ook die hij nooit
    // te zien krijgt omdat hij eerder doorklikt.
    const laad = i => {
      const slide = slides[i];
      if (slide.dataset.geladen) return;
      slide.dataset.geladen = 'ja';
      slide.style.backgroundImage = "url('" + AB_BANNERS[i] + "')";
    };

    laad(huidige);

    // Eén foto en klaar, of beweging staat uit: niet gaan wisselen.
    if (slides.length < 2 || rustig) return;

    laad((huidige + 1) % slides.length);

    setInterval(() => {
      const vorige = slides[huidige];
      huidige = (huidige + 1) % slides.length;
      const nieuwe = slides[huidige];

      // Alvast de foto ná deze klaarzetten, zodat hij op tijd binnen is
      laad((huidige + 1) % slides.length);

      // De oude foto blijft ondoorzichtig liggen terwijl de nieuwe erover
      // heen fadet, zodat de sectiekleur er nooit doorheen schijnt.
      vorige.classList.add('vorig');
      vorige.classList.remove('actief');
      nieuwe.classList.add('actief', 'komt-op');

      setTimeout(() => {
        vorige.classList.remove('vorig');
        nieuwe.classList.remove('komt-op');
      }, OVERGANG);
    }, WISSEL);
  });
})();
