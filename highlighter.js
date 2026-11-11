let lastColor = "#ffff00";
let highlightEnabled = true;

chrome.storage.local.get(
  { highlightColor: "#ffff00", highlightEnabled: true },
  (data) => {
    lastColor = data.highlightColor;
    highlightEnabled = data.highlightEnabled;
  }
);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.highlightColor) {
    lastColor = changes.highlightColor.newValue;
  }
  if (changes.highlightEnabled) {
    highlightEnabled = changes.highlightEnabled.newValue;
    if (!highlightEnabled) {
      removePopup();
    }
  }
});

let popupEl = null;
let lastHighlightRange = null;

document.addEventListener("mouseup", (e) => {
  if (!highlightEnabled) return;
  if (popupEl && popupEl.contains(e.target)) return;

  setTimeout(() => {
    if (!highlightEnabled) return;

    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : "";

    if (!text || text.length < 1) {
      removePopup();
      return;
    }

    const range = sel.getRangeAt(0).cloneRange();

    applyHighlight(range, lastColor);
    lastHighlightRange = range;

    sel.removeAllRanges();

    const rect = range.getBoundingClientRect();
    if (rect && (rect.width || rect.height)) {
      showPopup(rect);
    } else {
      removePopup();
    }
  }, 10);
});

document.addEventListener("mousedown", (e) => {
  if (popupEl && !popupEl.contains(e.target)) {
    removePopup();
  }
});

function removePopup() {
  if (popupEl) {
    popupEl.remove();
    popupEl = null;
  }
}

function showPopup(rect) {
  removePopup();

  popupEl = document.createElement("div");
  popupEl.id = "gf-highlight-popup";

  const colors = ["#ffff00", "#a0e7a0", "#a0c4ff"];

  colors.forEach((color) => {
    const sw = document.createElement("div");
    sw.className = "gf-swatch";
    sw.style.background = color;
    if (color === lastColor) {
      sw.style.borderColor = "#1a73e8";
    }
    sw.title = "Highlight with " + color;
    sw.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    });
    sw.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      if (lastHighlightRange) {
        rehighlightWith(lastHighlightRange, color);
      }

      chrome.storage.local.set({ highlightColor: color });
      lastColor = color;
      removePopup();
    });
    popupEl.appendChild(sw);
  });

  document.body.appendChild(popupEl);

  const top = window.scrollY + rect.top - popupEl.offsetHeight - 8;
  const left = window.scrollX + rect.left + rect.width / 2 - popupEl.offsetWidth / 2;
  popupEl.style.top = Math.max(window.scrollY + 4, top) + "px";
  popupEl.style.left = Math.max(window.scrollX + 4, left) + "px";
}

function applyHighlight(range, color) {
  try {
    const span = document.createElement("span");
    span.style.backgroundColor = color;
    span.className = "gf-highlighted";
    range.surroundContents(span);
  } catch (err) {
    document.execCommand("hiliteColor", false, color);
  }
}

function rehighlightWith(range, color) {
  const container = range.commonAncestorContainer;
  const root = container.nodeType === 1 ? container : container.parentElement;
  if (!root) return;

  const spans = root.querySelectorAll("span.gf-highlighted");
  let updated = false;
  spans.forEach((span) => {
    if (range.intersectsNode(span)) {
      span.style.backgroundColor = color;
      updated = true;
    }
  });

  if (!updated) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("hiliteColor", false, color);
    sel.removeAllRanges();
  }
}
