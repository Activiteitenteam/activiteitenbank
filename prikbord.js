// Vult het prikbord met de briefjes uit workshops.js
(() => {
  const bord = document.getElementById('prikbord');
  if (!bord) return;
  AB_WORKSHOPS.forEach((w, nr) => bord.append(maakWorkshopBriefje(w, nr)));
})();
