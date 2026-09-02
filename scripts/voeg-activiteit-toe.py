#!/usr/bin/env python3
"""Voegt een activiteit toe aan de Activiteitenbank vanuit het vaste tekstformat.

Gebruik:
    python scripts/voeg-activiteit-toe.py activiteit.txt
    cat activiteit.txt | python scripts/voeg-activiteit-toe.py

Inloggegevens komen uit omgevingsvariabelen, zodat er geen wachtwoord in een
bestand of in je opdrachtregelgeschiedenis belandt:

    AB_EMAIL       je admin-e-mailadres
    AB_WACHTWOORD  je wachtwoord

Met --droogloop wordt alleen gecontroleerd en getoond wat er zou gebeuren;
er wordt dan niets opgeslagen en is ook geen login nodig.

Let op: er is geen database. De activiteiten staan als JSON-lijst in de
GitHub-repo en worden weggeschreven door de backend op Render, die daarbij
de Supabase-login controleert.
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent

VELDEN = [
    "Titel", "Inleiding", "Kern", "Slot",
    "Aangeleverd door", "Voorgestelde emoji",
    "Voorgestelde categorie", "Voorgestelde leeftijd",
]


class Fout(Exception):
    """Iets klopt niet; de melding is bedoeld om aan de gebruiker te tonen."""


# ── Instellingen uit de site zelf lezen, zodat er een bron blijft ──────────

def _lees(bestand):
    pad = PROJECT / bestand
    if not pad.exists():
        raise Fout(bestand + " niet gevonden naast dit script (gezocht in " + str(PROJECT) + ").")
    return pad.read_text(encoding="utf-8")


def _lijst_uit_js(bron, naam, bestand):
    treffer = re.search(r"const\s+" + naam + r"\s*=\s*\[(.*?)\]", bron, re.S)
    if not treffer:
        raise Fout(naam + " niet gevonden in " + bestand + ".")
    return re.findall(r"'([^']*)'", treffer.group(1))


def _waarde_uit_js(bron, naam, bestand):
    treffer = re.search(r"const\s+" + naam + r"\s*=\s*'([^']*)'", bron)
    if not treffer:
        raise Fout(naam + " niet gevonden in " + bestand + ".")
    return treffer.group(1)


def _emojis_uit_js(bron):
    """De emoji's staan gegroepeerd in AB_EMOJI_GROEPEN; AB_EMOJIS wordt
    daaruit berekend en staat dus niet meer als lijst in het bestand."""
    treffer = re.search(r"const\s+AB_EMOJI_GROEPEN\s*=\s*\{(.*?)\n\};", bron, re.S)
    if not treffer:
        raise Fout("AB_EMOJI_GROEPEN niet gevonden in data.js.")
    return re.findall(r"'([^']*)'", treffer.group(1))


def instellingen():
    data_js = _lees("data.js")
    auth = _lees("admin-auth.js")
    labels = _lijst_uit_js(data_js, "AB_PRESET_LABELS", "data.js")
    return {
        "backend": _waarde_uit_js(data_js, "AB_BACKEND_URL", "data.js"),
        "supabase_url": _waarde_uit_js(auth, "SUPABASE_URL", "admin-auth.js"),
        "supabase_key": _waarde_uit_js(auth, "SUPABASE_PUBLISHABLE_KEY", "admin-auth.js"),
        "emojis": _emojis_uit_js(data_js),
        # Leeftijdslabels zijn de labels met een cijfer erin; de rest is categorie.
        "categorieen": [l for l in labels if not re.search(r"\d", l)],
        "leeftijden": [l for l in labels if re.search(r"\d", l)],
    }


# ── Het vaste format lezen ────────────────────────────────────────────────

def _kaal(waarde):
    return re.sub(r"\s+", " ", str(waarde)).strip().lower()


def _zonder_jaar(waarde):
    return waarde[:-5] if waarde.endswith(" jaar") else waarde


def _zoek_optie(waarde, opties):
    gezocht = _kaal(waarde)
    for optie in opties:
        if _kaal(optie) == gezocht:
            return optie
    # "4-7" mag ook als de optie "4-7 jaar" heet
    for optie in opties:
        if _zonder_jaar(_kaal(optie)) == _zonder_jaar(gezocht):
            return optie
    return None


def parseer(tekst, cfg):
    """Geeft (activiteit, fouten) terug. Bij fouten is activiteit None."""
    fouten = []
    merken = list(re.finditer(r"\*\*\s*([^*:]+?)\s*:\s*\*\*", tekst))

    velden = {}
    for i, m in enumerate(merken):
        tot = merken[i + 1].start() if i + 1 < len(merken) else len(tekst)
        velden[m.group(1).strip().lower()] = tekst[m.end():tot].strip()

    ontbreekt = [v for v in VELDEN if v.lower() not in velden]
    if ontbreekt:
        fouten.append("Deze labels ontbreken of zijn anders geschreven: "
                      + ", ".join("**" + v + ":**" for v in ontbreekt))

    def haal(veld):
        return velden.get(veld.lower(), "").strip()

    titel = haal("Titel")
    if "Titel" not in ontbreekt and not titel:
        fouten.append("Titel is leeg.")

    emoji = ""
    if "Voorgestelde emoji" not in ontbreekt:
        rauw = haal("Voorgestelde emoji")
        if not rauw:
            fouten.append("Voorgestelde emoji is leeg.")
        elif rauw in cfg["emojis"]:
            emoji = rauw
        else:
            fouten.append('Emoji "' + rauw + '" staat niet in de keuzelijst. '
                          "Kies er een uit: " + " ".join(cfg["emojis"]))

    labels = []
    for veld, opties, soort in (
        ("Voorgestelde categorie", cfg["categorieen"], "categorie"),
        ("Voorgestelde leeftijd", cfg["leeftijden"], "leeftijd"),
    ):
        if veld in ontbreekt:
            continue
        waarden = [w.strip() for w in re.split(r"[,;]", haal(veld)) if w.strip()]
        if not waarden:
            fouten.append(veld + " is leeg.")
            continue
        for w in waarden:
            optie = _zoek_optie(w, opties)
            if optie is None:
                fouten.append('"' + w + '" is geen bestaande ' + soort
                              + ". Beschikbaar: " + ", ".join(opties))
            elif optie not in labels:
                labels.append(optie)

    # Inleiding, kern en slot gaan samen in de beschrijving; *Kopje* is de
    # opmaak die de site al kent voor alineakopjes.
    delen = []
    for kop in ("Inleiding", "Kern", "Slot"):
        if kop in ontbreekt:
            continue
        inhoud = haal(kop)
        if not inhoud:
            fouten.append(kop + " is leeg.")
        else:
            delen.append("*" + kop + "*\n" + inhoud)

    if fouten:
        return None, fouten

    return {
        "emoji": emoji,
        "titel": titel,
        "beschrijving": "\n\n".join(delen),
        "aangeleverdDoor": haal("Aangeleverd door"),
        "labels": labels,
    }, []


# ── Praten met Supabase en de backend ─────────────────────────────────────

def _verzoek(url, data=None, headers=None, methode=None, tijd=120):
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, method=methode)
    req.add_header("Content-Type", "application/json")
    for sleutel, waarde in (headers or {}).items():
        req.add_header(sleutel, waarde)
    try:
        with urllib.request.urlopen(req, timeout=tijd) as antwoord:
            rauw = antwoord.read().decode("utf-8")
            return json.loads(rauw) if rauw else None
    except urllib.error.HTTPError as e:
        melding = e.read().decode("utf-8", "replace")[:300]
        raise Fout(url + " gaf status " + str(e.code) + ": " + melding) from None
    except urllib.error.URLError as e:
        raise Fout(url + " is niet bereikbaar: " + str(e.reason)) from None


def token_ophalen(cfg):
    email = os.environ.get("AB_EMAIL")
    wachtwoord = os.environ.get("AB_WACHTWOORD")
    if not email or not wachtwoord:
        raise Fout("Zet eerst AB_EMAIL en AB_WACHTWOORD als omgevingsvariabele; "
                   "het script vraagt er bewust niet zelf om.")
    antwoord = _verzoek(
        cfg["supabase_url"] + "/auth/v1/token?grant_type=password",
        data={"email": email, "password": wachtwoord},
        headers={"apikey": cfg["supabase_key"]},
    )
    token = (antwoord or {}).get("access_token")
    if not token:
        raise Fout("Inloggen bij Supabase leverde geen token op.")
    return token


def lijst_ophalen(cfg):
    # De backend slaapt op het gratis plan in, dus de eerste aanroep mag traag zijn.
    lijst = _verzoek(cfg["backend"] + "/api/activiteiten")
    if not isinstance(lijst, list):
        raise Fout("De backend gaf geen lijst terug.")
    return lijst


def lijst_opslaan(cfg, lijst, token):
    _verzoek(cfg["backend"] + "/api/activiteiten",
             data={"activiteiten": lijst},
             headers={"Authorization": "Bearer " + token},
             methode="POST")


# ── Hoofdprogramma ────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(
        description="Voegt een activiteit toe aan de Activiteitenbank vanuit het vaste tekstformat.")
    p.add_argument("bestand", nargs="?",
                   help="tekstbestand met de activiteit; laat weg om van stdin te lezen")
    p.add_argument("--droogloop", action="store_true",
                   help="alleen controleren en tonen, niets opslaan")
    args = p.parse_args()

    try:
        cfg = instellingen()

        if args.bestand:
            tekst = Path(args.bestand).read_text(encoding="utf-8")
        else:
            tekst = sys.stdin.read()
        if not tekst.strip():
            raise Fout("Er is geen tekst aangeleverd.")

        activiteit, fouten = parseer(tekst, cfg)
        if fouten:
            print("De tekst is niet verwerkt. Er is niets opgeslagen.\n", file=sys.stderr)
            for f in fouten:
                print("  - " + f, file=sys.stderr)
            return 1

        regels = activiteit["beschrijving"].count("\n") + 1
        print("Gelezen activiteit:")
        print("  Titel  : " + activiteit["emoji"] + " " + activiteit["titel"])
        print("  Door   : " + activiteit["aangeleverdDoor"])
        print("  Labels : " + ", ".join(activiteit["labels"]))
        print("  Tekst  : " + str(len(activiteit["beschrijving"])) + " tekens, "
              + str(regels) + " regels")

        if args.droogloop:
            print("\nDroogloop: er is niets opgeslagen.")
            return 0

        token = token_ophalen(cfg)
        lijst = lijst_ophalen(cfg)

        titels = [a.get("titel") for a in lijst if isinstance(a, dict)]
        if activiteit["titel"] in titels:
            raise Fout('Er bestaat al een activiteit met de titel "' + activiteit["titel"]
                       + '". Hernoem hem, of pas de bestaande aan in het adminscherm.')

        lijst.append(activiteit)
        lijst_opslaan(cfg, lijst, token)

        echt = [a for a in lijst if isinstance(a, dict) and "_instelling" not in a]
        print("\nToegevoegd. De lijst bevat nu " + str(len(echt)) + " activiteiten.")
        return 0

    except Fout as e:
        print("Fout: " + str(e), file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
