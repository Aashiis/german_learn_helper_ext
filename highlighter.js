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

document.addEventListener("mouseup", (e) => {
  // Ignore clicks inside our own popup
  if (popupEl && popupEl.contains(e.target)) return;

  setTimeout(() => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : "";

    if (!text || text.length < 1) {
      removePopup();
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    showPopup(rect, sel, range);
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

function showPopup(rect, selection, range) {
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
    sw.title = color;
    sw.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    });
    sw.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      applyHighlight(range, color);
      chrome.storage.local.set({ highlightColor: color });
      lastColor = color;
      removePopup();
      selection.removeAllRanges();
    });
    popupEl.appendChild(sw);
  });

  document.body.appendChild(popupEl);

  // Position above the selection
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
    // surroundContents fails if the range spans multiple elements.
    // Fallback: use execCommand (deprecated but still works for simple cases)
    document.execCommand("hiliteColor", false, color);
  }
}
