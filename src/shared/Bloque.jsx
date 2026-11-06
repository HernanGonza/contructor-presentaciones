import { CURVAS } from "./constantes.js";
import { color } from "./estilos.js";

// **palabra** → resaltada con el color de resalte del tema.
export function marcar(texto = "") {
  return texto.split("**").map((p, i) => (i % 2 ? <b key={i} className="rs">{p}</b> : p));
}

const VALIGN = { top: "flex-start", center: "center", bottom: "flex-end" };

export function estiloTexto(b) {
  return {
    fontFamily: b.fuente === "titulo" ? "var(--f-titulo)" : "var(--f-cuerpo)",
    fontSize: b.tam,
    fontWeight: b.peso,
    color: b.contorno ? "transparent" : color(b.color),
    WebkitTextStroke: b.contorno ? `${b.contorno}px ${color(b.color)}` : undefined,
    textAlign: b.align,
    lineHeight: b.alto,
    letterSpacing: b.espaciado ? `${b.espaciado}px` : undefined,
    textTransform: b.mayus ? "uppercase" : undefined,
    textShadow: b.sombra ? "0 4px 24px rgba(0,0,0,.55)" : undefined,
    justifyContent: VALIGN[b.valign] || "flex-start",
  };
}

function Forma({ b }) {
  const rel = b.relleno2 ? `linear-gradient(${b.angulo}deg, ${color(b.relleno)}, ${color(b.relleno2)})` : color(b.relleno);
  if (b.forma === "linea" || b.forma === "flecha") {
    const sw = Math.max(2, b.anchoBorde || 8);
    const hs = sw * 3.4;
    const fin = b.forma === "flecha" ? b.w - hs * 0.8 : b.w;
    return (
      <svg width={b.w} height={b.h} viewBox={`0 0 ${b.w} ${b.h}`} style={{ opacity: b.rellenoOp, overflow: "visible", display: "block" }}>
        <line x1={sw / 2} y1={b.h / 2} x2={fin} y2={b.h / 2} stroke={color(b.relleno)} strokeWidth={sw} strokeLinecap="round" />
        {b.forma === "flecha" && (
          <polygon points={`${b.w},${b.h / 2} ${b.w - hs},${b.h / 2 - hs * 0.62} ${b.w - hs},${b.h / 2 + hs * 0.62}`} fill={color(b.relleno)} />
        )}
      </svg>
    );
  }
  return (
    <div
      style={{
        width: "100%", height: "100%", background: rel, opacity: b.rellenoOp,
        borderRadius: b.forma === "circulo" ? "50%" : b.radio,
        border: b.anchoBorde ? `${b.anchoBorde}px solid ${color(b.borde)}` : undefined,
      }}
    />
  );
}

function Imagen({ b, deck, editor }) {
  const a = b.asset && deck.assets[b.asset];
  const img = a ? (
    <img src={a.src} alt="" draggable={false} style={{ objectFit: b.ajuste === "cubrir" ? "cover" : "contain", objectPosition: b.pos }} />
  ) : editor ? (
    <div className="img-vacia"><b>Imagen</b><span>Doble clic para elegir un archivo, o arrastralo hasta acá</span></div>
  ) : null;
  const sombra = b.sombra ? "0 30px 80px rgba(0,0,0,.5)" : undefined;
  if (b.marco === "navegador") {
    return (
      <div className="marco" style={{ borderRadius: Math.max(b.radio, 0), boxShadow: sombra }}>
        <div className="marco-barra"><i /><i /><i /><span>{b.tituloMarco}</span></div>
        <div className="marco-cuerpo">{img}</div>
      </div>
    );
  }
  if (b.marco === "celular") {
    return (
      <div className="celu" style={{ boxShadow: sombra }}>
        <div className="celu-isla" />
        <div className="celu-cuerpo">{img}</div>
      </div>
    );
  }
  return (
    <div className="img" style={{ borderRadius: b.radio, boxShadow: sombra, border: b.borde ? "2px solid color-mix(in srgb, var(--texto) 20%, transparent)" : undefined }}>
      {img}
    </div>
  );
}

export function Contenido({ b, deck, editor, estiloItem }) {
  switch (b.tipo) {
    case "texto":
      return <div className="txt" style={estiloTexto(b)}><div className="txt-i">{marcar(b.texto)}</div></div>;
    case "lista": {
      const items = (b.items || "").split("\n").filter((l) => l.trim() !== "");
      return (
        <ul
          className={`lst m-${b.marcador}`}
          style={{
            fontSize: b.tam, fontWeight: b.peso, color: color(b.color), gap: b.separacion,
            fontFamily: b.fuente === "titulo" ? "var(--f-titulo)" : "var(--f-cuerpo)",
            "--mc": color(b.colorMarcador), paddingLeft: 0,
          }}
        >
          {items.map((t, i) => (
            <li key={i} style={estiloItem ? estiloItem(i) : undefined}>{marcar(t)}</li>
          ))}
        </ul>
      );
    }
    case "imagen":
      return <Imagen b={b} deck={deck} editor={editor} />;
    case "forma":
      return <Forma b={b} />;
    case "tarjeta":
      return (
        <div className="tarjeta">
          {b.numero !== "" && <span className="t-num" style={{ background: color(b.colorNum) }}>{b.numero}</span>}
          <h3 style={{ fontSize: b.tamTitulo }}>{marcar(b.titulo)}</h3>
          <p style={{ fontSize: b.tamTexto }}>{marcar(b.texto)}</p>
        </div>
      );
    case "marcador":
      return (
        <div className="mk" style={{ "--mk": color(b.color), fontSize: Math.min(b.w, b.h) * 0.5 }}>
          {b.pulso && <i className="mk-aro" />}
          <span className="mk-n">{b.numero}</span>
        </div>
      );
    default:
      return null;
  }
}

// Capas: .bq (posición + giro) › .an (animación de entrada) › .bc (bucle) › contenido.
// Se separan para que las animaciones no pisen el giro del bloque.
export function BloqueCapas({ b, deck, fase, paso, t0 = 0, editor }) {
  const a = b.anim;
  const oculto = a.disparo === "clic" && paso < (+a.paso || 1);
  const f = oculto ? "pre" : fase;
  const retardo = (+a.delay || 0) + (a.disparo === "clic" ? 0 : t0);
  const curva = (CURVAS[a.curva] || CURVAS.suave).css;
  const porItem = b.tipo === "lista" && a.escalonar > 0 && a.entrada !== "ninguna";
  const anima = f === "in" && a.entrada !== "ninguna" && !porItem;
  const estiloAn = anima
    ? { animationName: `a-${a.entrada}`, animationDuration: `${a.dur}s`, animationTimingFunction: curva, animationDelay: `${retardo}s`, animationFillMode: "both" }
    : undefined;
  const estiloItem = porItem && f === "in"
    ? (i) => ({ animationName: `a-${a.entrada}`, animationDuration: `${a.dur}s`, animationTimingFunction: curva, animationDelay: `${retardo + i * a.escalonar}s`, animationFillMode: "both" })
    : undefined;
  const bucle = a.bucle && a.bucle !== "ninguno" && f !== "pre"
    ? { animationName: `b-${a.bucle}`, animationDuration: `${a.velBucle || 3}s`, animationIterationCount: "infinite", animationTimingFunction: a.bucle === "girar" ? "linear" : "ease-in-out" }
    : undefined;
  return (
    <div
      className="bq"
      data-bid={b.id}
      style={{ left: b.x, top: b.y, width: b.w, height: b.h, transform: b.rot ? `rotate(${b.rot}deg)` : undefined, opacity: b.op }}
    >
      <div className={`an${f === "pre" ? " pre" : ""}`} style={estiloAn}>
        <div className="bc" style={bucle}>
          <Contenido b={b} deck={deck} editor={editor} estiloItem={estiloItem} />
        </div>
      </div>
    </div>
  );
}
