/* eslint-disable no-unreachable */
// API utilities for MyMemory translation service
const API_BASE_URL = "https://api.mymemory.translated.net";

export const translateText = async (text, sourceLang, targetLang) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const encodedText = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${sourceLang}|${targetLang}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Extract translation from MyMemory's response format
    if (data.responseData && data.responseData.translatedText) {
      return {
        translation: data.responseData.translatedText,
        match: data.responseData.match || 1,
      };
    } else {
      throw new Error("Invalid response format from MyMemory API");
    }
  } catch (error) {
    throw error;
  }
};

// Fallback direct API calls (if background script fails or unsupported)
export async function translateTextDirect(
  text,
  sourceLang = "en",
  targetLang = "en"
) {
  try {
    const langPair = `${sourceLang}|${targetLang}`;

    const url = `${API_BASE_URL}/get?q=${encodeURIComponent(
      text
    )}&langpair=${langPair}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseStatus === 200) {
      return data.responseData.translatedText;
    } else {
      throw new Error(data.responseDetails || "Translation failed");
    }
  } catch (error) {
    throw new Error("Translation service unavailable");
  }
}

// List of common supported languages (removed auto-detect)
export async function getAvailableLanguages() {
  try {
    return [
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
      { code: "it", name: "Italian" },
      { code: "pt", name: "Portuguese" },
      { code: "ru", name: "Russian" },
      { code: "ja", name: "Japanese" },
      { code: "ko", name: "Korean" },
      { code: "zh", name: "Chinese" },
      { code: "ar", name: "Arabic" },
      { code: "hi", name: "Hindi" },
      { code: "ur", name: "Urdu" },
      { code: "bn", name: "Bengali" },
      { code: "fa", name: "Persian" },
      { code: "tr", name: "Turkish" },
      { code: "pl", name: "Polish" },
      { code: "nl", name: "Dutch" },
      { code: "sv", name: "Swedish" },
      { code: "da", name: "Danish" },
      { code: "no", name: "Norwegian" },
      { code: "fi", name: "Finnish" },
      { code: "cs", name: "Czech" },
      { code: "hu", name: "Hungarian" },
      { code: "ro", name: "Romanian" },
      { code: "bg", name: "Bulgarian" },
      { code: "hr", name: "Croatian" },
      { code: "sk", name: "Slovak" },
      { code: "sl", name: "Slovenian" },
      { code: "et", name: "Estonian" },
      { code: "lv", name: "Latvian" },
      { code: "lt", name: "Lithuanian" },
      { code: "mt", name: "Maltese" },
      { code: "uk", name: "Ukrainian" },
      { code: "el", name: "Greek" },
      { code: "he", name: "Hebrew" },
      { code: "th", name: "Thai" },
      { code: "vi", name: "Vietnamese" },
      { code: "id", name: "Indonesian" },
      { code: "ms", name: "Malay" },
    ];
  } catch (error) {
    return [
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
      { code: "it", name: "Italian" },
      { code: "pt", name: "Portuguese" },
    ];
  }
}
