import { addFontFromFile, addPaperFromFile } from '../utils/helpers.mjs';
import { setInkColor } from '../utils/draw.mjs';
import { applyHumanization, cleanupHumanization } from '../utils/humanizer.mjs';

/**
 * Handles all customization settings (Fonts, Colors, Spacing, Effects).
 */
export class SettingsController {
  constructor() {
    this.pageEl = document.querySelector('.page-a');
    this.initListeners();
  }

  setTextareaStyle(attrib, v) {
    this.pageEl.style[attrib] = v;
  }

  initListeners() {
    this.bind('#handwriting-font', 'change', (e) =>
      document.body.style.setProperty('--handwriting-font', e.target.value)
    );

    this.bind('#font-size', 'change', (e) => {
      if (e.target.value > 30) {
        console.warn('Font too big'); 
      } else {
        this.setTextareaStyle('fontSize', e.target.value + 'pt');
        // e.preventDefault(); // Unnecessary for change event usually
      }
    });

    this.bind('#letter-spacing', 'change', (e) => {
      if (e.target.value > 40) console.warn('Spacing too big');
      else this.setTextareaStyle('letterSpacing', e.target.value + 'px');
    });

    this.bind('#word-spacing', 'change', (e) => {
      if (e.target.value > 100) console.warn('Spacing too big');
      else this.setTextareaStyle('wordSpacing', e.target.value + 'px');
    });

    this.bind('#top-padding', 'change', (e) => {
      document.querySelector('.page-a .paper-content').style.paddingTop =
        e.target.value + 'px';
    });

    this.bind('#font-file', 'change', (e) => addFontFromFile(e.target.files[0]));

    this.bind('#ink-color', 'change', (e) => {
      document.body.style.setProperty('--ink-color', e.target.value);
      setInkColor(e.target.value);
    });

    this.bind('#paper-color', 'change', (e) => {
      const val = e.target.value;
      let colorVar = 'var(--paper-color-white)';
      if (val === 'lightyellow') colorVar = 'var(--paper-color-lightyellow)';
      else if (val === 'lightpink') colorVar = 'var(--paper-color-lightpink)';
      else if (val === 'lightblue') colorVar = 'var(--paper-color-lightblue)';
      
      document.body.style.setProperty('--current-paper-color', colorVar);
    });

    this.bind('#paper-margin-toggle', 'change', () => this.pageEl.classList.toggle('margined'));
    this.bind('#paper-line-toggle', 'change', () => this.pageEl.classList.toggle('lines'));
    this.bind('#paper-file', 'change', (e) => addPaperFromFile(e.target.files[0]));

    // Humanization Logic
    this.bind('#humanize-toggle', 'change', (e) => {
      const contentEl = document.querySelector('.page-a .paper-content');
      if (e.target.checked) applyHumanization(contentEl, true);
      else cleanupHumanization(contentEl);
    });
    
    // Switch Toggles Accessibility (Visual Feedback)
    document.querySelectorAll('.switch-toggle input').forEach((toggleInput) => {
      toggleInput.addEventListener('change', (e) => {
        const label = document.querySelector(`label[for="${toggleInput.id}"] .status`);
        if (label) label.textContent = toggleInput.checked ? 'ligado' : 'desligado';
        toggleInput.setAttribute('aria-checked', toggleInput.checked);
      });
    });
  }

  bind(selector, event, handler) {
    const el = document.querySelector(selector);
    if (el) el.addEventListener(event, handler);
  }
}
