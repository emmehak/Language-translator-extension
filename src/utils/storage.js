// Storage utilities for Chrome extension
const HISTORY_KEY = "translationHistory";
const MAX_HISTORY_ITEMS = 50;

export async function saveTranslation(translation) {
  try {
    const result = await chrome.storage.local.get([HISTORY_KEY]);
    let history = result[HISTORY_KEY] || [];
    history.unshift(translation);
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    await chrome.storage.local.set({ [HISTORY_KEY]: history });
    return true;
  } catch (error) {
    return false;
  }
}

export async function getTranslationHistory() {
  try {
    const result = await chrome.storage.local.get([HISTORY_KEY]);
    return result[HISTORY_KEY] || [];
  } catch (error) {
    return [];
  }
}

export async function clearTranslationHistory() {
  try {
    await chrome.storage.local.remove([HISTORY_KEY]);
    return true;
  } catch (error) {
    return false;
  }
}

export async function removeTranslation(index) {
  try {
    const result = await chrome.storage.local.get([HISTORY_KEY]);
    let history = result[HISTORY_KEY] || [];
    if (index >= 0 && index < history.length) {
      history.splice(index, 1);
      await chrome.storage.local.set({ [HISTORY_KEY]: history });
    }
    return true;
  } catch (error) {
    return false;
  }
}

export async function saveSettings(settings) {
  try {
    await chrome.storage.sync.set(settings);
    return true;
  } catch (error) {
    return false;
  }
}

export async function getSettings() {
  try {
    if (typeof chrome === "undefined" || !chrome.storage) {
      return {
        sourceLang: "auto",
        targetLang: "en",
        autoDetect: true,
        showTooltip: true,
        playSound: false,
      };
    }

    const result = await chrome.storage.sync.get([
      "sourceLang",
      "targetLang",
      "autoDetect",
      "showTooltip",
      "playSound",
    ]);

    return {
      sourceLang: result.sourceLang || "en",
      targetLang: result.targetLang || "es",
      autoDetect: result.autoDetect !== false,
      showTooltip: result.showTooltip !== false,
      playSound: result.playSound || false,
    };
  } catch (error) {
    return {
      sourceLang: "en",
      targetLang: "es",
      autoDetect: true,
      showTooltip: true,
      playSound: false,
    };
  }
}

export async function saveSelectedText(text) {
  try {
    await chrome.storage.local.set({
      selectedText: text,
      selectedTextTimestamp: Date.now(),
    });
    return true;
  } catch (error) {
    return false;
  }
}

export async function getSelectedText() {
  try {
    if (typeof chrome === "undefined" || !chrome.storage) {
      return "";
    }

    const result = await chrome.storage.local.get([
      "selectedText",
      "selectedTextTimestamp",
      "lastSelection",
    ]);

    if (
      result.selectedText &&
      typeof result.selectedText === "string" &&
      result.selectedTextTimestamp
    ) {
      const timeDiff = Date.now() - result.selectedTextTimestamp;
      if (timeDiff < 30000) {
        return result.selectedText;
      }
    }

    if (
      result.lastSelection &&
      result.lastSelection.text &&
      typeof result.lastSelection.text === "string"
    ) {
      const timeDiff = Date.now() - result.lastSelection.timestamp;
      if (timeDiff < 30000) {
        return result.lastSelection.text;
      }
    }

    return "";
  } catch (error) {
    return "";
  }
}

export async function clearSelectedText() {
  try {
    await chrome.storage.local.remove([
      "selectedText",
      "selectedTextTimestamp",
      "lastSelection",
    ]);
    return true;
  } catch (error) {
    return false;
  }
}
