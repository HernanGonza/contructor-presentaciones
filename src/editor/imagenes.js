import { uid } from "../shared/modelo.js";

const MAX = 2400; // lado máximo al guardar (el lienzo es de 1920)

const leer = (blob) =>
  new Promise((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(r.result);
    r.onerror = () => mal(r.error);
    r.readAsDataURL(blob);
  });

const cargarImg = (src) =>
  new Promise((ok, mal) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => mal(new Error("No se pudo leer la imagen"));
    im.src = src;
  });

const aBlob = (canvas, tipo, q) => new Promise((ok) => canvas.toBlob(ok, tipo, q));

// Devuelve un asset {id, nombre, src, w, h}. Reduce y recomprime capturas enormes para que el HTML final no pese de más.
export async function procesarImagen(file) {
  const nombre = file.name.replace(/\.[^.]+$/, "") || "imagen";
  const original = await leer(file);
  const im = await cargarImg(original);
  const w = im.naturalWidth || im.width;
  const h = im.naturalHeight || im.height;
  const vectorial = /svg|gif/.test(file.type);
  if (vectorial || (file.size < 450_000 && Math.max(w, h) <= MAX)) {
    return { id: uid(), nombre, src: original, w, h };
  }
  const k = Math.min(1, MAX / Math.max(w, h));
  const cw = Math.round(w * k), ch = Math.round(h * k);
  const c = document.createElement("canvas");
  c.width = cw; c.height = ch;
  c.getContext("2d").drawImage(im, 0, 0, cw, ch);
  let blob = await aBlob(c, "image/webp", 0.9);
  if (!blob || blob.type !== "image/webp") blob = await aBlob(c, file.type === "image/png" ? "image/png" : "image/jpeg", 0.88);
  if (!blob || (blob.size >= file.size && k === 1)) return { id: uid(), nombre, src: original, w, h };
  return { id: uid(), nombre, src: await leer(blob), w: cw, h: ch };
}

export async function fuenteDesdeArchivo(file) {
  const nombre = file.name.replace(/\.[^.]+$/, "").replace(/[^\p{L}\p{N} _-]/gu, "") || "Fuente";
  return { id: "u:" + uid(), nombre, src: await leer(file) };
}

export const blobADataUri = leer;
