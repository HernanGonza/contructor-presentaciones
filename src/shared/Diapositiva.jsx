import { BloqueCapas } from "./Bloque.jsx";
import { color } from "./estilos.js";

export function fondoDe(fondo = { tipo: "tema" }, deck) {
  switch (fondo.tipo) {
    case "color":
      return { background: color(fondo.color) };
    case "degradado":
      return { background: `linear-gradient(${fondo.angulo ?? 160}deg, ${color(fondo.color)}, ${color(fondo.color2)})` };
    default:
      return {
        background:
          "radial-gradient(1200px 700px at 85% 0%, color-mix(in srgb, var(--fondo2) 28%, transparent), transparent 60%)," +
          "radial-gradient(900px 600px at 0% 100%, color-mix(in srgb, var(--acento) 16%, transparent), transparent 60%)," +
          "var(--fondo)",
      };
  }
}

// Una diapositiva a tamaño real (ancho×alto del deck). fase: pre (oculta) | in (anima) | fin (estática).
export function Diapositiva({ slide, deck, n = 1, total = 1, fase = "fin", paso = 0, t0 = 0, editor = false, replay = null }) {
  const f = slide.fondo || { tipo: "tema" };
  const img = f.tipo === "imagen" && f.asset ? deck.assets[f.asset] : null;
  return (
    <div className="dia tv" style={{ width: deck.ancho, height: deck.alto, ...fondoDe(f.tipo === "imagen" ? { tipo: "tema" } : f, deck) }}>
      {img && (
        <>
          <img className="dia-fondo" src={img.src} alt="" draggable={false} style={{ objectFit: f.ajuste || "cover" }} />
          <div className="dia-velo" style={{ background: `rgba(0,0,0,${f.oscurecer ?? 0.35})` }} />
        </>
      )}
      {slide.bloques.map((b) => {
        const re = replay && replay.id === b.id;
        return (
          <BloqueCapas
            key={re ? b.id + ":" + replay.n : b.id}
            b={b}
            deck={deck}
            fase={re ? "in" : fase}
            paso={re ? 99 : paso}
            t0={re ? 0 : t0}
            editor={editor}
          />
        );
      })}
      {deck.pie.mostrar && !slide.sinPie && (deck.pie.texto || deck.pie.numero) && (
        <div className="pie">
          <span>{deck.pie.texto}</span>
          <span>{deck.pie.numero ? `${n} / ${total}` : ""}</span>
        </div>
      )}
    </div>
  );
}
