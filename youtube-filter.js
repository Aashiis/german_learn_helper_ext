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
      removeFilter();
    }
  }
  if (msg.action === "setMode") {
    filterMode = msg.mode;
    if (filterEnabled) {
      removeFilter();
      applyFilter();
    }
  }
});

// --- Detection helpers ---

function looksGerman(title) {
  if (!title || title.length < 6) return true;
  const germanSignals = [
    "ä", "ö", "ü", "ß",
    " der ", " die ", " das ", " und ", " ist ", " nicht ",
    " mit ", " von ", " für ", " auf ", " ein ", " eine ",
    " ich ", " du ", " wir ", " sie ", " es ", " ja ", " nein "
  ];
  const lower = " " + title.toLowerCase() + " ";
  return germanSignals.some(s => lower.includes(s));
}

// Detect Shorts by URL pattern or renderer element
function isShort(card) {
  if (card.matches("ytd-reel-item-renderer")) return true;
  const link = card.querySelector("a[href*='/shorts/']");
  if (link) return true;
  return false;
}

// Detect music / mix content by URL pattern or badges
function isMusicOrMix(card) {
  // Mix playlists have "list=" in the link
  const link = card.querySelector("a[href*='list=']");
  if (link) return true;

  // Music category badge or "Mix" badge text
  const badge = card.querySelector("ytd-badge-supported-renderer");
  if (badge) {
    const t = badge.textContent.toLowerCase();
    if (t.includes("mix") || t.includes("music") || t.includes("playlist")) return true;
  }

  // Check for music note icon or video duration in the music shelf
  if (card.closest("ytd-rich-shelf-renderer")?.querySelector("[title*='Music']")) return true;

  return false;
}

// --- Filtering ---

function applyFilter() {
  const cards = document.querySelectorAll(
    "ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer"
  );

  cards.forEach(card => {
    if (card.dataset.gfHidden === "true") return;

    // Strict mode: hide all Shorts and music/mix content regardless of language
    if (filterMode === "strict") {
      if (isShort(card) || isMusicOrMix(card)) {
        hideCard(card);
        return;
      }
    }

    // Balanced mode: only hide non-German regular videos.
    // Shorts and music/mix are let through.
    if (filterMode === "balanced") {
      if (isShort(card) || isMusicOrMix(card)) return;
    }

    // Language check on the title
    const titleEl = card.querySelector("#video-title, a#video-title");
    if (!titleEl) return;
    const title = titleEl.textContent || titleEl.getAttribute("title") || "";
    if (!looksGerman(title)) {
      hideCard(card);
    }
  });
}

function hideCard(card) {
  card.style.display = "none";
  card.dataset.gfHidden = "true";
}

function removeFilter() {
  document.querySelectorAll('[data-gf-hidden="true"]').forEach(el => {
    el.style.display = "";
    delete el.dataset.gfHidden;
  });
}

const observer = new MutationObserver(() => {
  if (filterEnabled) applyFilter();
});
observer.observe(document.body, { childList: true, subtree: true });
