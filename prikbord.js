// Vult het prikbord met de workshops uit de opslag.
// Tijdens het ophalen hangen er lege briefjes, want de backend op Render
// valt bij weinig verkeer in slaap en heeft dan tijd nodig om op te starten.
(async () => {
  const bord = document.getElementById('prikbord');
  if (!bord) return;

  bord.setAttribute('aria-busy', 'true');
  for (let i = 0; i < 3; i++) {
    const leeg = document.createElement('div');
    leeg.className = 'postit postit-skelet';
    leeg.setAttribute('aria-hidden', 'true');
    leeg.innerHTML =
      '<span class="skelet-regel skelet-titel"></span>' +
      '<span class="skelet-regel"></span>' +
      '<span class="skelet-regel kort"></span>';
    bord.append(leeg);
  }

  await laadActiviteiten();

  bord.innerHTML = '';
  bord.removeAttribute('aria-busy');
  workshopsLijst().forEach((w, nr) => bord.append(maakWorkshopBriefje(w, nr)));
})();
