// Vult het overzicht met de themakaartjes uit themas.js
(() => {
  const lijst = document.getElementById('thema-lijst');
  if (!lijst) return;
  AB_THEMAS.forEach((t, nr) => lijst.append(maakThemaKaart(t, nr)));
})();
