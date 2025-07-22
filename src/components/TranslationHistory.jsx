import { useState } from "react";
import { Copy, Trash2, Check } from "lucide-react";

function TranslationHistory({ history = [], onClearHistory }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const copyTranslation = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed: ", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  if (history.length === 0) {
    return (
      <div className="translation-history empty">
        <div className="empty-state">
          <h3>No translations yet</h3>
          <p>Your translation history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="translation-history">
      <div className="history-header">
        <h3>Translation History</h3>
        <button className="clear-btn" onClick={onClearHistory}>
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      <div className="history-list">
        {history
          .slice()
          .reverse()
          .map((item, index) => (
            <div key={index} className="history-item">
              <div className="history-content">
                <div className="original-text">
                  <strong>Original:</strong>
                  <span>{item.originalText}</span>
                </div>
                <div className="translated-text">
                  <strong>Translation:</strong>
                  <span>{item.translatedText}</span>
                </div>
                <div className="translation-meta">
                  <span className="languages">
                    {item.sourceLang} → {item.targetLang}
                  </span>
                  <span className="timestamp">
                    {formatDate(item.timestamp)}
                  </span>
                </div>
              </div>
              <div className="history-actions">
                <button
                  className="action-btn"
                  onClick={() => copyTranslation(item.translatedText, index)}
                  title="Copy translation"
                >
                  {copiedIndex === index ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default TranslationHistory;
