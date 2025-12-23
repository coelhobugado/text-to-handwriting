/**
 * Humanizer Module
 * Adds random perturbations to text to simulate natural handwriting.
 */

const getRandomOffset = (max) => (Math.random() - 0.5) * max;
const getRandomRotate = (max) => (Math.random() - 0.5) * max;

/**
 * Applies humanization styles (rotation, offsets) to a container's text.
 * Currently, this operates by wrapping words or applying styles if the structure allows.
 * Since the current project structure uses a single contenteditable div,
 * we might need to rely on the fact that 'word spacing' and 'letter spacing' are global,
 * but specifically for "humanization", we want local variance.
 * 
 * Strategy:
 * 1. Parse the text content.
 * 2. Wrap words in <span class="humanized-word">...</span>
 * 3. Apply inline variables to each span.
 * 
 * @param {HTMLElement} container The element containing the text/html.
 * @param {boolean} enabled Whether humanization is enabled.
 */
export function applyHumanization(container, enabled) {
  if (!enabled) {
    // If disabled, we should ideally strip the spans or reset styles.
    // For MVP, we might toggle a class on the container that disables the effects
    // or re-render the plain text.
    // Simplifying: If disabled, we won't re-process, but we need a way to "undo".
    // The simplest "undo" in this flow is to re-render the original text without spans.
    // However, since we don't store "original" vs "humanized" state easily in the DOM,
    // relying on the existing 'formatText' or just regeneration might be cleaner.
    // For now, let's assume this is called *before* generation or on toggle.
    return;
  }

  // NOTE: Direct DOM manipulation on contentEditable can be tricky for the cursor.
  // This function is best used RIGHT BEFORE image generation (cloning the node),
  // OR we accept that enabling "Human Mode" might reset cursor or require complex handling.
  // Given "Quick Win" scope: We will apply this to the element *during* the generation phase 
  // if possible, or apply it to the live view if the user wants to see it.
  
  // Actually, to see the effect in Live Preview, we need to apply it to the DOM.
  // Let's iterate over child nodes.
  
  // WARN: This is a destructive operation for the HTML structure if not careful.
  // For a "Quick Win", let's try a CSS-only approach if possible? 
  // No, CSS random() isn't widely supported for this.
  
  // Let's assign random variables to existing children if they exist, 
  // or wrap text nodes.
  
  cautiousTreeWalker(container);
}

function cautiousTreeWalker(element) {
  // If it's a text node, wrap words
  if (element.nodeType === Node.TEXT_NODE && element.textContent.trim().length > 0) {
      const words = element.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      words.forEach(word => {
          if (word.trim().length === 0) {
              frag.appendChild(document.createTextNode(word));
              return;
          }
          const span = document.createElement('span');
          span.textContent = word;
          span.classList.add('humanized-word');
          // Set random properties
          span.style.setProperty('--h-rot', `${getRandomRotate(15)}deg`); // Reduced to 15deg max? Actually 2-3deg is subtler.
          span.style.setProperty('--h-y', `${getRandomOffset(2)}px`);
          span.style.setProperty('--h-x', `${getRandomOffset(2)}px`);
          frag.appendChild(span);
      });
      element.parentNode.replaceChild(frag, element);
  } else if (element.nodeType === Node.ELEMENT_NODE) {
      if (element.classList.contains('humanized-word')) {
          // Update existing
          element.style.setProperty('--h-rot', `${getRandomRotate(4)}deg`); // Subtle rotation
          element.style.setProperty('--h-y', `${getRandomOffset(3)}px`); // Subtle Y offset
          element.style.setProperty('--h-x', `${getRandomOffset(1)}px`);
      } else {
         // Recurse
         Array.from(element.childNodes).forEach(child => cautiousTreeWalker(child));
      }
  }
}

export function cleanupHumanization(container) {
    // Reverts spans to text nodes if needed, or simply let the user delete/retype.
    // For the MVP, if the user toggles OFF, we might want to strip the spans.
    // This is complex. 
    // Alternative: Just remove the CSS class/variables effect via a parent class.
    container.classList.remove('humanized-active');
}

export function enableHumanizationGroup(container) {
    // Just walking the tree to update/create spans
    container.classList.add('humanized-active');
    cautiousTreeWalker(container);
}
