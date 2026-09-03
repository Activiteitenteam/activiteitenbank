// Gedeelde data-laag: activiteiten worden opgehaald bij en opgeslagen via
// de backend op Render, die op zijn beurt de activiteiten.json in GitHub
// bijwerkt. Zo ziet iedere bezoeker dezelfde, actuele lijst.
const AB_BACKEND_URL = 'https://activiteitenbank-backend.onrender.com';

// Waar de activiteiten staan. De backend commit elke adminwijziging naar dit
// pad, dus de commitgeschiedenis ervan is meteen het logboek van wijzigingen.
const AB_REPO = 'Activiteitenteam/activiteitenbank';
const AB_ACTIVITEITEN_PAD = 'Activiteitenbank-site/activiteiten.json';

// Vaste labels waaruit in het admin-dashboard gekozen wordt. De leeftijden
// worden herkend aan het cijfer erin en staan daarom apart onderaan; de rest
// geldt als categorie.
const AB_PRESET_LABELS = [
  'Creativiteit',
  'Sport & bewegen',
  'Natuur',
  'Digitale media',
  'Koken',
  'Techniek',
  'Coderen en programmeren',
  'Milieu en duurzaamheid',
  'Lifestyle',
  'Muziek',
  'Drama',
  'Dans',
  'Cultuur en acceptatie',
  '0-4 jaar',
  '4-7 jaar',
  '7-12 jaar'
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

// Labels die zijn samengevoegd. Bestaande activiteiten dragen de oude naam
// nog; die wordt bij het inlezen omgezet, zodat de site meteen de nieuwe naam
// toont. Bij de eerstvolgende opslag staat het ook echt zo in het bestand,
// waarna deze tabel leeg kan.
const AB_LABEL_SAMENVOEGING = {
  'Creatief': 'Creativiteit',
  'Sport': 'Sport & bewegen'
};

// Zet oude labelnamen om en haalt dubbelingen eruit: een activiteit met
// zowel het oude als het nieuwe label houdt er één over.
function hernoemLabels(activiteit) {
  if (!Array.isArray(activiteit.labels)) return activiteit;
  const nieuw = [];
  activiteit.labels.forEach(naam => {
    const om = AB_LABEL_SAMENVOEGING[naam] || naam;
    if (!nieuw.includes(om)) nieuw.push(om);
  });
  activiteit.labels = nieuw;
  return activiteit;
}

// Elke activiteit krijgt een vast nummer, dat bij het inlezen wordt toegekend
// als het er nog niet is en bij de eerstvolgende opslag wordt vastgelegd.
// Zonder zo'n nummer werkt alles op de plek in de lijst, en dan wijst een
// eerder gedeelde link naar een andere activiteit zodra er eentje tussenuit
// gaat. Ook de koppeling met thema's zou dan losraken.
// Het nummer wordt berekend uit de titel (FNV-1a). Dat moet, want tot de
// eerstvolgende opslag staat het nog nergens vast: met een willekeurig nummer
// zou elke bezoeker een ander nummer berekenen en zou een gedeelde link bij
// een collega niets vinden. Zodra het is opgeslagen ligt het vast en mag de
// titel veranderen.
function idUitTitel(titel) {
  let h = 0x811c9dc5;
  const tekst = String(titel || '');
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'a' + h.toString(16).padStart(8, '0');
}

function nieuwActiviteitId(titel, bezet) {
  const basis = idUitTitel(titel);
  let id = basis;
  let tel = 1;
  // Twee activiteiten met dezelfde titel zouden hetzelfde nummer krijgen
  while (bezet && bezet.has(id)) id = basis + '-' + (++tel);
  if (bezet) bezet.add(id);
  return id;
}

// Wordt alleen gebruikt als de backend even niet bereikbaar is
// (bijvoorbeeld tijdens het opstarten na een periode van inactiviteit).
const STANDAARD_ACTIVITEITEN = [
  {
    emoji: "🌈",
    titel: "Dromenvangers maken",
    beschrijving: "*Inleiding*\nVertel de kinderen over dromenvangers en hun oorsprong. Leg uit dat dromenvangers worden gebruikt om goede dromen te vangen en nare dromen weg te houden. Toon enkele voorbeelden om de kinderen te inspireren en vertel dat ze hun eigen dromenvanger gaan maken en die kunnen versieren zoals ze zelf willen.\n\nJe kunt de volgende verrijkingsvragen stellen: wat voor dromen denk je dat jouw dromenvanger zal vangen, kun je bedenken waar de traditie van dromenvangers vandaan komt, en welke kleuren gebruik je voor jouw dromenvanger en waarom.\n\n*Kern*\nGeef elk kind een metalen ring, cinildraad, kralen en veren. Laat de kinderen beginnen door het cinildraad om de metalen ring te draaien; dit vormt de basis van de dromenvanger en geeft een mooie, kleurrijke rand.\n\nLaat de kinderen daarna een stuk dunne draad kiezen en aan het begin een dikke knoop maken zodat de draad niet uit de ring glijdt. Laat ze de draad door en om de ring rijgen, met zoveel of zo weinig kralen als ze willen, en moedig ze aan om in het midden van de ring patronen te maken zodat de draden elkaar kruisen en een mooi web vormen.\n\nLaat de kinderen zodra het web klaar is veren vastmaken aan de onderkant van de dromenvanger voor een speels en traditioneel effect. Knoop tot slot het einde van de draad vast om alles op zijn plaats te houden.\n\nBenodigd: metalen ringen, cinildraad, scharen, draad, kralen, veren en kleurpotloden of stiften. Duur: 45 tot 60 minuten.\n\n*Slot*\nLaat de kinderen hun zelfgemaakte dromenvangers bewonderen en eventueel aan elkaar presenteren. Bespreek kort wat ze hebben geleerd over dromenvangers en waarom mensen ze denken te maken. De kinderen kunnen hun dromenvanger mee naar huis nemen en boven hun bed hangen om mooie dromen te vangen.",
    aangeleverdDoor: "Tessa",
    labels: ["Creativiteit", "4-7 jaar", "7-12 jaar"]
  },
  {
    emoji: "🎭",
    titel: "Het Evolutiespel",
    beschrijving: "*Inleiding*\nVertel de kinderen dat jullie het evolutiespel gaan spelen. Iedereen begint als kleine mier en wordt steeds sterker door van andere mieren te winnen. Leg uit dat het de bedoeling is om een dier te zoeken dat hetzelfde is als jijzelf, die aan te tikken en dan steen-papier-schaar te spelen. Win je, dan evolueer je naar het volgende dier. Verlies je, dan word je juist het vorige dier weer.\n\nLeg de dieren en bewegingen uit: de mier loopt heel snel en maakt veel bewegingen, de kikker springt over het veld, de aap loopt met de armen onder de oksels en roept oeh aah, de olifant loopt met een slurf, en de leeuw loopt op vier poten. Vertel dat als je een leeuw bent en je wint steen-papier-schaar van een andere leeuw, je het spel wint en bij de spelbegeleider mag gaan staan.\n\n*Kern*\nStart het spel en laat de kinderen vrij rondlopen in de open ruimte, terwijl ze de bewegingen van hun dier uitvoeren. Moedig ze aan om andere dieren van dezelfde soort te vinden en ze aan te tikken. Wanneer twee spelers van dezelfde diersoort elkaar vinden, spelen ze steen-papier-schaar om te bepalen wie evolueert en wie hetzelfde blijft. Laat de winnaar evolueren naar het volgende dier in de reeks en de bijbehorende beweging uitvoeren.\n\nBenodigd: een school-, white- of digibord en een open ruimte, bijvoorbeeld een lokaal of speelzaal. Duur: 20 tot 30 minuten.\n\n*Slot*\nBespreek met de kinderen hoe het spel is gegaan. Vraag wie er is geëvolueerd tot leeuw en hoe dat voelde, en wat ze leuk vonden aan de verschillende dierenbewegingen.",
    aangeleverdDoor: "Joris",
    labels: ["Drama", "7-12 jaar"]
  },
  {
    emoji: "🌈",
    titel: "Verven met ijs",
    beschrijving: "*Inleiding*\nLaat de kinderen de ijsklontjes zien en geef ze de tijd om het gek of spannend te vinden. Laat zien dat je door met een ijsklontje over papier te strijken ook kunt verven.\n\n*Kern*\nLaat de kinderen op hun eigen stuk papier verven met de gekleurde ijsklontjes. Een leuke en simpele opdracht is het maken van een regenboog. Gebruik eventueel ijsstokjes voor kinderen die het niet prettig vinden om rechtstreeks met een ijsklontje te verven, en houd er rekening mee dat het smeltende ijs voor een kliederboel kan zorgen.\n\nBereid van tevoren plakkaatverf gemengd met water in en vries dit in als ijsklontjes, in verschillende kleuren.\n\nBenodigd: plakkaatverf, een vriezer en papier, elk formaat is goed. Duur: ongeveer 30 minuten.\n\n*Slot*\nLaat de kinderen hun verfwerk bekijken en laten drogen. Bespreek kort welke kleuren ze hebben gebruikt en wat ze bijzonder vonden aan het verven met ijs in plaats van een kwast.",
    aangeleverdDoor: "Freddie",
    labels: ["Creativiteit", "0-4 jaar"]
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
// Een briefje kan ook een externe aanbieder zijn. Dan staat er een 'aanbod'
// bij: de losse workshops die zij geven, die je op de detailpagina op een rij
// ziet. Prijzen alleen invullen als de aanbieder ze zelf noemt.
const AB_STANDAARD_WORKSHOPS = [
  { titel: 'Djembé voor kids',
    samenvatting: 'Trommelworkshop van 45 minuten, incl. instrumenten.',
    door: 'Sam', duur: '45 minuten' },
  { titel: 'Theater & verkleedpret',
    samenvatting: 'Toneelspelletjes en een mini-voorstelling maken.',
    door: 'Nadia', duur: '60 minuten' },
  { titel: 'Proefjes-lab',
    samenvatting: 'Veilige wetenschapsproefjes met huis-tuin-en-keukenspullen.',
    door: 'Kim', duur: '45 minuten' },

  { titel: 'Clinic Factory',
    samenvatting: 'Externe aanbieder van sportworkshops voor KDV, peuteropvang en BSO.',
    door: 'Clinic Factory',
    duur: 'In overleg',
    website: 'https://www.clinicfactory.nl/sportworkshops-kinderopvang/',
    email: 'info@clinicfactory.nl',
    telefoon: '+31 (0)6 307 279 69',
    // Clinic Factory noemt op hun site geen tarieven; die vraag je per
    // offerte op. Hier dus bewust geen bedragen invullen.
    prijs: 'Op aanvraag, via een offerte',
    aanbod: [
      { naam: 'Judo: vallen en opvangen', tekst: 'Spelenderwijs bewegen en ontdekken.', leeftijd: '2-4 jaar' },
      { naam: 'StrongMini',               tekst: 'Grove motoriek, coördinatie en balans.', leeftijd: '2-4 jaar' },
      { naam: 'Strongman',                tekst: 'Stoere en energieke beweging.', leeftijd: '4-12 jaar' },
      { naam: 'Fitboksen',                tekst: 'Uitdagende activiteiten.', leeftijd: '4-12 jaar' },
      { naam: 'Fitness',                  tekst: 'Uitdagende activiteiten.', leeftijd: '4-12 jaar' },
      { naam: 'Rugby',                    tekst: 'Uitdagende activiteiten.', leeftijd: '4-12 jaar' },
      { naam: 'Basketbal',                tekst: '', leeftijd: '' },
      { naam: 'Voetbal',                  tekst: '', leeftijd: '' },
      { naam: 'Streethockey',             tekst: '', leeftijd: '' }
    ]
  }
];

const AB_STANDAARD_THEMAS = [
  { titel: 'Zomer & water',
    samenvatting: 'Waterspellen, proefjes en knutsels voor warme dagen.' },
  { titel: 'De natuur in',
    samenvatting: 'Avontuurlijke buitenactiviteiten rond bos en tuin.' },
  { titel: 'Kunst & kleur',
    samenvatting: 'Schilderen, bouwen en ontwerpen als echte kunstenaars.' }
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

  const lijst = normaliseerActiviteiten(rauw.filter(i => !isInstelling(i)));

  // Thema's koppelden eerder op titel. Die verwijzingen worden hier omgezet
  // naar het vaste nummer, zodat hernoemen de koppeling niet meer breekt.
  if (AB_THEMAS_OPSLAG) {
    AB_THEMAS_OPSLAG.forEach(thema => {
      if (!Array.isArray(thema.activiteiten)) return;
      thema.activiteiten = thema.activiteiten.map(verwijzing => {
        if (lijst.some(a => a.id === verwijzing)) return verwijzing;
        const opTitel = lijst.find(a => a.titel === verwijzing);
        return opTitel ? opTitel.id : verwijzing;
      });
    });
  }

  return lijst;
}

// Zet labels om naar hun huidige naam en zorgt dat elke activiteit een
// nummer heeft. Ook de terugvallijst gaat hier langs: zonder dat zouden
// links stuk zijn zodra de backend even niet antwoordt.
function normaliseerActiviteiten(lijst) {
  const schoon = lijst.map(hernoemLabels);
  const bezet = new Set(schoon.map(a => a.id).filter(Boolean));
  schoon.forEach(a => { if (!a.id) a.id = nieuwActiviteitId(a.titel, bezet); });
  return schoon;
}

// Zoekt een activiteit op haar vaste nummer
function activiteitMetId(lijst, id) {
  return lijst.find(a => a.id === id) || null;
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

// Hoeveel activiteiten hangen er aan een thema: de generieke links plus de
// losse activiteiten die eraan gekoppeld zijn. Afgeleid en niet ingevuld,
// zodat het getal niet uit de pas kan lopen met de inhoud.
function themaAantal(thema) {
  const generiek = Array.isArray(thema.generiek)
    ? thema.generiek.length
    : (thema.generiek && thema.generiek.url ? 1 : 0);
  const los = Array.isArray(thema.activiteiten) ? thema.activiteiten.length : 0;
  return generiek + los;
}

// Vastgezette activiteiten staan altijd bovenaan, in het adminscherm en op de
// pagina met losse activiteiten. Meer dan drie zou de lijst geen kop meer geven
// maar hem gewoon herschikken, dus daar ligt de grens.
const AB_MAX_VASTGEZET = 3;

function isVastgezet(activiteit) {
  return Boolean(activiteit && activiteit.vastgezet);
}

function aantalVastgezet(lijst) {
  return lijst.filter(isVastgezet).length;
}

// Zet de vastgezette vooraan en laat de rest staan zoals hij stond
function vastgezetEerst(lijst) {
  return [...lijst.filter(isVastgezet), ...lijst.filter(a => !isVastgezet(a))];
}

// Alles waar een zoekbalk op mag matchen: titel, beschrijving, wie hem
// aanleverde en de labels. Op één plek, zodat het adminscherm en de
// themakiezer niet uit elkaar lopen.
function zoekbareTekstVan(activiteit) {
  return [activiteit.titel, activiteit.beschrijving, activiteit.aangeleverdDoor,
          ...labelsVan(activiteit)]
    .filter(Boolean).join(' ').toLowerCase();
}

// Haalt de actuele activiteiten op bij de backend. Let op: dit is nu een
// async functie (geeft een Promise terug), dus gebruik 'await laadActiviteiten()'.
// Het bestand staat ook gewoon op GitHub Pages. Voor bezoekers is dat de
// snelste weg: de backend op Render slaapt op het gratis plan in en heeft dan
// tientallen seconden nodig om op te starten, terwijl Pages meteen antwoordt.
// De teller schuift elke 30 seconden op, zodat de CDN niet een oude kopie
// blijft uitserveren maar bezoekers binnen datzelfde halve minuutje wel
// dezelfde gecachete versie krijgen.
function statischeUrl() {
  return AB_ACTIVITEITEN_PAD + '?v=' + Math.floor(Date.now() / 30000);
}

async function haalStatisch() {
  const respons = await fetch(statischeUrl(), { cache: 'no-store' });
  if (!respons.ok) throw new Error('Bestand gaf status ' + respons.status);
  return await respons.json();
}

async function haalViaBackend() {
  const respons = await fetch(AB_BACKEND_URL + '/api/activiteiten');
  if (!respons.ok) throw new Error('Backend gaf een foutstatus terug');
  return await respons.json();
}

// Voor bezoekers: eerst het statische bestand, en pas de backend als dat
// mislukt (bijvoorbeeld doordat het pad ooit verhuist).
async function laadActiviteiten() {
  try {
    return scheidInstellingen(await haalStatisch());
  } catch (eersteFout) {
    console.warn('Statisch bestand niet gelukt, probeer de backend.', eersteFout);
    try {
      return scheidInstellingen(await haalViaBackend());
    } catch (e) {
      console.warn('Kon activiteiten nergens ophalen, val terug op standaardlijst.', e);
      return normaliseerActiviteiten(STANDAARD_ACTIVITEITEN.map(a => ({ ...a })));
    }
  }
}

// Voor het adminscherm: daar moet je na het opslaan meteen je eigen wijziging
// terugzien, en het statische bestand loopt een minuut achter omdat Pages
// eerst opnieuw moet publiceren.
async function laadActiviteitenVers() {
  try {
    return scheidInstellingen(await haalViaBackend());
  } catch (eersteFout) {
    console.warn('Backend niet bereikbaar, val terug op het statische bestand.', eersteFout);
    try {
      return scheidInstellingen(await haalStatisch());
    } catch (e) {
      console.warn('Kon activiteiten nergens ophalen, val terug op standaardlijst.', e);
      return normaliseerActiviteiten(STANDAARD_ACTIVITEITEN.map(a => ({ ...a })));
    }
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
  // Op nummer, zodat de link blijft kloppen als de lijst verandert. Alleen
  // als een activiteit nog geen nummer heeft valt hij terug op de plek.
  kaart.href = activiteit.id
    ? 'activiteit.html?id=' + encodeURIComponent(activiteit.id)
    : 'activiteit.html?nr=' + index;

  if (isVastgezet(activiteit)) {
    kaart.classList.add('vastgezet');
    const merk = document.createElement('span');
    merk.className = 'vastgezet-merk';
    merk.textContent = '📌 Uitgelicht';
    kaart.append(merk);
  }

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
