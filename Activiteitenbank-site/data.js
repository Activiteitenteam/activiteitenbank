// Gedeelde data-laag: activiteiten worden bewaard in localStorage,
// zodat wijzigingen uit het admin-dashboard direct op de site zichtbaar zijn.
const AB_OPSLAG_SLEUTEL = 'ab-activiteiten';

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
const AB_EMOJIS = [
  '🎨', '⚽', '🌳', '💻', '🍳', '🎲', '🎭', '🎵',
  '🔬', '✂️', '🧩', '🏃', '🌈', '🐌', '📚', '🎉'
];

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

function laadActiviteiten() {
  try {
    const opgeslagen = localStorage.getItem(AB_OPSLAG_SLEUTEL);
    if (opgeslagen) return JSON.parse(opgeslagen);
  } catch (e) { /* corrupte data -> val terug op standaard */ }
  return STANDAARD_ACTIVITEITEN.map(a => ({ ...a }));
}

function bewaarActiviteiten(lijst) {
  localStorage.setItem(AB_OPSLAG_SLEUTEL, JSON.stringify(lijst));
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
