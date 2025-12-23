/**
 * Applies a scanner-like shadow effect to the canvas.
 * Simulates uneven lighting typically seen in mobile phone scans.
 * @param {HTMLCanvasElement} canvas 
 */
export function applyScannerEffect(canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // 1. Create a Shadow Gradient (Vignette-ish)
  // Simulates light coming from top-left, casting shadow to bottom-right
  const gradient = ctx.createRadialGradient(
    width * 0.5, height * 0.5, width * 0.2, // Start circle (center, bright)
    width * 0.5, height * 0.5, width * 0.8  // End circle (edges, darker)
  );

  // 'transparent' center means no shadow (original paper color)
  // 'black' at edges with low opacity creates the darkening
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.6, 'rgba(0,0,0,0.02)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.15)');

  // 2. Apply Shadow with 'multiply' blend mode
  // This darkens the underlying paper/text without overwriting it
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 3. Reset composite operation
  ctx.globalCompositeOperation = 'source-over';

  // 4. (Optional) Add Grain/Noise for texture
  // A completely clean digital gradient looks fake. subtle noise helps.
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = width;
  noiseCanvas.height = height;
  const nCtx = noiseCanvas.getContext('2d');
  const imgData = nCtx.createImageData(width, height);
  const buffer = new Uint32Array(imgData.data.buffer);
  
  for (let i = 0; i < buffer.length; i++) {
    // Random noise: mostly transparent, occasional black specs
    if (Math.random() < 0.05) {
       // 0xAA000000 is alpha=170 (approx 0.66), black (000000) - Little Endian ABGR
       // Let's use a very faint black: Alpha 10-20
       buffer[i] = 0x10000000; 
    }
  }
  nCtx.putImageData(imgData, 0, 0);
  
  // Overlay noise
  ctx.globalAlpha = 0.08;
  ctx.drawImage(noiseCanvas, 0, 0);
  ctx.globalAlpha = 1.0;
}
