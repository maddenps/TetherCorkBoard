/** Downscale a picked image so boards stay small enough to keep offline. */
export async function fileToDataUrl(
  file: File,
  maxSize = 1200,
): Promise<{ dataUrl: string; ratio: number }> {
  const bitmap = await createImageBitmap(file);
  const k = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * k);
  const h = Math.round(bitmap.height * k);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.8), ratio: h / w };
}
