let filterEnabled = false;
let filterMode = "strict";

chrome.storage.local.get({ enabled: false, filterMode: "strict" }, (data) => {
  filterEnabled = data.enabled;
  filterMode = data.filterMode;
  if (filterEnabled) applyFilter();
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "setEnabled") {
    filterEnabled = msg.enabled;
    if (filterEnabled) {
      applyFilter();
    } else {
      showAll();
    }
  }
  if (msg.action === "setMode") {
    filterMode = msg.mode;
    if (filterEnabled) applyFilter();
  }
});

// ============================================================
// GERMAN VOCABULARY (STRICT MODE)
// ============================================================
// Unambiguous German words only. English-identical spellings removed.

const GERMAN_WORDS = new Set([
  // Articles
  "der", "das", "den", "dem", "des",
  "eine", "einen", "einem", "einer", "eines",
  "kein", "keine", "keinen", "keinem", "keiner", "keines",

  // Pronouns
  "ich", "du", "er", "sie", "es", "wir", "ihr",
  "mich", "dich", "ihn", "uns", "euch",
  "mir", "dir", "ihm", "ihnen",
  "mein", "meine", "meinen", "meinem", "meiner", "meines",
  "dein", "deine", "deinen", "deinem", "deiner", "deines",
  "seine", "seinen", "seinem", "seiner", "seines",
  "unser", "unsere", "unseren", "unserem", "unserer", "unseres",
  "euer", "eure", "euren", "eurem", "eurer", "eures",
  "sich",

  // Prepositions
  "auf", "aus", "mit", "nach", "seit", "von", "zu",
  "zum", "zur", "über", "unter", "vor", "für", "gegen",
  "ohne", "um", "durch", "entlang", "zwischen", "hinter",
  "neben", "im", "ins", "aufs", "beim", "vom", "durchs",
  "fürs", "ums", "während", "wegen", "trotz", "statt",
  "außer", "innerhalb", "außerhalb", "oberhalb", "unterhalb",
  "diesseits", "jenseits",

  // Conjunctions
  "und", "oder", "aber", "denn", "sondern", "weil", "dass",
  "wenn", "obwohl", "damit", "sodass", "sobald", "solange",
  "bevor", "nachdem", "seitdem", "falls", "sofern",
  "entweder", "weder", "sowohl",

  // Question words
  "wen", "wem", "wessen", "wo", "wann", "warum", "wieso",
  "weshalb", "welcher", "welche", "welches", "welchen",
  "welchem", "wohin", "woher",

  // Verbs
  "sein", "bist", "ist", "sind", "seid", "waren",
  "habe", "hast", "haben", "hatte", "hatten",
  "werden", "werde", "wirst", "wird", "wurde", "wurden",
  "können", "kann", "kannst", "konnte", "konnten",
  "müssen", "muss", "musst", "musste", "mussten",
  "dürfen", "darf", "darfst", "durfte", "durften",
  "sollen", "soll", "sollst", "sollte", "sollten",
  "wollen", "willst", "wollte", "wollten",
  "mögen", "mag", "magst", "mögen", "mochte", "mochten",
  "machen", "mache", "machst", "macht", "machte", "machten",
  "gehen", "gehe", "gehst", "geht", "ging", "gingen",
  "kommen", "komme", "kommst", "kommt", "kamen",
  "sehen", "sehe", "siehst", "sieht", "sah", "sahen",
  "sagen", "sage", "sagst", "sagt", "sagte", "sagten",
  "geben", "gebe", "gibst", "gibt", "gab", "gaben",
  "nehmen", "nehme", "nimmst", "nimmt", "nahm", "nahmen",
  "finden", "finde", "findest", "findet", "fand", "fanden",
  "denken", "denke", "denkst", "denkt", "dachte", "dachten",
  "wissen", "weiß", "weißt", "wusste", "wussten",
  "verstehen", "verstehe", "verstehst", "versteht",
  "lernen", "lerne", "lernst", "lernt", "lernte",
  "sprechen", "spreche", "sprichst", "spricht", "sprach",
  "hören", "höre", "hörst", "hört", "hörte",
  "lesen", "lese", "liest", "las", "lasen",
  "schreiben", "schreibe", "schreibst", "schreibt",
  "arbeiten", "arbeite", "arbeitest", "arbeitet",
  "spielen", "spiele", "spielst", "spielt", "spielte",
  "bleiben", "bleibe", "bleibst", "bleibt", "blieb",
  "stehen", "stehe", "stehst", "steht", "stand",
  "liegen", "liege", "liegst", "liegt", "lag",
  "fahren", "fahre", "fährst", "fährt", "fuhr",
  "fliegen", "fliege", "fliegst", "fliegt", "flog",
  "essen", "esse", "isst", "aß", "aßen",
  "trinken", "trinke", "trinkst", "trinkt", "trank",
  "kaufen", "kaufe", "kaufst", "kauft", "kaufte",
  "verkaufen", "verkaufe", "verkaufst", "verkauft",
  "helfen", "helfe", "hilfst", "hilft",
  "brauchen", "brauche", "brauchst", "braucht",
  "beginnen", "beginne", "beginnst", "beginnt", "begann",

  // Numbers
  "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben",
  "acht", "neun", "zehn", "elf", "zwölf", "zwanzig", "dreißig",
  "hundert", "tausend", "million", "milliarde",

  // Adverbs & particles
  "nicht", "nein", "ja", "doch", "schon", "noch", "auch",
  "nur", "sehr", "mehr", "weniger", "viel", "wenig",
  "hier", "da", "dort", "dann", "jetzt", "heute", "morgen",
  "gestern", "immer", "nie", "niemals", "oft", "manchmal",
  "wieder", "gern", "gerne", "zusammen", "allein",
  "vielleicht", "natürlich", "eigentlich", "wirklich",
  "etwa", "ungefähr", "genau", "sofort", "gleich", "später",
  "früher", "unten", "vorne", "rechts", "innen", "außen",

  // Common nouns
  "mann", "frau", "kinder", "leute", "mensch", "menschen",
  "tag", "tage", "nacht", "woche", "monat", "jahr", "jahre",
  "zeit", "stunde", "minute", "sekunde",
  "haus", "wohnung", "zimmer", "tür", "fenster", "tisch", "stuhl",
  "auto", "zug", "flugzeug", "fahrrad", "straße", "weg", "stadt",
  "welt", "wasser", "feuer", "luft", "erde",
  "brot", "milch", "kaffee", "tee", "bier", "wein", "fleisch",
  "fisch", "obst", "gemüse",
  "geld", "arbeit", "beruf", "schule", "universität", "student",
  "lehrer", "arzt", "freund", "freundin", "familie", "mutter",
  "vater", "bruder", "schwester", "sohn", "tochter", "eltern",
  "buch", "film", "musik", "lied", "spiel", "sport", "fußball",
  "sprache", "deutsch", "englisch", "wort", "wörter", "satz",
  "frage", "antwort", "problem", "lösung", "idee", "geschichte",
  "leben", "liebe", "glück", "gesundheit", "krankheit",
  "wetter", "sonne", "regen", "schnee", "wolke",
  "kopf", "hand", "fuß", "auge", "ohr", "mund", "nase",
  "herz", "blut", "körper", "gesicht", "haar",

  // Adjectives
  "schlecht", "groß", "klein", "neu", "jung", "schnell",
  "langsam", "hoch", "tief", "lang", "kurz", "breit",
  "schmal", "dick", "dünn", "schwer", "leicht", "warm",
  "kalt", "heiß", "kühl", "trocken", "nass", "hell", "dunkel",
  "laut", "leise", "sauber", "schmutzig", "richtig", "falsch",
  "wichtig", "einfach", "schwierig", "schön", "hässlich",
  "reich", "frei", "glücklich", "traurig", "müde", "wach",
  "hungrig", "durstig", "krank", "gesund", "stark", "schwach",
  "klug", "dumm", "freundlich", "höflich", "ruhig", "nervös",
  "lustig", "ernst"
]);

// ============================================================
// DETECTION
// ============================================================

function tokenize(title) {
  return title
    .toLowerCase()
    .replace(/[^a-zäöüß0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
}

function isGermanStrict(title) {
  if (!title) return false;
  const tokens = tokenize(title);
  if (tokens.length === 0) return false;
  return tokens.some((tok) => GERMAN_WORDS.has(tok));
}

function isGermanBalanced(title) {
  if (!title || title.length < 6) return true;
  const lower = " " + title.toLowerCase() + " ";
  const signals = [
    "ä", "ö", "ü", "ß",
    " der ", " die ", " das ", " und ", " ist ", " nicht ",
    " mit ", " von ", " für ", " auf ", " ein ", " eine "
  ];
  return signals.some((s) => lower.includes(s));
}

function isShort(card) {
  if (card.matches("ytd-reel-item-renderer")) return true;
  if (card.querySelector("a[href*='/shorts/']")) return true;
  return false;
}

function isMusicOrMix(card) {
  if (card.querySelector("a[href*='list=']")) return true;
  const badge = card.querySelector("ytd-badge-supported-renderer");
  if (badge) {
    const t = badge.textContent.toLowerCase();
    if (t.includes("mix") || t.includes("music") || t.includes("playlist")) return true;
  }
  if (card.closest("ytd-rich-shelf-renderer")?.querySelector("[title*='Music']")) return true;
  return false;
}

// Find the title of a card, trying several selectors used by YouTube.
function getTitle(card) {
  const el = card.querySelector(
    "#video-title, a#video-title, #video-title-link, h3 a, .title"
  );
  if (!el) return "";
  return (
    el.textContent.trim() ||
    el.getAttribute("title") ||
    el.getAttribute("aria-label") ||
    ""
  ).trim();
}

// ============================================================
// FILTERING
// ============================================================

function applyFilter() {
  const cards = document.querySelectorAll(
    "ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer"
  );

  cards.forEach((card) => {
    const title = getTitle(card);

    let shouldHide = false;

    if (filterMode === "strict") {
      // Shorts and music/mix are always hidden in strict mode.
      if (isShort(card) || isMusicOrMix(card)) {
        shouldHide = true;
      } else if (title) {
        // Only hide when we actually have a title to judge.
        // If the title is empty, leave the card alone — it may still be loading.
        if (!isGermanStrict(title)) shouldHide = true;
      }
    } else {
      // Balanced: let Shorts and music/mix through; filter regular videos only.
      if (!isShort(card) && !isMusicOrMix(card) && title) {
        if (!isGermanBalanced(title)) shouldHide = true;
      }
    }

    if (shouldHide) {
      card.style.display = "none";
      card.dataset.gfHidden = "true";
    } else if (card.dataset.gfHidden === "true") {
      card.style.display = "";
      delete card.dataset.gfHidden;
    }
  });
}

function showAll() {
  document.querySelectorAll('[data-gf-hidden="true"]').forEach((el) => {
    el.style.display = "";
    delete el.dataset.gfHidden;
  });
}

// Debounced observer so YouTube's rapid DOM churn doesn't thrash the filter.
let observerTimer = null;
const observer = new MutationObserver(() => {
  if (!filterEnabled) return;
  if (observerTimer) return;
  observerTimer = setTimeout(() => {
    observerTimer = null;
    applyFilter();
  }, 150);
});
observer.observe(document.body, { childList: true, subtree: true });
