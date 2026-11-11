const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggleBtn");
const swatches = document.querySelectorAll(".swatch");

// --- YouTube filter toggle ---
chrome.storage.local.get({ enabled: false }, (data) => {
  updateUI(data.enabled);
});

toggleBtn.addEventListener("click", () => {
  chrome.storage.local.get({ enabled: false }, (data) => {
    const newState = !data.enabled;
    chrome.storage.local.set({ enabled: newState }, () => {
      updateUI(newState);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "setEnabled",
            enabled: newState
          }).catch(() => {});
        }
      });
    });
  });
});

function updateUI(enabled) {
  statusEl.textContent = enabled ? "Filter: ON" : "Filter: OFF";
  statusEl.className = enabled ? "status on" : "status off";
  toggleBtn.textContent = enabled ? "Turn OFF" : "Turn ON";
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
