// Bouwt de themakaartjes voor het overzicht. De thema's zelf komen uit
// data.js: die leest ze uit de opgeslagen lijst, of valt terug op de
// standaardlijst.
function maakThemaKaart(thema, nr) {
  const kaart = document.createElement('a');
  kaart.className = 'item';
  kaart.href = 'thema-pagina.html?nr=' + nr;

  const titel = document.createElement('h3');
  titel.textContent = thema.titel;

  const tekst = document.createElement('p');
  tekst.textContent = thema.samenvatting || '';

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = thema.aantal
    ? 'Thema · ' + thema.aantal + ' activiteiten'
    : 'Thema';

  const meer = document.createElement('span');
  meer.className = 'leesmeer';
  meer.textContent = 'Bekijk thema →';

  kaart.append(titel, tekst, label, meer);
  return kaart;
}
