const pageEl = document.querySelector('.page-a');
const paperContentEl = document.querySelector('.page-a .paper-content');
const overlayEl = document.querySelector('.overlay');

let paperContentPadding;

/**
 * @typedef {string} FontName - O nome de uma fonte.
 */

/**
 * Verifica se a fonte atualmente selecionada (ou a padrão) é conhecida por ter problemas de renderização,
 * como texto cortado no topo ou desalinhamento vertical.
 *
 * Esta função utiliza uma heurística baseada em nomes de fontes problemáticas conhecidas
 * (ex: 'Homemade Apple') ou na ausência de uma fonte customizada explicitamente carregada pelo usuário.
 * Se nenhuma fonte customizada foi carregada, assume-se que a fonte padrão pode ter o mesmo problema.
 *
 * @returns {boolean} Retorna `true` se a fonte atual é considerada "problemática", `false` caso contrário.
 *
 * @warning Esta é uma solução paliativa ("hack") e pode não cobrir todas as fontes problemáticas.
 *          Pode precisar de atualização se os nomes das fontes mudarem ou novas fontes problemáticas
 *          forem identificadas.
 */
function isFontErrory() {
  // SOme fonts have padding top errors, this functions tells you if the current font has that;
  const currentHandwritingFont =
    document.body.style.getPropertyValue('--handwriting-font');
  return (
    currentHandwritingFont === '' ||
    currentHandwritingFont.includes('Homemade Apple')
  );
}

function applyPaperStyles() {
  pageEl.style.border = 'none';
  pageEl.style.overflowY = 'hidden';

  // Adding class shadows even if effect is scanner
  const effect = document.querySelector('#page-effects').value;

  if (effect === 'scanner') {
    // Para 'scanner', usamos o efeito pós-processado no Canvas (applyScannerEffect em generate-images.mjs).
    // Não aplicamos CSS overlay aqui para evitar conflitos ou duplicação.
    overlayEl.style.background = 'none';
    overlayEl.classList.remove('shadows');
  } else if (effect === 'shadows') {
    overlayEl.classList.add('shadows');
    overlayEl.style.background = `linear-gradient(${
      Math.random() * 360
    }deg, #0008, #0000)`;
  } else {
    // No Effect
    overlayEl.style.background = 'none';
    overlayEl.classList.remove('shadows');
  }

  // Hack para fontes problemáticas:
  // Se a fonte atual é conhecida por ter problemas de renderização (isFontErrory())
  // E nenhuma fonte customizada foi carregada pelo usuário (document.querySelector('#font-file').files.length < 1),
  // ajusta-se o paddingTop do elemento paperContentEl.
  // Este ajuste visa compensar o desalinhamento vertical da fonte (texto cortado no topo)
  // antes que o html2canvas capture a imagem da página.
  // O valor de ajuste (-5px) foi provavelmente determinado empiricamente (tentativa e erro visual)
  // para a fonte "Homemade Apple" e outras fontes padrão com comportamento similar.
  // Este é um ajuste específico para o processo de geração da imagem e é revertido em removePaperStyles().
  if (isFontErrory() && document.querySelector('#font-file').files.length < 1) {
    paperContentPadding =
      paperContentEl.style.paddingTop.replace(/px/g, '') || 5;
    const newPadding = Number(paperContentPadding) - 5;
    paperContentEl.style.paddingTop = `${newPadding}px`;
  }
}

function removePaperStyles() {
  pageEl.style.overflowY = 'auto';
  pageEl.style.border = '1px solid var(--elevation-background)';

  if (document.querySelector('#page-effects').value === 'scanner') {
    overlayEl.classList.remove('shadows');
  } else {
    overlayEl.classList.remove(document.querySelector('#page-effects').value);
  }
  overlayEl.style.background = ''; // Clear inline styles

  // Restaura o paddingTop original do paperContentEl se ele foi modificado anteriormente
  // para uma fonte problemática. Isso garante que a visualização na tela permaneça consistente
  // após a geração da imagem e a remoção dos estilos temporários.
  if (isFontErrory()) {
    paperContentEl.style.paddingTop = `${paperContentPadding}px`;
  }
}

function renderOutput(outputImages) {
  if (outputImages.length <= 0) {
    document.querySelector('#output').innerHTML =
      'Click "Generate Image" Button to generate new image.';
    document.querySelector('#download-as-pdf-button').classList.remove('show');
    document.querySelector('#delete-all-button').classList.remove('show');
    return;
  }

  document.querySelector('#download-as-pdf-button').classList.add('show');
  document.querySelector('#delete-all-button').classList.add('show');
  document.querySelector('#output').innerHTML = outputImages
    .map(
      (outputImageCanvas, index) => /* html */ `
    <div 
      class="output-image-container" 
      style="position: relative;display: inline-block;"
    >
      <button 
        data-index="${index}" 
        class="close-button close-${index}">
          &times;
      </button>
      <img 
        class="shadow" 
        alt="Output image ${index}" 
        src="${outputImageCanvas.toDataURL('image/jpeg')}"
      />
      <div style="text-align: center">
        <a 
          class="button download-image-button" 
          download 
          href="${outputImageCanvas.toDataURL('image/jpeg')}
        ">Download Image</a>
        <br/>
        <br/>

        <button 
          class="button move-left"
          data-index="${index}" 
        >
          Move Left
        </button>
        <button 
          class="button move-right"
          data-index="${index}" 
        >
          Move Right
        </button>
      </div>
    </div>
    `
    )
    .join('');
}

export { removePaperStyles, applyPaperStyles, renderOutput };
