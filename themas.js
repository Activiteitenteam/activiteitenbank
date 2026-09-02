// Thema's op de themapagina's.
//
// Eén bron voor zowel het overzicht als de themapagina zelf. De uitgewerkte
// inhoud per thema moet nog gemaakt worden; tot die tijd toont de
// themapagina alleen de omschrijving en een melding dat de rest volgt.
const AB_THEMAS = [
  {
    titel: 'Zomer & water',
    samenvatting: 'Waterspellen, proefjes en knutsels voor warme dagen.',
    aantal: 12
  },
  {
    titel: 'De natuur in',
    samenvatting: 'Avontuurlijke buitenactiviteiten rond bos en tuin.',
    aantal: 9
  },
  {
    titel: 'Kunst & kleur',
    samenvatting: 'Schilderen, bouwen en ontwerpen als echte kunstenaars.',
    aantal: 10
  }
];

// Bouwt één klikbaar themakaartje voor op het overzicht
function maakThemaKaart(thema, nr) {
  const kaart = document.createElement('a');
  kaart.className = 'item';
  kaart.href = 'thema-pagina.html?nr=' + nr;

  const titel = document.createElement('h3');
  titel.textContent = thema.titel;

  const tekst = document.createElement('p');
  tekst.textContent = thema.samenvatting;

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = 'Thema · ' + thema.aantal + ' activiteiten';

  const meer = document.createElement('span');
  meer.className = 'leesmeer';
  meer.textContent = 'Bekijk thema →';

  kaart.append(titel, tekst, label, meer);
  return kaart;
}
