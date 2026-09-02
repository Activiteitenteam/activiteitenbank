// Nachtmodus-schakelaar in de footer.
// De keuze wordt onthouden in localStorage; het toepassen zelf gebeurt al
// in een klein script in de <head>, anders flitst de lichte versie door.
(() => {
  const wortel = document.documentElement;
  const schakelaar = document.getElementById('thema-schakelaar');
  if (!schakelaar) return;

  const isDonker = () => wortel.dataset.thema === 'donker';

  const werkBij = () => {
    schakelaar.setAttribute('aria-pressed', String(isDonker()));
    schakelaar.querySelector('.thema-label').textContent =
      isDonker() ? 'Dagmodus' : 'Nachtmodus';
  };

  werkBij();

  schakelaar.addEventListener('click', () => {
    if (isDonker()) {
      delete wortel.dataset.thema;
    } else {
      wortel.dataset.thema = 'donker';
    }
    try {
      localStorage.setItem('activiteitenbank-thema', isDonker() ? 'donker' : 'licht');
    } catch (e) {
      // Privémodus of geblokkeerde opslag: de keuze geldt dan alleen deze pagina.
    }
    werkBij();
  });
})();
