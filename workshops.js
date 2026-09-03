// Bouwt de briefjes voor het prikbord. De workshops zelf komen uit data.js:
// die leest ze uit de opgeslagen lijst, of valt terug op de standaardlijst.
function maakWorkshopBriefje(workshop, nr) {
  const briefje = document.createElement('a');
  briefje.className = 'postit';
  briefje.href = 'workshop.html?nr=' + nr;

  const titel = document.createElement('h3');
  titel.textContent = workshop.titel;

  const tekst = document.createElement('p');
  tekst.textContent = workshop.samenvatting || '';

  const door = document.createElement('span');
  door.className = 'postit-door';
  // Bij een aanbieder is het aantal workshops nuttiger dan alleen de naam
  const aantal = Array.isArray(workshop.aanbod) ? workshop.aanbod.length : 0;
  door.textContent = aantal
    ? workshop.door + ' · ' + aantal + ' workshops'
    : (workshop.door ? 'Aangeboden door ' + workshop.door : '');

  const meer = document.createElement('span');
  meer.className = 'postit-meer';
  meer.textContent = 'Meer weten →';

  briefje.append(titel, tekst, door, meer);
  return briefje;
}
