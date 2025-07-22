// MyMemory API integration

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate") {
    handleTranslation(request, sendResponse);
    return true; // Keep message channel open for async sendResponse
  }
});

async function handleTranslation(request, sendResponse) {
  try {
    const { text, sourceLang, targetLang } = request;

    if (!text || !sourceLang || !targetLang) {
      throw new Error("Invalid translation parameters.");
    }

    checkRateLimit();
    const langPair = `${sourceLang}|${targetLang}`;
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${langPair}`;

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Chrome Extension Translator",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (data.responseStatus === 200 || data.responseStatus === "200") {
      const translatedText = data.responseData.translatedText;
      sendResponse({
        success: true,
        translation: translatedText,
        detectedLanguage: sourceLang,
      });
    } else {
      throw new Error(
        data.responseDetails || `API returned status: ${data.responseStatus}`
      );
    }
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message || "Translation failed",
    });
  }
}

// Context menu support
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "translateSelection",
      title: 'Translate "%s"',
      contexts: ["selection"],
    });
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && /^https?:/.test(tab.url)) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translateSelection") {
    chrome.tabs.sendMessage(tab.id, {
      action: "showTooltip",
      text: info.selectionText,
    });
  }
});

// Rate limiting to respect MyMemory's free tier
let requestCount = 0;
let resetTime = Date.now() + 24 * 60 * 60 * 1000;

function checkRateLimit() {
  const now = Date.now();

  if (now > resetTime) {
    requestCount = 0;
    resetTime = now + 24 * 60 * 60 * 1000;
  }

  if (requestCount >= 1000) {
    throw new Error(
      "Daily rate limit exceeded (1000 requests). Please try again tomorrow."
    );
  }

  requestCount++;
}
