// Gedeelde data-laag: activiteiten worden opgehaald bij en opgeslagen via
// de backend op Render, die op zijn beurt de activiteiten.json in GitHub
// bijwerkt. Zo ziet iedere bezoeker dezelfde, actuele lijst.
const AB_BACKEND_URL = 'https://activiteitenbank-backend.onrender.com';

// Waar de activiteiten staan. De backend commit elke adminwijziging naar dit
// pad, dus de commitgeschiedenis ervan is meteen het logboek van wijzigingen.
const AB_REPO = 'Activiteitenteam/activiteitenbank';
const AB_ACTIVITEITEN_PAD = 'Activiteitenbank-site/activiteiten.json';

// Vaste labels waaruit in het admin-dashboard gekozen wordt
const AB_PRESET_LABELS = [
  'Creatief',
  'Sport',
  'Natuur',
  'Digitale media',
  '0-4 jaar',
  '4-7 jaar',
  '7-12 jaar',
  'Koken'
];

// Emoji's waaruit in de editor gekozen kan worden (komt voor de titel te staan)
// Emoji's waaruit in de editor gekozen kan worden, gegroepeerd zodat je in
// het adminscherm per soort kunt filteren. 'Algemeen' is de oorspronkelijke
// lijst; die staat vooraan omdat bestaande activiteiten daaruit gekozen zijn.
const AB_EMOJI_GROEPEN = {
  Algemeen: ['🎨', '⚽', '🌳', '💻', '🍳', '🎲', '🎭', '🎵',
             '🔬', '✂️', '🧩', '🏃', '🌈', '🐌', '📚', '🎉'],
  Natuur:   ['🌻', '🍃', '🐞', '🦋', '🌷', '🐝',
             '🌲', '🍄', '🐛', '🌱', '🦔', '🐦'],
  Eten:     ['🍎', '🥕', '🍞', '🧁', '🍪', '🥞',
             '🍓', '🥪', '🍇', '🧀', '🍕', '🥗'],
  Sport:    ['🏀', '🤸', '🚴', '⛹️', '🥅', '🏐',
             '🤾', '🛼', '🏓', '🥏', '🤺', '🏸'],
  Muziek:   ['🥁', '🎸', '🎤', '🎺', '🎻', '🎹',
             '🪗', '🪘', '🎧', '📻', '🔔', '🎶'],
  Kunst:    ['🖌️', '🖍️', '🎪', '🧶', '🪡', '🖼️',
             '🧵', '✏️', '📐', '🏺', '🎈', '🪄']
};

// Alle emoji's achter elkaar. Hierop wordt gecontroleerd of een gekozen of
// aangeleverde emoji bestaat, dus de groepen blijven de enige bron.
const AB_EMOJIS = Object.values(AB_EMOJI_GROEPEN).flat();

// Wordt alleen gebruikt als de backend even niet bereikbaar is
// (bijvoorbeeld tijdens het opstarten na een periode van inactiviteit).
const STANDAARD_ACTIVITEITEN = [
  {
    emoji: '🐌',
    titel: 'Slakken zoeken in de tuin',
    beschrijving: 'Natuuractiviteit voor buiten, met zoekkaart.',
    labels: ['Natuur', '4-7 jaar'],
    aangeleverdDoor: 'Sam'
  },
  {
    emoji: '🎨',
    titel: 'Zoutdeeg figuren',
    beschrijving: 'Kneden, vormen en bakken met eenvoudig recept.',
    labels: ['Creatief', '4-7 jaar'],
    aangeleverdDoor: 'Nadia'
  },
  {
    emoji: '🎲',
    titel: 'Levend memory',
    beschrijving: 'Actief groepsspel voor binnen of buiten.',
    labels: ['Sport', '7-12 jaar'],
    aangeleverdDoor: 'Kim'
  }
];

// Opmaak-tags in beschrijvingen:
//   *tekst*  -> vetgedrukt (alineakopje)
//   **tekst** -> cursief
// HTML wordt eerst geescapet zodat er niets onveiligs in de pagina komt.
function formatteerBeschrijving(tekst) {
  const veilig = String(tekst)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return veilig
    .replace(/\*\*(.+?)\*\*/g, '<em>$1</em>')
    .replace(/\*(.+?)\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

// Labels van een activiteit; begrijpt ook het oude 'label'-tekstveld
function labelsVan(activiteit) {
  if (Array.isArray(activiteit.labels)) return activiteit.labels;
  if (activiteit.label) return String(activiteit.label).split(' · ');
  return [];
}

// ── Onderhoudsmodus ──
// De stand wordt als instellingsregel in dezelfde lijst bewaard, omdat de
// backend uitsluitend een array accepteert. Zo'n regel is geen activiteit
// en mag dus nooit op de site verschijnen.
const AB_INSTELLING_ONDERHOUD = 'onderhoud';
const AB_INSTELLING_WORKSHOPS = 'workshops';
const AB_INSTELLING_THEMAS    = 'themas';

let AB_ONDERHOUD = false;

// Workshops en thema's worden op dezelfde manier bewaard: als instellingsregel
// met een items-lijst erin. Staat er nog niets in de opslag, dan gelden deze
// standaardlijsten, zodat de site niet leeg is voordat er iets is ingevuld.
const AB_STANDAARD_WORKSHOPS = [
  { titel: 'Djembé voor kids',
    samenvatting: 'Trommelworkshop van 45 minuten, incl. instrumenten.',
    door: 'Sam', duur: '45 minuten' },
  { titel: 'Theater & verkleedpret',
    samenvatting: 'Toneelspelletjes en een mini-voorstelling maken.',
    door: 'Nadia', duur: '60 minuten' },
  { titel: 'Proefjes-lab',
    samenvatting: 'Veilige wetenschapsproefjes met huis-tuin-en-keukenspullen.',
    door: 'Kim', duur: '45 minuten' }
];

const AB_STANDAARD_THEMAS = [
  { titel: 'Zomer & water',
    samenvatting: 'Waterspellen, proefjes en knutsels voor warme dagen.', aantal: 12 },
  { titel: 'De natuur in',
    samenvatting: 'Avontuurlijke buitenactiviteiten rond bos en tuin.', aantal: 9 },
  { titel: 'Kunst & kleur',
    samenvatting: 'Schilderen, bouwen en ontwerpen als echte kunstenaars.', aantal: 10 }
];

let AB_WORKSHOPS_OPSLAG = null;   // null = nog niets opgehaald
let AB_THEMAS_OPSLAG    = null;

function isInstelling(item) {
  return Boolean(item) && typeof item._instelling === 'string';
}

// Haalt de instellingsregels uit de opgehaalde lijst, onthoudt de stand en
// geeft alleen de echte activiteiten terug.
function scheidInstellingen(rauw) {
  if (!Array.isArray(rauw)) return [];

  const regel = naam => rauw.find(i => isInstelling(i) && i._instelling === naam);

  const vlag = regel(AB_INSTELLING_ONDERHOUD);
  AB_ONDERHOUD = Boolean(vlag && vlag.aan);

  const workshops = regel(AB_INSTELLING_WORKSHOPS);
  AB_WORKSHOPS_OPSLAG = workshops && Array.isArray(workshops.items) ? workshops.items : null;

  const themas = regel(AB_INSTELLING_THEMAS);
  AB_THEMAS_OPSLAG = themas && Array.isArray(themas.items) ? themas.items : null;

  return rauw.filter(i => !isInstelling(i));
}

// De opgeslagen lijst, of de standaardlijst zolang er nog niets is opgeslagen
function workshopsLijst() {
  return AB_WORKSHOPS_OPSLAG || AB_STANDAARD_WORKSHOPS.map(w => ({ ...w }));
}
function themasLijst() {
  return AB_THEMAS_OPSLAG || AB_STANDAARD_THEMAS.map(t => ({ ...t }));
}
function zetWorkshops(items) { AB_WORKSHOPS_OPSLAG = items.map(w => ({ ...w })); }
function zetThemas(items)    { AB_THEMAS_OPSLAG    = items.map(t => ({ ...t })); }

// Staat de onderhoudsmodus aan volgens de laatst opgehaalde lijst?
function onderhoudAan() {
  return AB_ONDERHOUD;
}

// Zet de onderhoudsmodus aan of uit en bewaart de lijst opnieuw.
// Lukt het opslaan niet, dan draait de stand terug.
async function zetOnderhoud(aan, lijst, token) {
  const vorige = AB_ONDERHOUD;
  AB_ONDERHOUD = Boolean(aan);
  const gelukt = await bewaarActiviteiten(lijst, token);
  if (!gelukt) AB_ONDERHOUD = vorige;
  return gelukt;
}

// Haalt de actuele activiteiten op bij de backend. Let op: dit is nu een
// async functie (geeft een Promise terug), dus gebruik 'await laadActiviteiten()'.
async function laadActiviteiten() {
  try {
    const respons = await fetch(AB_BACKEND_URL + '/api/activiteiten');
    if (!respons.ok) throw new Error('Backend gaf een foutstatus terug');
    return scheidInstellingen(await respons.json());
  } catch (e) {
    console.warn('Kon activiteiten niet ophalen bij de backend, val terug op standaardlijst.', e);
    return STANDAARD_ACTIVITEITEN.map(a => ({ ...a }));
  }
}

// Plakt de instellingsregels weer voor de lijst. Zonder dit zou een gewone
// bewerking in het adminscherm de onderhoudsmodus ongemerkt uitzetten.
function metInstellingen(lijst) {
  const schoon = lijst.filter(i => !isInstelling(i));
  const regels = [];

  if (AB_ONDERHOUD) {
    regels.push({ _instelling: AB_INSTELLING_ONDERHOUD, aan: true });
  }
  if (AB_WORKSHOPS_OPSLAG) {
    regels.push({ _instelling: AB_INSTELLING_WORKSHOPS, items: AB_WORKSHOPS_OPSLAG });
  }
  if (AB_THEMAS_OPSLAG) {
    regels.push({ _instelling: AB_INSTELLING_THEMAS, items: AB_THEMAS_OPSLAG });
  }

  return [...regels, ...schoon];
}

// Slaat de volledige lijst op via de backend. Vereist een geldig Supabase
// sessie-token (token) van een ingelogde admin. Geeft true/false terug.
async function bewaarActiviteiten(lijst, token) {
  try {
    const respons = await fetch(AB_BACKEND_URL + '/api/activiteiten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ activiteiten: metInstellingen(lijst) })
    });
    return respons.ok;
  } catch (e) {
    console.error('Opslaan naar de backend is mislukt.', e);
    return false;
  }
}

// Korte samenvatting voor op de thumbnails: alineakopjes (*Kopje*) worden
// overgeslagen zodat alleen de lopende tekst (algemene informatie) overblijft.
function samenvattingVan(activiteit) {
  return String(activiteit.beschrijving)
    .split('\n')
    .filter(regel => !/^\s*\*[^*]+\*\s*$/.test(regel))
    .join(' ')
    .replace(/\*/g, '')
    .trim();
}

// Bouwt een klikbaar activiteiten-thumbnail dat naar de detailpagina linkt
function maakActiviteitKaart(activiteit, index) {
  const kaart = document.createElement('a');
  kaart.className = 'item';
  kaart.href = 'activiteit.html?nr=' + index;

  const titel = document.createElement('h3');
  titel.textContent = (activiteit.emoji ? activiteit.emoji + ' ' : '') + activiteit.titel;

  const beschrijving = document.createElement('p');
  beschrijving.className = 'samenvatting';
  beschrijving.textContent = samenvattingVan(activiteit);

  kaart.append(titel, beschrijving);

  if (activiteit.aangeleverdDoor) {
    const door = document.createElement('p');
    door.className = 'door';
    door.textContent = 'Aangeleverd door ' + activiteit.aangeleverdDoor;
    kaart.append(door);
  }

  labelsVan(activiteit).forEach(naam => {
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = naam;
    kaart.append(label);
  });

  const leesmeer = document.createElement('span');
  leesmeer.className = 'leesmeer';
  leesmeer.textContent = 'Lees meer →';
  kaart.append(leesmeer);
  return kaart;
}
