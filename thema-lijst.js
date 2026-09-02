// Vult het overzicht met de thema's uit de opslag.
// Tijdens het ophalen staan er lege kaartjes; zie prikbord.js voor waarom
// dat ophalen even kan duren.
(async () => {
  const lijst = document.getElementById('thema-lijst');
  if (!lijst) return;

  lijst.setAttribute('aria-busy', 'true');
  for (let i = 0; i < 3; i++) {
    const leeg = document.createElement('div');
    leeg.className = 'skelet';
    leeg.setAttribute('aria-hidden', 'true');
    leeg.innerHTML =
      '<span class="skelet-regel skelet-titel"></span>' +
      '<span class="skelet-regel"></span>' +
      '<span class="skelet-regel kort"></span>' +
      '<span class="skelet-labels"><span></span><span></span></span>';
    lijst.append(leeg);
  }

  await laadActiviteiten();

  lijst.innerHTML = '';
  lijst.removeAttribute('aria-busy');
  themasLijst().forEach((t, nr) => lijst.append(maakThemaKaart(t, nr)));
})();
