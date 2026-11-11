const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggleBtn");
const swatches = document.querySelectorAll(".swatch");
const hlStatusEl = document.getElementById("hlStatus");
const hlToggleBtn = document.getElementById("hlToggleBtn");
const modeStrict = document.getElementById("modeStrict");
const modeBalanced = document.getElementById("modeBalanced");
const modeDesc = document.getElementById("modeDesc");

// --- YouTube filter toggle ---
chrome.storage.local.get({ enabled: false, filterMode: "strict" }, (data) => {
  updateUI(data.enabled);
  updateModeUI(data.filterMode);
});

toggleBtn.addEventListener("click", () => {
  chrome.storage.local.get({ enabled: false }, (data) => {
    const newState = !data.enabled;
    chrome.storage.local.set({ enabled: newState }, () => {
      updateUI(newState);
      notifyContentScript({ action: "setEnabled", enabled: newState });
    });
  });
});

function updateUI(enabled) {
  statusEl.textContent = enabled ? "Filter: ON" : "Filter: OFF";
  statusEl.className = enabled ? "status on" : "status off";
  toggleBtn.textContent = enabled ? "Turn OFF" : "Turn ON";
}

// --- Filter mode selection ---
modeStrict.addEventListener("click", () => setMode("strict"));
modeBalanced.addEventListener("click", () => setMode("balanced"));

function setMode(mode) {
  chrome.storage.local.set({ filterMode: mode }, () => {
    updateModeUI(mode);
    notifyContentScript({ action: "setMode", mode: mode });
  });
}

function updateModeUI(mode) {
  modeStrict.classList.toggle("active", mode === "strict");
  modeBalanced.classList.toggle("active", mode === "balanced");
  modeDesc.textContent = mode === "strict"
    ? "Strict: Only German videos. Shorts, music and mixes are hidden."
    : "Balanced: German videos plus Shorts, music and mix playlists.";
}

function notifyContentScript(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, msg).catch(() => {});
    }
  });
}

// --- Highlighter on/off toggle ---
chrome.storage.local.get({ highlightEnabled: true }, (data) => {
  updateHlUI(data.highlightEnabled);
});

hlToggleBtn.addEventListener("click", () => {
  chrome.storage.local.get({ highlightEnabled: true }, (data) => {
    const newState = !data.highlightEnabled;
    chrome.storage.local.set({ highlightEnabled: newState }, () => {
      updateHlUI(newState);
    });
  });
});

function updateHlUI(enabled) {
  hlStatusEl.textContent = enabled ? "Highlighter: ON" : "Highlighter: OFF";
  hlStatusEl.className = enabled ? "status on" : "status off";
  hlToggleBtn.textContent = enabled ? "Turn OFF" : "Turn ON";
  swatches.forEach((sw) => {
    sw.style.opacity = enabled ? "1" : "0.4";
    sw.style.pointerEvents = enabled ? "auto" : "none";
  });
}

// --- Highlight color selection ---
chrome.storage.local.get({ highlightColor: "#ffff00" }, (data) => {
  markActiveSwatch(data.highlightColor);
});

swatches.forEach((sw) => {
  sw.addEventListener("click", () => {
    const color = sw.dataset.color;
    chrome.storage.local.set({ highlightColor: color }, () => {
      markActiveSwatch(color);
    });
  });
});

function markActiveSwatch(color) {
  swatches.forEach((sw) => {
    sw.classList.toggle("active", sw.dataset.color === color);
  });
}
