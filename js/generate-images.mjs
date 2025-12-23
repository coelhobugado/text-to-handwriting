import html2canvas from 'html2canvas';
import {
  applyPaperStyles,
  removePaperStyles,
  renderOutput
} from './utils/generate-utils.mjs';
import { createPDF } from './utils/helpers.mjs';
import { applyScannerEffect } from './utils/effects.mjs';

// Altura base (em pixels) do elemento .page-a .paper-content quando está vazio
// e após applyPaperStyles() ter sido chamado (considerando paddings, etc., que afetam a área útil).
// Este valor é crucial para o cálculo de paginação.
// Se os estilos CSS de .page-a, .paper-content, ou .top-margin mudarem significativamente,
// este valor PODE precisar ser reavaliado inspecionando a altura do elemento no navegador
// em um estado "vazio" de conteúdo, mas com as margens e linhas da página visíveis.
const BASE_PAGE_CONTENT_HEIGHT_PX = 514;

const pageEl = document.querySelector('.page-a');
const outputContainer = document.querySelector('#output');
let outputImages = [];

/**
 * To generate image, we add styles to DIV and converts that HTML Element into Image.
 * This is the function that deals with it.
 */
async function convertDIVToImage() {
  const options = {
    scrollX: 0,
    scrollY: -window.scrollY,
    scale: document.querySelector('#resolution').value,
    useCORS: true
  };

  /** Function html2canvas comes from a library html2canvas which is included in the index.html */
  const canvas = await html2canvas(pageEl, options).catch((error) => {
    console.error('Erro durante a geração da imagem por html2canvas:', error);
    console.warn('Falha ao gerar imagem. Verifique o console para detalhes.'); // TODO: Substituir por uma notificação de UI não bloqueante
    // Se houvesse um indicador de "carregando" global, ele seria desativado aqui.
    throw error; // Sinaliza a falha para generateImages
  });

  // Se o canvas não foi gerado devido a um erro, não prossiga.
  if (!canvas) return;

  /** Send image data for modification if effect is scanner */
  /** Send image data for modification if scanner effect is enabled */
  /** Send image data for modification if scanner effect is enabled */
  if (document.querySelector('#page-effects').value === 'scanner') {
    applyScannerEffect(canvas);
  }

  outputImages.push(canvas);
  // Displaying no. of images on addition
  if (outputImages.length >= 1) {
    document.querySelector('#output-header').textContent =
      'Output ' + '( ' + outputImages.length + ' )';
  }
}

/**
 * This is the function that gets called on clicking "Generate Image" button.
 */
// Função auxiliar para esperar um pouco e liberar a Main Thread
const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

export async function generateImages() {
  console.time('Generation Time');
  let hyphenatorPtBr = null; // Inicializa como null
  if (
    typeof Hypher !== 'undefined' &&
    typeof HypherPatternsPtBr !== 'undefined'
  ) {
    try {
      hyphenatorPtBr = new Hypher(HypherPatternsPtBr);
    } catch (e) {
      console.error('Erro ao inicializar Hypher com padrões pt-BR:', e);
      // hyphenatorPtBr permanecerá null se houver erro
    }
  } else {
    // Silently continue or warn once
  }

  applyPaperStyles();
  pageEl.scroll(0, 0);

  const paperContentEl = document.querySelector('.page-a .paper-content');
  const scrollHeight = paperContentEl.scrollHeight;
  const clientHeight = BASE_PAGE_CONTENT_HEIGHT_PX; // height of .paper-content when there is no content

  const totalPages = Math.ceil(scrollHeight / clientHeight);

  if (totalPages > 1) {
    if (paperContentEl.innerHTML.includes('<img')) {
      alert(
        "You're trying to generate more than one page, Images and some formatting may not work correctly with multiple images" // eslint-disable-line max-len
      );
    }
    const initialPaperContent = paperContentEl.innerHTML;
    // Split content preserving delimiters (spaces/newlines), same as original logic
    const splitContent = initialPaperContent.split(/(\s+)/);

    let currentIndex = 0;
    while (currentIndex < splitContent.length) {
      paperContentEl.innerHTML = '';

      // Binary Search para encontrar o índice máximo que cabe na página
      let low = 1;
      let high = splitContent.length - currentIndex;
      let bestFitCount = 0;

      // Se high for pequeno, talvez não precise de busca binária?
      // Mas para manter performance consistente, usamos BS.

      // Otimização: Se soubéssemos a média de palavras por página, poderíamos começar 'low' perto disso.
      // Mas vamos manter BS simples (O(log N)).

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const attemptWords = splitContent.slice(
          currentIndex,
          currentIndex + mid
        );
        const attemptString = attemptWords.join(''); // Split preserve delims, so join with empty string

        paperContentEl.innerHTML = attemptString;

        // Verifica se cabe
        if (paperContentEl.scrollHeight <= clientHeight) {
          bestFitCount = mid;
          low = mid + 1; // Tenta encaixar mais
        } else {
          high = mid - 1; // Encaixa menos
        }
      }

      // Se bestFitCount for 0, significa que uma única palavra é maior que a página (caso raro/quebrado),
      // forçamos pelo menos 1 para não entrar em loop infinito.
      if (bestFitCount === 0) bestFitCount = 1;

      // Pega o conteúdo final da página
      const pageWords = splitContent.slice(
        currentIndex,
        currentIndex + bestFitCount
      );
      let finalText = pageWords.join('');

      // Aplica hifenização no bloco que coube
      if (
        hyphenatorPtBr &&
        typeof hyphenatorPtBr.hyphenateText === 'function'
      ) {
        try {
          finalText = hyphenatorPtBr.hyphenateText(finalText);
        } catch (e) {
          console.error('Erro ao aplicar hifenização:', e);
        }
      }

      paperContentEl.innerHTML = finalText;
      pageEl.scrollTo(0, 0);

      // Libera UI antes de renderizar (pesado)
      await nextFrame();

      await convertDIVToImage();

      // Avança o índice
      currentIndex += bestFitCount;

      // Reseta para a próxima iteração (necessário para limpar estilos residuais se houver)
      paperContentEl.innerHTML = '';
    }

    // Restaura conteúdo original
    paperContentEl.innerHTML = initialPaperContent;
  } else {
    // single image logic remains mostly same
    let singlePageContent = paperContentEl.innerHTML;
    if (hyphenatorPtBr && typeof hyphenatorPtBr.hyphenateText === 'function') {
      try {
        singlePageContent = hyphenatorPtBr.hyphenateText(singlePageContent);
      } catch (e) {
        console.error('Erro ao aplicar hifenização (página única):', e);
      }
    }
    paperContentEl.innerHTML = singlePageContent;

    await nextFrame(); // Yield
    await convertDIVToImage();
  }

  console.timeEnd('Generation Time');

  removePaperStyles();
  renderOutput(outputImages);
}

/**
 * Delete all generated images
 */

export const deleteAll = () => {
  outputImages.splice(0, outputImages.length);
  renderOutput(outputImages);
  document.querySelector('#output-header').textContent =
    'Output' + (outputImages.length ? ' ( ' + outputImages.length + ' )' : '');
};

const arrayMove = (arr, oldIndex, newIndex) => {
  if (newIndex >= arr.length) {
    let k = newIndex - arr.length + 1;
    while (k--) {
      arr.push(undefined);
    }
  }
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
  return arr; // for testing
};

export const moveLeft = (index) => {
  if (index === 0) return;
  arrayMove(outputImages, index, index - 1);
  // renderOutput(outputImages); // Called by the event listener
};

export const moveRight = (index) => {
  if (index + 1 === outputImages.length) return;
  arrayMove(outputImages, index, index + 1);
  // renderOutput(outputImages); // Called by the event listener
};

/**
 * Downloads generated images as PDF
 */
export const downloadAsPDF = () => createPDF(outputImages);

// contrastImage removed as it was unused

// Event Delegation for output image controls
if (outputContainer) {
  outputContainer.addEventListener('click', (e) => {
    const target = e.target;
    const index = Number(target.dataset.index);

    if (target.matches('.output-image-container > .close-button')) {
      outputImages.splice(index, 1);
      document.querySelector('#output-header').textContent =
        'Output' +
        (outputImages.length ? ' ( ' + outputImages.length + ' )' : '');
      renderOutput(outputImages);
    } else if (target.matches('.move-left')) {
      moveLeft(index);
      renderOutput(outputImages);
    } else if (target.matches('.move-right')) {
      moveRight(index);
      renderOutput(outputImages);
    }
  });
}
