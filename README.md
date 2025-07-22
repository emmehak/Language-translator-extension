# Chrome Extension: Language Translator

This is a simple and fast Chrome Extension that lets users translate selected text directly on webpages using the MyMemory Translation API. It also includes a popup interface for manual text input, language swapping, and viewing translation history.

## Features

* Translate selected text on any webpage using a floating tooltip  
* Translate custom input text from the popup  
* Swap source and target languages with a single click  
* View recent translation history  
* Save and sync preferred language settings across sessions  
* Built with React and Vite for a fast and clean UI  
* Select specific dialects where available
* Listen to translations with integrated text-to-speech (TTS)  
* Copy original or translated text to clipboard with one click  


## Tech Stack

* React + Vite
* Chrome Extensions Manifest V3
* MyMemory Translation API
* Chrome Storage API (local and sync)

## Installation (Development)

1. Clone this repository:

   ```
   git clone https://github.com/yourusername/language-translator-extension.git
   cd language-translator-extension
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Build the extension:

   ```
   npm run build
   ```

4. Load the extension in Chrome:

   * Open `chrome://extensions/`
   * Enable Developer Mode (top right)
   * Click "Load unpacked"
   * Select the `dist` folder created after build

## Project Structure

```
src/
├── components/
│   ├── LanguageDropdown.jsx
│   ├── TranslationResult.jsx
│   └── TranslationHistory.jsx
├── scripts/
│   ├── background.js
│   └── content.js
├── utils/
│   ├── api.js
│   └── storage.js
├── styles/
│   └── popup.css
├── App.jsx
├── index.css
├── main.jsx

```

## Scripts

* `npm run build` – Build the extension for production

## Supported Languages

Languages are selected via dropdowns. Users can choose both the source and target languages. Auto-detect is disabled to improve translation consistency.

## API Usage

This extension uses the free tier of the MyMemory API:

* 1000 requests per day
* No authentication required

## Limitations

* Tooltip won't work on Chrome internal pages (`chrome://`, `chrome-extension://`) or PDF files
* API request limit of 1000/day
* Internet connection is required for translations

## Author

Mehak Eman
GitHub: [https://github.com/emmehak](https://github.com/emmehak)
LinkedIn: [https://www.linkedin.com/in/mehak-eman-2a229a24a/](https://www.linkedin.com/in/mehak-eman-2a229a24a/)
Portfolio: [https://mehakeman-portfolio.netlify.app](https://mehakeman-portfolio.netlify.app)
