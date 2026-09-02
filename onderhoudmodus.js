// Stuurt bezoekers door naar de onderhoudspagina zolang die aan staat.
//
// Het vlaggetje wordt rechtstreeks bij GitHub Pages opgehaald en niet bij de
// backend: die slaapt op het gratis plan in en heeft dan een koude start van
// tientallen seconden, wat élke paginaweergave zou ophouden.
//
// Gaat er iets mis (bestand weg, geen netwerk, kapotte JSON), dan gebeurt er
// niets en zie je de gewone site. Een storing mag nooit de hele site achter
// een onderhoudsscherm zetten.
(async () => {
  const VLAG_BESTAND = 'Activiteitenbank-site/activiteiten.json';

  try {
    const respons = await fetch(VLAG_BESTAND, { cache: 'no-store' });
    if (!respons.ok) return;

    const lijst = await respons.json();
    if (!Array.isArray(lijst)) return;

    const vlag = lijst.find(i => i && i._instelling === 'onderhoud');
    if (!vlag || !vlag.aan) return;

    // replace() in plaats van href: zo kun je niet met de terugknop
    // alsnog op de afgesloten pagina belanden.
    window.location.replace('onderhoud.html');
  } catch (e) {
    console.warn('Onderhoudsstand niet op te halen; site wordt gewoon getoond.', e);
  }
})();
