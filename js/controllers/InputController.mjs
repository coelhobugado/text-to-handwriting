import { formatText, debounce } from '../utils/helpers.mjs';
import { generateImages } from '../generate-images.mjs';

/**
 * Handles all logic related to the text input area (#note).
 */
export class InputController {
  constructor() {
    this.noteElement = document.querySelector('#note');
    this.autoGenerateToggle = document.querySelector('#auto-generate-toggle');
    this.initListeners();
  }

  initListeners() {
    if (!this.noteElement) return;

    // Paste formatting
    this.noteElement.addEventListener('paste', formatText);

    // Auto-Generate (Live Preview) Logic
    const debouncedGenerate = debounce(() => {
      if (this.autoGenerateToggle && this.autoGenerateToggle.checked) {
        generateImages();
      }
    }, 1500);

    this.noteElement.addEventListener('keyup', debouncedGenerate);
  }
}
