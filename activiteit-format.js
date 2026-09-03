// Leest het vaste tekstformat waarin activiteiten worden aangeleverd:
//
//   **Titel:** ...
//   **Inleiding:** ...
//   **Kern:** ...
//   **Slot:** ...
//   **Aangeleverd door:** ...
//   **Voorgestelde emoji:** ...
//   **Voorgestelde categorie:** ...
//   **Voorgestelde leeftijd:** ...
//
// Waarden mogen over meerdere regels lopen; een veld eindigt bij het volgende
// **Label:**. Er wordt niets opgeslagen als er ook maar iets niet klopt: dan
// komt er een lijst met wat er mis is, zodat je het in de tekst kunt herstellen
// in plaats van een half ingevulde activiteit in de lijst te krijgen.

const AB_FORMAT_VELDEN = [
  'Titel', 'Inleiding', 'Kern', 'Slot',
  'Aangeleverd door', 'Voorgestelde emoji',
  'Voorgestelde categorie', 'Voorgestelde leeftijd'
];

// Leeftijdslabels zijn de labels met een cijfer erin; de rest is categorie.
function abLeeftijdLabels() {
  return AB_PRESET_LABELS.filter(l => /\d/.test(l));
}
function abCategorieLabels() {
  return AB_PRESET_LABELS.filter(l => !/\d/.test(l));
}

// Zoekt bij een vrij ingevoerde waarde de officiële optie. Hoofdletters doen
// er niet toe, en "4-7" mag ook als de optie "4-7 jaar" heet.
function abZoekOptie(waarde, opties) {
  const kaal = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
  const gezocht = kaal(waarde);
  return opties.find(o => kaal(o) === gezocht)
      || opties.find(o => kaal(o).replace(/ jaar$/, '') === gezocht.replace(/ jaar$/, ''))
      || null;
}

// De keuzelijst is een suggestie, geen slot: bij het plakken mag elke emoji.
// Deze controle weert alleen invoer die duidelijk geen emoji is, zoals een
// woord of een zin, zodat er geen tekst in het emoji-veld belandt.
function abLijktOpEmoji(waarde) {
  const kaal = String(waarde).trim();
  if (!kaal || [...kaal].length > 8) return false;
  try {
    return /^[\p{Extended_Pictographic}\p{Emoji_Component}\u200d\uFE0F]+$/u.test(kaal);
  } catch (e) {
    // Oudere browser zonder Unicode-eigenschappen: dan weren we alleen letters
    return !/[A-Za-z0-9]/.test(kaal);
  }
}

function abSplitsOpKomma(waarde) {
  return String(waarde).split(/[,;]/).map(s => s.trim()).filter(Boolean);
}

// Geeft { gelukt, activiteit, fouten } terug. fouten is altijd een array.
function parseerActiviteitTekst(tekst) {
  const fouten = [];
  const velden = {};

  // Alle **Label:** posities zoeken, daarna de tekst ertussen toekennen
  const merk = /\*\*\s*([^*:]+?)\s*:\s*\*\*/g;
  const gevonden = [];
  let m;
  while ((m = merk.exec(String(tekst))) !== null) {
    gevonden.push({ label: m[1].trim(), start: m.index, eind: merk.lastIndex });
  }

  gevonden.forEach((g, i) => {
    const tot = i + 1 < gevonden.length ? gevonden[i + 1].start : tekst.length;
    velden[g.label.toLowerCase()] = String(tekst).slice(g.eind, tot).trim();
  });

  const ontbreekt = AB_FORMAT_VELDEN.filter(v => !(v.toLowerCase() in velden));
  if (ontbreekt.length) {
    fouten.push('Deze labels ontbreken of zijn anders geschreven: '
      + ontbreekt.map(v => '**' + v + ':**').join(', '));
  }

  const haal = v => (velden[v.toLowerCase()] || '').trim();

  const titel = haal('Titel');
  if (!ontbreekt.includes('Titel') && !titel) fouten.push('Titel is leeg.');

  // ── Emoji ──
  const emojiTekst = haal('Voorgestelde emoji');
  let emoji = '';
  if (!ontbreekt.includes('Voorgestelde emoji')) {
    if (!emojiTekst) {
      fouten.push('Voorgestelde emoji is leeg.');
    } else if (AB_EMOJIS.includes(emojiTekst) || abLijktOpEmoji(emojiTekst)) {
      emoji = emojiTekst;
    } else {
      fouten.push('"' + emojiTekst + '" ziet er niet uit als een emoji. '
        + 'Zet er één emoji neer; die hoeft niet uit de keuzelijst te komen.');
    }
  }

  // ── Categorie en leeftijd, allebei naar labels ──
  const labels = [];
  [['Voorgestelde categorie', abCategorieLabels()],
   ['Voorgestelde leeftijd',  abLeeftijdLabels()]].forEach(([veld, opties]) => {
    if (ontbreekt.includes(veld)) return;
    const waarden = abSplitsOpKomma(haal(veld));
    if (!waarden.length) {
      fouten.push(veld + ' is leeg.');
      return;
    }
    waarden.forEach(w => {
      const optie = abZoekOptie(w, opties);
      if (optie) {
        if (!labels.includes(optie)) labels.push(optie);
      } else {
        fouten.push('"' + w + '" is geen bestaande ' + veld.replace('Voorgestelde ', '')
          + '. Beschikbaar: ' + opties.join(', '));
      }
    });
  });

  // ── Inleiding, kern en slot samen in de beschrijving ──
  const delen = [];
  ['Inleiding', 'Kern', 'Slot'].forEach(kop => {
    if (ontbreekt.includes(kop)) return;
    const inhoud = haal(kop);
    if (!inhoud) {
      fouten.push(kop + ' is leeg.');
      return;
    }
    // *Kopje* is de opmaak die de site al kent voor alineakopjes
    delen.push('*' + kop + '*\n' + inhoud);
  });

  if (fouten.length) return { gelukt: false, fouten, activiteit: null };

  return {
    gelukt: true,
    fouten: [],
    activiteit: {
      emoji,
      titel,
      beschrijving: delen.join('\n\n'),
      aangeleverdDoor: haal('Aangeleverd door'),
      labels
    }
  };
}

// Stelt de prompt samen waarmee je een activiteit door een AI in dit format
// laat zetten. De lijsten komen uit data.js, zodat de prompt vanzelf klopt
// als er een emoji of label bij komt.
function bouwAiPrompt() {
  const groepen = Object.entries(AB_EMOJI_GROEPEN)
    .map(([naam, lijst]) => '  ' + naam + ': ' + lijst.join(' '))
    .join('\n');

  return [
    'Je zet een activiteit om naar het vaste invoerformat van de Activiteitenbank.',
    '',
    'Geef ALLEEN het onderstaande blok terug. Geen inleiding, geen uitleg, geen',
    'codehekjes eromheen.',
    '',
    '**Titel:** <korte titel, zonder emoji>',
    '**Inleiding:** <hoe je de activiteit bij de kinderen introduceert>',
    '**Kern:** <hoe de activiteit verloopt, stap voor stap>',
    '**Slot:** <hoe je afsluit>',
    '**Aangeleverd door:** <voornaam>',
    '**Voorgestelde emoji:** <precies één emoji uit de lijst hieronder>',
    "**Voorgestelde categorie:** <één of meer, gescheiden door komma's>",
    "**Voorgestelde leeftijd:** <één of meer, gescheiden door komma's>",
    '',
    'Regels:',
    '- Alle acht labels moeten aanwezig zijn, exact zo geschreven, inclusief de',
    '  sterretjes en de dubbele punt.',
    '- Geen enkel veld mag leeg blijven.',
    '- Inleiding, Kern en Slot mogen over meerdere regels lopen.',
    '',
    'Emoji — precies één. Kies er bij voorkeur een uit deze lijst, want die',
    'staan ook in het keuzemenu; een andere emoji mag ook:',
    groepen,
    '',
    'Categorie — uitsluitend deze waarden:',
    '  ' + abCategorieLabels().join(', '),
    '',
    'Leeftijd — uitsluitend deze waarden:',
    '  ' + abLeeftijdLabels().join(', '),
    '',
    'Twijfel je over categorie of leeftijd, kies dan de dichtstbijzijnde waarde',
    'uit de lijst. Verzin er nooit een nieuwe bij.',
    '',
    'Let op bij het schrijven van de teksten:',
    '- Gebruik nergens het patroon **woord:** in de lopende tekst. Dat wordt',
    '  gelezen als een nieuw label en knipt je tekst doormidden.',
    '- Sterretjes hebben betekenis op de site: *tekst* wordt vetgedrukt en',
    '  **tekst** wordt cursief. Gebruik ze alleen als je dat bedoelt.',
    '- Schrijf in het Nederlands, in de je-vorm, gericht op de pedagogisch',
    '  medewerker die de activiteit gaat uitvoeren.',
    '',
    'De activiteit:',
    '<plak hier je activiteit, aantekeningen of ruwe beschrijving>'
  ].join('\n');
}
