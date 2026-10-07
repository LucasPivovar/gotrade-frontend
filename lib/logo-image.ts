export type CropArea = { x: number; y: number; width: number; height: number };
export const fullCrop: CropArea = { x: 0, y: 0, width: 100, height: 100 };

// Remove only matching pixels connected to the edge, keeping enclosed details.
export function removeEdgeBackground(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance: number,
) {
  const corners = [0, width - 1, (height - 1) * width, width * height - 1];
  const distance = (a: number, b: number) =>
    Math.max(
      ...[0, 1, 2].map((c) => Math.abs(pixels[a * 4 + c] - pixels[b * 4 + c])),
    );
  const opaque = corners.filter((i) => pixels[i * 4 + 3] > 0);
  const sample = opaque.sort(
    (a, b) =>
      opaque.filter((i) => distance(b, i) < 20).length -
      opaque.filter((i) => distance(a, i) < 20).length,
  )[0];
  if (sample === undefined) return;
  const color = [
    pixels[sample * 4],
    pixels[sample * 4 + 1],
    pixels[sample * 4 + 2],
  ];
  const visited = new Uint8Array(width * height),
    queue = new Int32Array(width * height);
  let head = 0,
    tail = 0;
  const add = (i: number) => {
    if (visited[i]) return;
    visited[i] = 1;
    const p = i * 4;
    if (
      pixels[p + 3] === 0 ||
      Math.max(...color.map((c, j) => Math.abs(pixels[p + j] - c))) <= tolerance
    ) {
      queue[tail++] = i;
    }
  };
  for (let x = 0; x < width; x++) {
    add(x);
    add((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    add(y * width);
    add(y * width + width - 1);
  }
  while (head < tail) {
    const i = queue[head++];
    pixels[i * 4 + 3] = 0;
    const x = i % width,
      y = Math.floor(i / width);
    if (x > 0) add(i - 1);
    if (x < width - 1) add(i + 1);
    if (y > 0) add(i - width);
    if (y < height - 1) add(i + width);
  }
}

export async function renderLogo(
  source: string,
  crop: CropArea,
  removeBackground: boolean,
  tolerance: number,
) {
  const image = new Image();
  image.src = source;
  await image.decode();
  const scale = Math.min(
    1,
    1600 / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const original = document.createElement('canvas');
  original.width = Math.max(1, Math.round(image.naturalWidth * scale));
  original.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = original.getContext('2d', { willReadFrequently: true });
  if (!context) throw Error('Não foi possível abrir a imagem.');
  context.drawImage(image, 0, 0, original.width, original.height);
  if (removeBackground) {
    const data = context.getImageData(0, 0, original.width, original.height);
    removeEdgeBackground(data.data, original.width, original.height, tolerance);
    context.putImageData(data, 0, 0);
  }
  const x = (original.width * crop.x) / 100,
    y = (original.height * crop.y) / 100,
    w = Math.max(1, (original.width * crop.width) / 100),
    h = Math.max(1, (original.height * crop.height) / 100);
  const output = document.createElement('canvas');
  const limit = Math.min(1, 1024 / Math.max(w, h));
  output.width = Math.max(1, Math.round(w * limit));
  output.height = Math.max(1, Math.round(h * limit));
  output
    .getContext('2d')!
    .drawImage(original, x, y, w, h, 0, 0, output.width, output.height);
  return output;
}
export async function logoFile(canvas: HTMLCanvasElement) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) throw Error('Não foi possível processar a logo.');
    if (blob.size <= 400000)
      return new File([blob], 'logo.png', { type: 'image/png' });
    const resized = document.createElement('canvas');
    resized.width = Math.max(1, Math.round(canvas.width * 0.75));
    resized.height = Math.max(1, Math.round(canvas.height * 0.75));
    resized
      .getContext('2d')!
      .drawImage(canvas, 0, 0, resized.width, resized.height);
    canvas = resized;
  }
  throw Error('A imagem continua muito grande. Escolha uma logo mais simples.');
}
