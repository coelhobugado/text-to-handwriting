import { jsPDF } from 'jspdf';
const pageEl = document.querySelector('.page-a');
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function addFontFromFile(fileObj) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const newFont = new FontFace('temp-font', e.target.result);
    newFont
      .load()
      .then((loadedFace) => {
        document.fonts.add(loadedFace);
        pageEl.style.fontFamily = 'temp-font';
      })
      .catch((error) => {
        console.error('Erro ao carregar FontFace:', error);
        console.warn(
          'Falha ao carregar arquivo de fonte. ' +
            'A fonte pode estar inválida ou corrompida.'
        ); // TODO: Substituir por notificação de UI
      });
  };
  reader.onerror = (error) => {
    console.error('Erro do FileReader ao ler arquivo de fonte:', error);
    console.warn('Não foi possível ler o arquivo de fonte selecionado.'); // TODO: Substituir por notificação de UI
  };
  reader.readAsArrayBuffer(fileObj);
}

/**
 * @method createPDF
 * @param imgs array of images (in base64)
 * @description
 * Creates PDF from list of given images
 */
function createPDF(imgs) {
  const doc = new jsPDF('p', 'pt', 'a4');
  const width = doc.internal.pageSize.width;
  const height = doc.internal.pageSize.height;

  imgs.forEach((imgData, index) => {
    doc.text(10, 20, ''); // Esta linha parece redundante ou para um propósito não claro, mas mantenha-a se estava lá.
    doc.addImage(
      imgData, // Alterado de imgs[i]
      'JPEG',
      25,
      50,
      width - 50,
      height - 80,
      'image-' + index // Alterado de 'image-' + i
    );
    if (index !== imgs.length - 1) {
      // Alterado de i != imgs.length - 1
      doc.addPage();
    }
  });

  doc.save();
}

function formatText(event) {
  event.preventDefault();
  const text = event.clipboardData.getData('text/plain');

  const selection = window.getSelection();
  if (!selection.rangeCount) {
    console.warn('Não há seleção ou cursor para colar o texto.');
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents(); // Remove o conteúdo selecionado, se houver

  const fragment = document.createDocumentFragment();
  const lines = text.split('\n'); // Atenção à barra invertida para o split

  lines.forEach((line, index) => {
    fragment.appendChild(document.createTextNode(line));
    if (index < lines.length - 1) {
      fragment.appendChild(document.createElement('br'));
    }
  });

  range.insertNode(fragment);

  // Mover o cursor para o final do conteúdo inserido
  // É importante clonar o range e definir a posição inicial e final
  // antes de colapsar, para garantir compatibilidade.
  const newRange = range.cloneRange();
  newRange.selectNodeContents(fragment); // Seleciona o conteúdo do fragmento inserido
  newRange.collapse(false); // Colapsa para o final (false) do conteúdo selecionado
  selection.removeAllRanges(); // Limpa as seleções existentes
  selection.addRange(newRange); // Adiciona o novo range com o cursor no final
}

function addPaperFromFile(file) {
  const tmppath = URL.createObjectURL(file);
  pageEl.style.backgroundImage = `url(${tmppath})`;
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

export {
  isMobile,
  addFontFromFile,
  createPDF,
  formatText,
  addPaperFromFile,
  debounce
};
