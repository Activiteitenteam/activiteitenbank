// Gedeelde inlogcontrole voor alle adminpagina's.
//
// Supabase doet in dit project uitsluitend de login; de activiteiten zelf
// staan in activiteiten.json en gaan via de backend. Dit bestand bevat alleen
// het stuk dat elke adminpagina nodig heeft, zodat de logica op één plek staat
// en de losse pagina's hem niet elk apart hoeven te herhalen.

const SUPABASE_URL = 'https://pebsqdefxtakjhjxcshb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_92G3G-qQ4GRW10BGo6SPrg_6ajOnS9d';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Haalt het huidige sessie-token op, nodig bij elke opslagactie.
async function huidigToken() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session ? session.access_token : null;
}

async function isIngelogd() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return Boolean(session);
}

// Voor de beheerpagina's: zonder sessie hoor je hier niet te zijn.
// Geeft true terug als je verder mag; anders stuurt hij door naar het
// inlogscherm en geeft false.
async function vereisLogin() {
  if (await isIngelogd()) return true;
  window.location.replace('admin.html');
  return false;
}

// Koppelt elke uitlogknop op de pagina, en gaat terug naar het inlogscherm.
function koppelUitloggen() {
  document.querySelectorAll('.uitloggen-knop, #uitloggen').forEach(knop => {
    knop.addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
      window.location.href = 'admin.html';
    });
  });
}
