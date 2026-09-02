// Workshops op het prikbord.
//
// Eén bron voor zowel het prikbord als de detailpagina, zodat een workshop
// niet op twee plekken bijgewerkt hoeft te worden. Nog niet in de
// activiteiten-backend: dit staat los van de activiteitenlijst.
const AB_WORKSHOPS = [
  {
    titel: 'Djembé voor kids',
    samenvatting: 'Trommelworkshop van 45 minuten, incl. instrumenten.',
    door: 'Sam',
    duur: '45 minuten'
  },
  {
    titel: 'Theater & verkleedpret',
    samenvatting: 'Toneelspelletjes en een mini-voorstelling maken.',
    door: 'Nadia',
    duur: '60 minuten'
  },
  {
    titel: 'Proefjes-lab',
    samenvatting: 'Veilige wetenschapsproefjes met huis-tuin-en-keukenspullen.',
    door: 'Kim',
    duur: '45 minuten'
  }
];

// Bouwt één briefje voor op het prikbord, dat doorlinkt naar de detailpagina
function maakWorkshopBriefje(workshop, nr) {
  const briefje = document.createElement('a');
  briefje.className = 'postit';
  briefje.href = 'workshop.html?nr=' + nr;

  const titel = document.createElement('h3');
  titel.textContent = workshop.titel;

  const tekst = document.createElement('p');
  tekst.textContent = workshop.samenvatting;

  const door = document.createElement('span');
  door.className = 'postit-door';
  door.textContent = 'Aangeboden door ' + workshop.door;

  const meer = document.createElement('span');
  meer.className = 'postit-meer';
  meer.textContent = 'Meer weten →';

  briefje.append(titel, tekst, door, meer);
  return briefje;
}
