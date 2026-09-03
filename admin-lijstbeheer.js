// Beheer van een eenvoudige lijst (workshops, thema's): tonen, toevoegen,
// bewerken en verwijderen.
//
// Workshops en thema's werken precies hetzelfde, alleen met andere velden,
// dus dit is één functie die met een beschrijving van die velden wordt
// aangeroepen. Opslaan gaat via dezelfde weg als de activiteiten: de lijst
// wordt in data.js gezet en metInstellingen plakt hem er bij het wegschrijven
// weer voor.
function beheerLijstje(cfg) {
  const lijstVak = document.getElementById(cfg.sleutel + '-lijst');
  const form     = document.getElementById(cfg.sleutel + '-form');
  const formKop  = document.getElementById(cfg.sleutel + '-formtitel');
  const opslaan  = document.getElementById(cfg.sleutel + '-opslaan');
  const annuleer = document.getElementById(cfg.sleutel + '-annuleer');
  const invoer   = {};
  cfg.velden.forEach(v => { invoer[v] = document.getElementById(cfg.sleutel + '-' + v); });

  let bewerkt = null;   // null = nieuw item

  function leegForm() {
    bewerkt = null;
    cfg.velden.forEach(v => { invoer[v].value = ''; });
    // Een soort kan eigen velden hebben die niet uit losse tekstvakjes
    // bestaan, zoals een rijtje links of een keuzelijst.
    if (cfg.leegExtra) cfg.leegExtra();
    formKop.textContent = cfg.nieuwKop;
    opslaan.textContent = 'Toevoegen';
    annuleer.hidden = true;
  }

  function bewerk(i) {
    const item = cfg.lees()[i];
    bewerkt = i;
    cfg.velden.forEach(v => {
      const waarde = item[cfg.veldSleutel ? cfg.veldSleutel(v) : v];
      invoer[v].value = waarde == null ? '' : String(waarde);
    });
    if (cfg.vulExtra) cfg.vulExtra(item);
    formKop.textContent = cfg.bewerkKop;
    opslaan.textContent = 'Opslaan';
    annuleer.hidden = false;
    invoer[cfg.velden[0]].focus();
    invoer[cfg.velden[0]].scrollIntoView({ block: 'center' });
  }

  async function bewaar(nieuweLijst, watGingMis) {
    const vorige = cfg.lees();
    cfg.zet(nieuweLijst);
    const token = await huidigToken();
    const gelukt = token && await bewaarActiviteiten(cfg.activiteiten(), token);
    if (!gelukt) {
      // Stand terugdraaien, anders lijkt het gelukt terwijl er niets is bewaard
      cfg.zet(vorige);
      alert(watGingMis + ' is niet gelukt. Probeer het opnieuw of log opnieuw in.');
    }
    teken();
    return gelukt;
  }

  function teken() {
    const items = cfg.lees();
    lijstVak.innerHTML = '';

    if (items.length === 0) {
      const leeg = document.createElement('p');
      leeg.className = 'extra-leeg';
      leeg.textContent = cfg.leegTekst;
      lijstVak.append(leeg);
      return;
    }

    items.forEach((item, i) => {
      const rij = document.createElement('div');
      rij.className = 'extra-rij';

      const info = document.createElement('div');
      const titel = document.createElement('strong');
      titel.textContent = item.titel || '(zonder titel)';
      const bij = document.createElement('span');
      bij.className = 'extra-bijschrift';
      bij.textContent = cfg.bijschrift(item);
      info.append(titel, bij);

      const acties = document.createElement('div');
      acties.className = 'acties';

      const bewerkKnop = document.createElement('button');
      bewerkKnop.type = 'button';
      bewerkKnop.className = 'knop knop-klein';
      bewerkKnop.textContent = 'Bewerken';
      bewerkKnop.addEventListener('click', () => bewerk(i));

      const wegKnop = document.createElement('button');
      wegKnop.type = 'button';
      wegKnop.className = 'knop knop-gevaar knop-klein';
      wegKnop.textContent = 'Verwijderen';
      wegKnop.addEventListener('click', async () => {
        if (!confirm('"' + (item.titel || 'dit item') + '" verwijderen?')) return;
        const kopie = cfg.lees();
        kopie.splice(i, 1);
        if (await bewaar(kopie, 'Verwijderen')) leegForm();
      });

      acties.append(bewerkKnop, wegKnop);
      rij.append(info, acties);
      lijstVak.append(rij);
    });
  }

  annuleer.addEventListener('click', leegForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Het oorspronkelijke item gaat mee, zodat velden die niet in het
    // formulier staan behouden blijven. Zonder dat zou het bewerken van
    // bijvoorbeeld een aanbieder zijn hele workshoplijst wissen.
    const origineel = bewerkt === null ? null : cfg.lees()[bewerkt];
    const item = cfg.bouw(invoer, origineel);
    if (!item) return;

    const kopie = cfg.lees();
    if (bewerkt === null) kopie.push(item); else kopie[bewerkt] = item;

    opslaan.disabled = true;
    try {
      if (await bewaar(kopie, 'Opslaan')) leegForm();
    } finally {
      opslaan.disabled = false;
    }
  });

  leegForm();
  return { teken };
}
