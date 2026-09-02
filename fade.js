// Zachte overgang bij het wisselen van pagina's.
// Interne links laten de pagina eerst wegzakken, daarna wordt genavigeerd;
// de nieuwe pagina komt op via de 'pagina-in' animatie in style.css.
(() => {
  // Noodrem: als transitionend om wat voor reden niet afgaat, gaan we
  // alsnog. Iets ruimer dan de .2s transition in de stylesheet.
  const NOODREM = 320;

  document.addEventListener('click', (e) => {
    // Matcht ook links met parameters, zoals activiteit.html?nr=2
    const link = e.target.closest('a[href*=".html"]');
    if (!link) return;

    // Nieuwe tabs, downloads en klikken met een toets erbij met rust laten,
    // net als rechts- en middenklik.
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    // Alleen onze eigen pagina's, en niet de pagina waar we al zijn.
    if (link.origin !== window.location.origin) return;
    if (link.href === window.location.href) return;

    e.preventDefault();

    let onderweg = false;
    const ga = () => {
      if (onderweg) return;
      onderweg = true;
      window.location.href = link.href;
    };

    // Navigeren zodra de uitgaande animatie klaar is, in plaats van na een
    // vaste tijd: zo sluit het naadloos aan, ook op tragere apparaten.
    document.body.addEventListener('transitionend', ga, { once: true });
    setTimeout(ga, NOODREM);

    document.body.classList.add('pagina-uit');
  });

  // Bij terugnavigeren uit de browsercache weer zichtbaar maken
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) document.body.classList.remove('pagina-uit');
  });
})();
