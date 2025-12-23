import {
  generateImages,
  downloadAsPDF,
  deleteAll,
  moveLeft,
  moveRight
} from './generate-images.mjs';
import { toggleDrawCanvas } from './utils/draw.mjs';
import { InputController } from './controllers/InputController.mjs';
import { SettingsController } from './controllers/SettingsController.mjs';

/**
 * Hi there! This is the entry file of the tool.
 * It now delegates logic to modular controllers.
 */

// Initialize Controllers
new InputController();
new SettingsController();

// Global / Action Event Listeners
const GLOBAL_EVENTS = {
  '#generate-image-form': {
    on: 'submit',
    action: (e) => {
      e.preventDefault();
      generateImages();
    }
  },
  '#draw-diagram-button': {
    on: 'click',
    action: toggleDrawCanvas
  },
  '.draw-container .close-button': {
    on: 'click',
    action: toggleDrawCanvas
  },
  '#download-as-pdf-button': {
    on: 'click',
    action: downloadAsPDF
  },
  '#delete-all-button': {
    on: 'click',
    action: deleteAll
  }
};

// Bind Global Events
for (const selector in GLOBAL_EVENTS) {
  const el = document.querySelector(selector);
  if (el) {
    el.addEventListener(GLOBAL_EVENTS[selector].on, GLOBAL_EVENTS[selector].action);
  }
}

// Global UI Logic (e.g. Output Image Controls Delegation is already in generate-images.mjs?)
// Checking generate-images.mjs... yes, it has event delegation at the bottom.

// Font Loading Check (Preserved from Phase 1)
document.fonts.ready.then(() => {
  const overlay = document.getElementById('font-loading-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 500);
  }
});

/**
 * Set GitHub Contributors
 */
fetch('https://api.github.com/repos/saurabhdaware/text-to-handwriting/contributors')
  .then(response => {
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    return response.json();
  })
  .then((res) => {
    const contributorsSection = document.querySelector('#project-contributors');
    if (contributorsSection) {
      contributorsSection.innerHTML = res
        .map(
          (contributor) => /* html */ `
        <div class="contributor-profile shadow">
          <a href="${contributor.html_url}">
            <img 
              alt="GitHub avatar of contributor ${contributor.login}" 
              class="contributor-avatar" 
              loading="lazy" 
              src="${contributor.avatar_url}" 
            />
            <div class="contributor-username">${contributor.login}</div>
          </a>
        </div>
      `
        )
        .join('');
    }
  })
  .catch((error) => {
    console.error('Erro ao buscar contribuidores:', error);
    const contributorsSection = document.querySelector('#project-contributors');
    if (contributorsSection) contributorsSection.innerHTML = '';
  });
