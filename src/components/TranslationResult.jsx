import { useState, useEffect } from "react";
import { Copy, Volume2, Square, Check } from "lucide-react";

function TranslationResult({ text, isLoading, sourceLang, targetLang }) {
  const [copyStatus, setCopyStatus] = useState("");
  const [speechStatus, setSpeechStatus] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Load available voices and find the best match for target language
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);

      if (targetLang && availableVoices.length > 0) {
        // Try to find a voice that matches the target language
        const matchingVoice = availableVoices.find((voice) =>
          voice.lang.toLowerCase().startsWith(targetLang.toLowerCase())
        );

        if (matchingVoice) {
          setSelectedVoice(matchingVoice);
        } else {
          // Fallback to first available voice
          setSelectedVoice(availableVoices[0]);
        }
      }
    };

    // Load voices initially
    loadVoices();

    // Some browsers load voices asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      // Cancel any ongoing speech when component unmounts
      speechSynthesis.cancel();
    };
  }, [targetLang]);

  const copyToClipboard = async () => {
    if (!text) {
      setCopyStatus("No text to copy");
      setTimeout(() => setCopyStatus(""), 2000);
      return;
    }

    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopyStatus("Copied!");
        console.log("Translation copied to clipboard using Clipboard API");
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          setCopyStatus("Copied!");
          console.log("Translation copied to clipboard using fallback method");
        } else {
          throw new Error("Copy command failed");
        }
      }
    } catch (error) {
      console.error("Failed to copy text:", error);
      setCopyStatus("Copy failed");
    }

    // Clear status after 2 seconds
    setTimeout(() => setCopyStatus(""), 2000);
  };

  const speakText = () => {
    if (!text) {
      setSpeechStatus("No text to speak");
      setTimeout(() => setSpeechStatus(""), 2000);
      return;
    }

    if (!("speechSynthesis" in window)) {
      setSpeechStatus("Speech not supported");
      setTimeout(() => setSpeechStatus(""), 2000);
      return;
    }

    // Stop any current speech
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure the utterance
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Set language if we have target language
      if (targetLang) {
        utterance.lang = targetLang;
      }

      // Use selected voice if available
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Set up event listeners
      utterance.onstart = () => {
        setIsPlaying(true);
        setSpeechStatus("Speaking...");
        console.log("Speech started");
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setSpeechStatus("");
        console.log("Speech ended");
      };

      utterance.onerror = (event) => {
        setIsPlaying(false);
        setSpeechStatus("Speech failed");
        console.error("Speech error:", event.error);
        setTimeout(() => setSpeechStatus(""), 2000);
      };

      utterance.onpause = () => {
        setIsPlaying(false);
        console.log("Speech paused");
      };

      utterance.onresume = () => {
        setIsPlaying(true);
        console.log("Speech resumed");
      };

      // Start speaking
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Speech synthesis error:", error);
      setSpeechStatus("Speech failed");
      setTimeout(() => setSpeechStatus(""), 2000);
    }
  };

  const stopSpeech = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setSpeechStatus("");
    }
  };

  if (isLoading) {
    return (
      <div className="translation-result loading">
        <div className="loading-spinner"></div>
        <p>Translating...</p>
      </div>
    );
  }

  if (!text) {
    return null;
  }

  return (
    <div className="translation-result">
      <div className="result-header">
        <h3>Translation:</h3>
        <div className="result-actions">
          <button
            className={`action-btn ${copyStatus ? "success" : ""}`}
            onClick={copyToClipboard}
            title="Copy to clipboard"
            disabled={!text}
          >
            {copyStatus ? <Check size={16} /> : <Copy size={16} />}
          </button>

          {isPlaying ? (
            <button
              className="action-btn playing"
              onClick={stopSpeech}
              title="Stop speech"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              className="action-btn"
              onClick={speakText}
              title="Text to speech"
              disabled={!text || !("speechSynthesis" in window)}
            >
              <Volume2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Status messages */}
      {(copyStatus || speechStatus) && (
        <div className="status-message">
          {copyStatus && (
            <span className="copy-status">
              <Copy size={12} />
              {copyStatus}
            </span>
          )}
          {speechStatus && (
            <span className="speech-status">
              <Volume2 size={12} />
              {speechStatus}
            </span>
          )}
        </div>
      )}

      <div className="translation-text">{text}</div>

      {/* Voice selection */}
      {voices.length > 0 && (
        <div
          className="voice-controls"
          style={{ marginTop: "8px", fontSize: "12px" }}
        >
          <select
            value={selectedVoice?.name || ""}
            onChange={(e) => {
              const voice = voices.find((v) => v.name === e.target.value);
              setSelectedVoice(voice);
            }}
            style={{ fontSize: "11px", padding: "2px" }}
            title="Select voice for text-to-speech"
          >
            {voices
              .filter(
                (voice) =>
                  !targetLang ||
                  voice.lang.toLowerCase().startsWith(targetLang.toLowerCase())
              )
              .map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default TranslationResult;
