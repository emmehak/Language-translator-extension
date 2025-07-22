// Content Script

let selectedText = "";
let tooltip = null;
let lastSelection = null;

// Listen for text selection
document.addEventListener("mouseup", handleTextSelection);
document.addEventListener("keyup", handleTextSelection);

function getSelectedTextSafe() {
  try {
    const selection = window.getSelection();
    const text = selection ? (selection.toString() || "").trim() : "";
    return text;
  } catch (err) {
    return "";
  }
}

function handleTextSelection() {
  try {
    const text = getSelectedTextSafe();

    if (text && text.length > 0) {
      selectedText = text;
      lastSelection = {
        text: text,
        timestamp: Date.now(),
      };

      chrome.storage.local.set({
        selectedText: text,
        selectedTextTimestamp: Date.now(),
        lastSelection: lastSelection,
      });
    } else {
      setTimeout(() => {
        const currentSelection = getSelectedTextSafe();
        if (!currentSelection) {
          selectedText = "";
          hideTooltip();
        }
      }, 100);
    }
  } catch (err) {
    // Silently handle error
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === "getSelectedText") {
      if (!selectedText && lastSelection) {
        const timeDiff = Date.now() - lastSelection.timestamp;

        if (timeDiff < 30000) {
          selectedText = lastSelection.text;
        }
      }

      sendResponse({ text: selectedText });
      return true;
    }

    if (request.action === "showTooltip") {
      const textToTranslate =
        request.text || selectedText || lastSelection?.text || "";
      if (textToTranslate) showTranslationTooltip(textToTranslate);
      sendResponse({ success: true });
    }

    if (request.action === "hideTooltip") {
      hideTooltip();
      sendResponse({ success: true });
    }
  } catch (err) {
    sendResponse({ error: "Content script message handling failed." });
  }
});

function showTranslationTooltip(text) {
  try {
    if (!text) return;

    hideTooltip();

    tooltip = document.createElement("div");
    tooltip.id = "translator-tooltip";
    tooltip.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ffffff;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 320px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      font-size: 14px;
      line-height: 1.4;
      color: #333;
    `;

    tooltip.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong style="color: #2563eb;">MyMemory Translator</strong>
        <button onclick="this.closest('#translator-tooltip').remove()" style="
          border: none;
          background: none;
          font-size: 18px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 20px;
          height: 20px;
        ">×</button>
      </div>
      <div style="margin-bottom: 8px; padding: 8px; background: #f8fafc; border-radius: 4px; border-left: 3px solid #3b82f6;">
        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Original:</div>
        <div>${escapeHtml(text)}</div>
      </div>
      <div id="translation-result" style="color: #666; display: flex; align-items: center; gap: 8px;">
        <div style="width: 16px; height: 16px; border: 2px solid #3b82f6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        Translating...
      </div>
    `;

    if (!document.getElementById("translator-spinner-style")) {
      const style = document.createElement("style");
      style.id = "translator-spinner-style";
      style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }

    document.body.appendChild(tooltip);

    chrome.storage.sync.get(["sourceLang", "targetLang"], (data) => {
      const sourceLang = data.sourceLang || "en";
      const targetLang = data.targetLang || "es";

      if (sourceLang === "auto" || targetLang === "auto") {
        updateTooltipResult("Auto-detect language is not supported.", true);
        return;
      }

      try {
        chrome.runtime.sendMessage(
          {
            action: "translate",
            text,
            sourceLang,
            targetLang,
          },
          (response) => {
            if (!tooltip) return;

            if (chrome.runtime.lastError) {
              updateTooltipResult("Translation service unavailable.", true);
              return;
            }

            if (response?.success && response?.translation) {
              updateTooltipResult(response.translation, false);
            } else {
              const errorMsg =
                response?.error || "Translation failed. Please try again.";
              updateTooltipResult(errorMsg, true);
            }
          }
        );
      } catch (err) {
        updateTooltipResult("Failed to connect to translation service.", true);
      }
    });
  } catch (err) {
    // Silently handle error
  }
}

function updateTooltipResult(text, isError = false) {
  if (!tooltip) return;

  const resultDiv = tooltip.querySelector("#translation-result");
  if (!resultDiv) return;

  if (isError) {
    resultDiv.innerHTML = `
      <div style="color: #dc2626; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">⚠️</span>
        ${escapeHtml(text)}
      </div>
    `;
  } else {
    resultDiv.innerHTML = `
      <div style="padding: 8px; background: #f0f9ff; border-radius: 4px; border-left: 3px solid #10b981;">
        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Translation:</div>
        <div style="color: #059669; font-weight: 500;">${escapeHtml(text)}</div>
      </div>
    `;
  }
}

function hideTooltip() {
  if (tooltip) {
    tooltip.remove();
    tooltip = null;
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener("click", (event) => {
  if (tooltip && !tooltip.contains(event.target)) {
    hideTooltip();
  }
});

document.addEventListener("scroll", () => {
  hideTooltip();
});

window.addEventListener("beforeunload", hideTooltip);

document.addEventListener("dblclick", () => {
  const text = getSelectedTextSafe();

  if (text && text.length > 0 && text.length < 500) {
    selectedText = text;
    lastSelection = {
      text,
      timestamp: Date.now(),
    };

    chrome.storage.local.set({
      selectedText: text,
      selectedTextTimestamp: Date.now(),
      lastSelection,
    });

    setTimeout(() => showTranslationTooltip(text), 100);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["selectedText", "lastSelection"], (data) => {
    if (data.selectedText) selectedText = data.selectedText;
    if (data.lastSelection) lastSelection = data.lastSelection;
  });
});

setTimeout(() => {
  const text = getSelectedTextSafe();
  if (text && text.length > 0) {
    selectedText = text;
    lastSelection = {
      text,
      timestamp: Date.now(),
    };
    chrome.storage.local.set({
      selectedText: text,
      selectedTextTimestamp: Date.now(),
      lastSelection,
    });
  }
}, 100);
