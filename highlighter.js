let lastColor = "#ffff00";

chrome.storage.local.get({ highlightColor: "#ffff00" }, (data) => {
  lastColor = data.highlightColor;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.highlightColor) {
    lastColor = changes.highlightColor.newValue;
  }
});

let popupEl = null;
let lastHighlightRange = null;

document.addEventListener("mouseup", (e) => {
  if (popupEl && popupEl.contains(e.target)) return;

  setTimeout(() => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : "";

    if (!text || text.length < 1) {
      removePopup();
      return;
    }

    const range = sel.getRangeAt(0).cloneRange();

    // Auto-highlight immediately with the last used color
    applyHighlight(range, lastColor);

    // Keep a reference so the color picker can re-highlight
    lastHighlightRange = range;

    // Clear selection so the new highlight is visible
    sel.removeAllRanges();

    // Show the color picker near the highlighted area
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
        // Remove the previous auto-highlight, then re-apply with the new color
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
  // Find the span(s) created by the auto-highlight and update their color.
  // Since the range was cloned before highlighting, we search the common ancestor.
  const container = range.commonAncestorContainer;
  const root = container.nodeType === 1 ? container : container.parentElement;
  if (!root) return;

  // Update any gf-highlighted spans that overlap the range
  const spans = root.querySelectorAll("span.gf-highlighted");
  let updated = false;
  spans.forEach((span) => {
    if (range.intersectsNode(span)) {
      span.style.backgroundColor = color;
      updated = true;
    }
  });

  // If nothing was updated (e.g. execCommand fallback), try execCommand again
  if (!updated) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("hiliteColor", false, color);
    sel.removeAllRanges();
  }
}
