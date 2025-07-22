import { useState, useEffect } from "react";
import LanguageDropdown from "./components/LanguageDropdown";
import TranslationResult from "./components/TranslationResult";
import TranslationHistory from "./components/TranslationHistory";
import { translateText } from "./utils/api";
import { getSettings, saveSettings, getSelectedText } from "./utils/storage";
import "./styles/popup.css";
import { Trash2 } from "lucide-react";

function App() {
  const [inputText, setInputText] = useState("");
  const [translationHistory, setTranslationHistory] = useState([]);
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("translate");

  // Function to get selected text from active tab
  const getSelectedTextFromTab = () => {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs?.[0]?.id) {
          resolve("");
          return;
        }

        const tab = tabs[0];
        const url = tab.url || "";

        // Skip restricted URLs
        if (
          url.startsWith("chrome://") ||
          url.startsWith("chrome-extension://") ||
          url.startsWith("edge://") ||
          url.startsWith("about:") ||
          url.includes(".pdf") ||
          url.startsWith("file://")
        ) {
          resolve("");
          return;
        }

        // Try to inject content script if needed
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            files: ["content.js"],
          },
          () => {
            if (chrome.runtime.lastError) {
              // Silent handling of injection errors
            }

            // Now try to get selected text
            chrome.tabs.sendMessage(
              tab.id,
              { action: "getSelectedText" },
              (response) => {
                if (chrome.runtime.lastError) {
                  resolve("");
                  return;
                }

                const safeText =
                  typeof response?.text === "string"
                    ? response.text.trim()
                    : "";
                resolve(safeText);
              }
            );
          }
        );
      });
    });
  };

  // Function to load selected text with multiple fallbacks
  const loadSelectedText = async () => {
    try {
      // 1. Try storage first (fastest)
      let selectedText = "";
      try {
        selectedText = await getSelectedText();
      } catch (storageError) {
        // Silent handling of storage errors
      }

      // 2. If no text from storage, try content script
      if (!selectedText?.trim()) {
        selectedText = await getSelectedTextFromTab();
      }

      // 3. Try direct storage check as final fallback
      if (!selectedText?.trim()) {
        chrome.storage.local.get(["selectedText", "lastSelection"], (data) => {
          if (data.selectedText && typeof data.selectedText === "string") {
            const timeDiff = Date.now() - (data.selectedTextTimestamp || 0);
            if (timeDiff < 30000) {
              // 30 seconds
              setInputText(data.selectedText.trim());
              return;
            }
          }

          if (
            data.lastSelection?.text &&
            typeof data.lastSelection.text === "string"
          ) {
            const timeDiff = Date.now() - (data.lastSelection.timestamp || 0);
            if (timeDiff < 30000) {
              // 30 seconds
              setInputText(data.lastSelection.text.trim());
              return;
            }
          }
        });
      }

      // Set the text if found
      if (selectedText?.trim()) {
        setInputText(selectedText.trim());
        setActiveTab("translate"); // Auto-focus translate tab
      }
    } catch (error) {
      // Silent handling of errors during text loading
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load settings
        const settings = await getSettings();
        if (settings) {
          setSourceLang(settings.sourceLang || "en");
          setTargetLang(settings.targetLang || "es");
        }

        // Load translation history
        chrome.storage.local.get(["translationHistory"], (data) => {
          if (Array.isArray(data.translationHistory)) {
            setTranslationHistory(data.translationHistory);
          }
        });

        // Load selected text with delay to ensure content script is ready
        setTimeout(() => {
          loadSelectedText();
        }, 100);

        // Also try again after a longer delay in case page is still loading
        setTimeout(() => {
          if (!inputText.trim()) {
            loadSelectedText();
          }
        }, 500);
      } catch (error) {
        // Silent handling of initialization errors
      }
    };

    if (typeof chrome !== "undefined" && chrome.storage) {
      initializeApp();
    }
  }, []);

  // Save settings when languages change
  useEffect(() => {
    if (chrome?.storage && (sourceLang || targetLang)) {
      saveSettings({
        sourceLang: sourceLang || "en",
        targetLang: targetLang || "es",
      }).catch((error) => {
        // Silent handling of settings save errors
      });
    }
  }, [sourceLang, targetLang]);

  const handleTranslate = async () => {
    const textToTranslate = inputText.trim();
    if (!textToTranslate) {
      setError("Please enter text to translate");
      return;
    }

    setIsLoading(true);
    setError("");
    setTranslatedText("");

    try {
      const result = await translateText(
        textToTranslate,
        sourceLang,
        targetLang
      );
      if (result?.translation) {
        const translation = result.translation;
        setTranslatedText(translation);

        const newEntry = {
          originalText: textToTranslate,
          translatedText: translation,
          sourceLang,
          targetLang,
          timestamp: Date.now(),
        };

        const updatedHistory = [newEntry, ...translationHistory].slice(0, 50); // Keep only 50 recent items
        setTranslationHistory(updatedHistory);

        chrome.storage.local.set({ translationHistory: updatedHistory });
      } else {
        setError("Translation failed: Invalid response from API");
      }
    } catch (err) {
      setError("Translation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputText("");
    setTranslatedText("");
    setError("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleTranslate();
    }
  };

  // Refresh selected text function for manual retry
  const handleRefreshText = () => {
    loadSelectedText();
  };

  return (
    <div className="translator-popup">
      <header className="popup-header">
        <h1>Language Translator</h1>
        <div className="tab-nav">
          <button
            className={activeTab === "translate" ? "active" : ""}
            onClick={() => setActiveTab("translate")}
          >
            Translate
          </button>
          <button
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
        </div>
      </header>

      {/* Translate Tab */}
      {activeTab === "translate" && (
        <main className="translate-tab active">
          <div className="language-section">
            <div className="language-row">
              <LanguageDropdown
                value={sourceLang}
                onChange={setSourceLang}
                label="From"
                includeAutoDetect={false}
              />
              <button
                className="detect-btn"
                onClick={() => {
                  const temp = sourceLang;
                  setSourceLang(targetLang);
                  setTargetLang(temp);
                }}
                title="Swap languages"
              >
                ⇄
              </button>
              <LanguageDropdown
                value={targetLang}
                onChange={setTargetLang}
                label="To"
                includeAutoDetect={false}
              />
            </div>
          </div>

          <div className="text-input-section">
            <div className="input-header">
              <label htmlFor="input-textarea">Text</label>
              <button
                className="get-selected-btn"
                onClick={handleRefreshText}
                title="Get selected text from page"
                disabled={isLoading}
              >
                Get Selected
              </button>
            </div>
            <textarea
              id="input-textarea"
              placeholder="Enter text to translate or select text on the page..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={4}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button
              className="translate-btn primary"
              onClick={handleTranslate}
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner"></span>
                  Translating...
                </>
              ) : (
                "Translate"
              )}
            </button>
            <button
              className="clear-btn secondary"
              onClick={handleClear}
              disabled={isLoading}
              title="Clear text"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>

          <TranslationResult
            text={translatedText}
            isLoading={isLoading}
            sourceLang={sourceLang}
            targetLang={targetLang}
          />
        </main>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <main className="history-tab active">
          <TranslationHistory
            history={translationHistory}
            onClearHistory={() => {
              chrome.storage.local.set({ translationHistory: [] });
              setTranslationHistory([]);
            }}
          />
        </main>
      )}
    </div>
  );
}

export default App;
