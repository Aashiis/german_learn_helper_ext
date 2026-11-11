let filterEnabled = false;

chrome.storage.local.get({ enabled: false }, (data) => {
  filterEnabled = data.enabled;
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
});

function looksGerman(title) {
  if (!title || title.length < 10) return true;
  const germanSignals = [
    "ä", "ö", "ü", "ß",
    " der ", " die ", " das ", " und ", " ist ", " nicht ",
    " mit ", " von ", " für ", " auf ", " ein ", " eine "
  ];
  const lower = " " + title.toLowerCase() + " ";
  return germanSignals.some(s => lower.includes(s));
}

function applyFilter() {
  const cards = document.querySelectorAll(
    "ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer"
  );
  cards.forEach(card => {
    const titleEl = card.querySelector("#video-title, a#video-title");
    if (!titleEl) return;
    const title = titleEl.textContent || titleEl.getAttribute("title") || "";
    if (!looksGerman(title)) {
      card.style.display = "none";
      card.dataset.gfHidden = "true";
    }
  });
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
