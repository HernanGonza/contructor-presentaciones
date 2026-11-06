import plantilla from "../../dist-player/player.html?raw";
import { activosUsados, nombreSlide, normalizar } from "../shared/modelo.js";
import { OAK } from "./fuentesOak.js";
import { blobADataUri } from "./imagenes.js";

const MARCA = '<script id="deck-data" type="application/json">__DECK_JSON__</script>';
const RE_DATOS = /<script id="deck-data" type="application\/json">([\s\S]*?)<\/script>/;

const slug = (t) =>
  (t || "presentacion").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "presentacion";

export function descargar(contenido, nombre, tipo) {
  const url = URL.createObjectURL(contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo }));
  const a = document.createElement("a");
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// Deja solo lo que se usa (imágenes) y embebe la tipografía del ministerio si el tema la pide.
async function preparar(deck) {
  const usados = activosUsados(deck);
  const assets = Object.fromEntries(Object.entries(deck.assets).filter(([id]) => usados.has(id)));
  const fuentes = [...deck.fuentes];
  if (deck.tema.fuente === "oak" || deck.tema.fuenteTitulo === "oak") {
    for (const [peso, url] of OAK) {
      const blob = await (await fetch(url)).blob();
      fuentes.push({ id: "oak-" + peso, nombre: "Oak Sans", peso, src: await blobADataUri(blob) });
    }
  }
  return { ...deck, assets, fuentes };
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// `</script>` o `<!--` dentro del JSON romperían el HTML.
const LS = new RegExp("\\u2028", "g"), PS = new RegExp("\\u2029", "g");
const jsonSeguro = (o) => JSON.stringify(o).replace(/</g, "\\u003c").replace(LS, "\\u2028").replace(PS, "\\u2029");

export async function construirHtml(deck) {
  if (!plantilla.includes(MARCA)) throw new Error("La plantilla del reproductor no tiene el marcador de datos. Corré `npm run build:player`.");
  const d = await preparar(deck);
  return plantilla
    .replace(MARCA, () => `<script id="deck-data" type="application/json">${jsonSeguro(d)}</script>`)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(deck.titulo)}</title>`);
}

export async function exportarHtml(deck) {
  const html = await construirHtml(deck);
  descargar(html, slug(deck.titulo) + ".html", "text/html");
  return html.length;
}

export function guardarProyecto(deck) {
  const usados = activosUsados(deck);
  const d = { ...deck, assets: Object.fromEntries(Object.entries(deck.assets).filter(([id]) => usados.has(id))) };
  descargar(JSON.stringify(d), slug(deck.titulo) + ".constructor.json", "application/json");
}

export function exportarGuion(deck) {
  const md = [`# ${deck.titulo}\n`, ...deck.slides.map((s, i) => `## ${i + 1}. ${nombreSlide(s, i)}\n\n${s.notas?.trim() || "_(sin notas)_"}\n`)].join("\n");
  descargar(md, slug(deck.titulo) + "-guion.md", "text/markdown");
}

// Abre un proyecto (.json) o una presentación ya exportada (.html): el HTML lleva los datos adentro.
export async function abrirArchivo(file) {
  const txt = await file.text();
  let datos;
  if (/\.html?$/i.test(file.name) || txt.trimStart().startsWith("<")) {
    const m = txt.match(RE_DATOS);
    if (!m || m[1].includes("__DECK_JSON__")) throw new Error("Ese HTML no es una presentación exportada por el Constructor");
    datos = JSON.parse(m[1]);
  } else {
    datos = JSON.parse(txt);
  }
  return normalizar(datos);
}
