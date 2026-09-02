// Zachte fade bij het wisselen van pagina.
// Interne links faden eerst uit, daarna wordt genavigeerd;
// de nieuwe pagina fadet in via de 'pagina-in' animatie in style.css.
document.addEventListener('click', (e) => {
  // Matcht ook links met parameters, zoals activiteit.html?nr=2
  const link = e.target.closest('a[href*=".html"]');
  if (!link || link.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return;
  e.preventDefault();
  document.body.classList.add('pagina-uit');
  setTimeout(() => { window.location.href = link.href; }, 150);
});

// Bij terugnavigeren uit de browsercache weer zichtbaar maken
window.addEventListener('pageshow', (e) => {
  if (e.persisted) document.body.classList.remove('pagina-uit');
});
