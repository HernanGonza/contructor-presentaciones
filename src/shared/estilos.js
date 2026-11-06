import { FUENTES } from "./constantes.js";

export function pilaFuente(id, deck) {
  const f = FUENTES.find((x) => x.id === id);
  if (f) return f.css;
  const u = (deck.fuentes || []).find((x) => x.id === id);
  if (u) return `"${u.nombre.replace(/"/g, "")}", system-ui, sans-serif`;
  return FUENTES[1].css;
}

// "@acento" → var(--acento); cualquier otro valor se usa tal cual (#hex, rgb…).
export const color = (c, vacio = "transparent") => (!c ? vacio : c[0] === "@" ? `var(--${c.slice(1)})` : c);

const suave = (t) => t * t * (3 - 2 * t);
const pulso = (f) => ({ r: 9 + 17 * (1 - Math.pow(1 - f, 2.2)), op: 0.42 * suave(Math.min(1, f / 0.2)) * (1 - suave(f)) });
const KEYFRAMES_LATIDO =
  "@keyframes latido{" +
  Array.from({ length: 21 }, (_, i) => {
    const { r, op } = pulso(i / 20);
    return `${i * 5}%{transform:scale(${(r / 9).toFixed(3)});opacity:${op.toFixed(3)}}`;
  }).join("") +
  "}";

// CSS dinámico de una presentación: tipografías propias, variables del tema, pulso.
export function cssDeck(deck, extra = "") {
  const t = deck.tema;
  const faces = (deck.fuentes || [])
    .map((f) => `@font-face{font-family:"${f.nombre.replace(/"/g, "")}";src:url(${f.src});font-weight:${f.peso || "100 900"};font-display:block}`)
    .join("\n");
  return `${faces}
${extra}
.tv{--fondo:${t.fondo};--fondo2:${t.fondo2};--texto:${t.texto};--acento:${t.acento};--acento2:${t.acento2};--resalte:${t.resalte};--suave:${t.suave};--f-cuerpo:${pilaFuente(t.fuente, deck)};--f-titulo:${pilaFuente(t.fuenteTitulo, deck)}}
${KEYFRAMES_LATIDO}`;
}
