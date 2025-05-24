import {
  applyPaperStyles,
  removePaperStyles,
  renderOutput
} from './utils/generate-utils.mjs';
import { createPDF } from './utils/helpers.mjs';

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
  const canvas = await html2canvas(pageEl, options).catch(error => {
    console.error('Erro durante a geração da imagem por html2canvas:', error);
    console.warn('Falha ao gerar imagem. Verifique o console para detalhes.'); // TODO: Substituir por uma notificação de UI não bloqueante
    // Se houvesse um indicador de "carregando" global, ele seria desativado aqui.
    throw error; // Sinaliza a falha para generateImages
  });

  // Se o canvas não foi gerado devido a um erro, não prossiga.
  if (!canvas) return;

  /** Send image data for modification if effect is scanner */
  if (document.querySelector('#page-effects').value === 'scanner') {
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    contrastImage(imageData, 0.55);
    canvas.getContext('2d').putImageData(imageData, 0, 0);
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
export async function generateImages() {
  let hyphenatorPtBr = null; // Inicializa como null
  if (typeof Hypher !== 'undefined' && typeof HypherPatternsPtBr !== 'undefined') {
    try {
      hyphenatorPtBr = new Hypher(HypherPatternsPtBr);
    } catch (e) {
      console.error("Erro ao inicializar Hypher com padrões pt-BR:", e);
      // hyphenatorPtBr permanecerá null se houver erro
    }
  } else {
    console.warn('Hypher ou padrões pt-BR (HypherPatternsPtBr) não foram carregados. A hifenização estará desativada.');
  }

  applyPaperStyles();
  pageEl.scroll(0, 0);

  const paperContentEl = document.querySelector('.page-a .paper-content');
  const scrollHeight = paperContentEl.scrollHeight;
  const clientHeight = BASE_PAGE_CONTENT_HEIGHT_PX; // height of .paper-content when there is no content

  const totalPages = Math.ceil(scrollHeight / clientHeight);

  if (totalPages > 1) {
    // For multiple pages
    if (paperContentEl.innerHTML.includes('<img')) {
      alert(
        "You're trying to generate more than one page, Images and some formatting may not work correctly with multiple images" // eslint-disable-line max-len
      );
    }
    const initialPaperContent = paperContentEl.innerHTML;
    const splitContent = initialPaperContent.split(/(\s+)/);

    // multiple images
    let wordCount = 0;
    for (let i = 0; i < totalPages; i++) {
      paperContentEl.innerHTML = '';
      const wordArray = [];
      let wordString = '';

      while (
        paperContentEl.scrollHeight <= clientHeight &&
        wordCount <= splitContent.length
      ) {
        wordString = wordArray.join(' ');
        wordArray.push(splitContent[wordCount]);
        paperContentEl.innerHTML = wordArray.join(' ');
        wordCount++;
      }
      paperContentEl.innerHTML = wordString;
      wordCount--;

      let finalTextToRender = wordString;
      if (hyphenatorPtBr && typeof hyphenatorPtBr.hyphenateText === 'function') {
        try {
          // Importante: Hypher espera texto puro. Se wordString contiver HTML,
          // esta hifenização pode não ser ideal ou pode quebrar o HTML.
          // Para uma melhor abordagem, seria necessário extrair nós de texto,
          // hifenizá-los e reconstruir. Mas para esta tarefa, vamos tentar
          // hifenizar a string diretamente, assumindo que é majoritariamente texto
          // ou HTML simples que o Hypher pode não quebrar (ele busca palavras).
          finalTextToRender = hyphenatorPtBr.hyphenateText(wordString);
        } catch (e) {
          console.error("Erro ao aplicar hifenização:", e);
          // Em caso de erro, usa o texto original não hifenizado
          finalTextToRender = wordString;
        }
      }
      paperContentEl.innerHTML = finalTextToRender; // Define o conteúdo com hifenização (ou original se falhar)

      pageEl.scrollTo(0, 0);
      await convertDIVToImage();
      paperContentEl.innerHTML = initialPaperContent; // Restaura para o conteúdo original para a próxima iteração
    }
  } else {
    // single image
    let singlePageContent = paperContentEl.innerHTML;
    if (hyphenatorPtBr && typeof hyphenatorPtBr.hyphenateText === 'function') {
      try {
        singlePageContent = hyphenatorPtBr.hyphenateText(singlePageContent);
      } catch (e) {
        console.error("Erro ao aplicar hifenização (página única):", e);
      }
    }
    paperContentEl.innerHTML = singlePageContent;

    await convertDIVToImage();
  }

  removePaperStyles();
  renderOutput(outputImages);
  // setRemoveImageListeners(); // Call removed, event delegation will handle this
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

/** Modifies image data to add contrast */

function contrastImage(imageData, contrast) {
  const data = imageData.data;
  contrast *= 255;
  const factor = (contrast + 255) / (255.01 - contrast);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = factor * (data[i] - 128) + 128;
    data[i + 1] = factor * (data[i + 1] - 128) + 128;
    data[i + 2] = factor * (data[i + 2] - 128) + 128;
  }
  return imageData;
}

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
