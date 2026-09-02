// Filterbalk op de pagina met losse activiteiten.
//
// Meerdere labels tegelijk aanzetten werkt verfijnend: een activiteit moet
// álle gekozen labels hebben. Zo klik je van "Creatief" naar "Creatief +
// 4-7 jaar" en houd je steeds minder, maar preciezere resultaten over.
(async () => {
  const lijst      = document.getElementById('activiteiten-lijst');
  const balk       = document.getElementById('filterbalk');
  const labelVak   = document.getElementById('filter-labels');
  const telling    = document.getElementById('filter-telling');
  const wisKnop    = document.getElementById('filter-wissen');
  const geenGevond = document.getElementById('geen-resultaat');
  if (!lijst) return;

  // Lege kaartjes in de vorm van de echte, zolang de backend nog antwoordt.
  // Dat kan even duren: de server op Render valt bij weinig verkeer in slaap
  // en heeft dan tijd nodig om op te starten.
  function toonSkelet(aantal) {
    lijst.setAttribute('aria-busy', 'true');
    for (let i = 0; i < aantal; i++) {
      const kaart = document.createElement('div');
      kaart.className = 'skelet';
      kaart.setAttribute('aria-hidden', 'true');
      kaart.innerHTML =
        '<span class="skelet-regel skelet-titel"></span>' +
        '<span class="skelet-regel"></span>' +
        '<span class="skelet-regel kort"></span>' +
        '<span class="skelet-labels"><span></span><span></span></span>';
      lijst.append(kaart);
    }
  }

  toonSkelet(3);
  const activiteiten = await laadActiviteiten();
  lijst.innerHTML = '';

  // Het volgnummer van de activiteit in de volledige lijst moet bewaard
  // blijven: de detailpagina wordt aangeroepen als activiteit.html?nr=...
  const alles = activiteiten.map((activiteit, nr) => ({
    activiteit,
    nr,
    labels: labelsVan(activiteit)
  }));

  const gekozen = new Set();

  // Alle labels die in de lijst voorkomen, op alfabet
  const alleLabels = [...new Set(alles.flatMap(i => i.labels))].sort(
    (a, b) => a.localeCompare(b, 'nl')
  );

  if (alleLabels.length === 0) {
    tekenLijst(alles);
    return;
  }

  const past = item => [...gekozen].every(l => item.labels.includes(l));

  function tekenLijst(items) {
    lijst.innerHTML = '';
    lijst.removeAttribute('aria-busy');
    items.forEach(i => lijst.append(maakActiviteitKaart(i.activiteit, i.nr)));
  }

  function werkBij() {
    const zichtbaar = alles.filter(past);
    tekenLijst(zichtbaar);

    geenGevond.hidden = zichtbaar.length > 0;
    wisKnop.hidden = gekozen.size === 0;

    telling.textContent = gekozen.size === 0
      ? `${alles.length} activiteiten`
      : `${zichtbaar.length} van ${alles.length} activiteiten`;

    // Labels die in combinatie met de huidige keuze niets zouden opleveren,
    // worden uitgeschakeld: dan klik je nooit een leeg scherm aan.
    labelVak.querySelectorAll('.filter-label').forEach(knop => {
      const naam = knop.dataset.label;
      const aan = gekozen.has(naam);
      knop.setAttribute('aria-pressed', String(aan));
      knop.disabled = !aan && !zichtbaar.some(i => i.labels.includes(naam));
    });
  }

  alleLabels.forEach(naam => {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'filter-label';
    knop.dataset.label = naam;
    knop.textContent = naam;
    knop.setAttribute('aria-pressed', 'false');
    knop.addEventListener('click', () => {
      if (gekozen.has(naam)) gekozen.delete(naam); else gekozen.add(naam);
      werkBij();
    });
    labelVak.append(knop);
  });

  wisKnop.addEventListener('click', () => {
    gekozen.clear();
    werkBij();
  });

  balk.hidden = false;
  werkBij();
})();
