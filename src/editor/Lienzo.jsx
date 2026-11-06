import { useEffect, useRef, useState } from "react";
import { Diapositiva } from "../shared/Diapositiva.jsx";
import { estiloTexto } from "../shared/Bloque.jsx";

const RAD = Math.PI / 180;

// Escucha el puntero a nivel ventana mientras dura un arrastre.
function seguir(onMove, onEnd) {
  const mv = (e) => onMove(e);
  const up = (e) => {
    window.removeEventListener("pointermove", mv);
    window.removeEventListener("pointerup", up);
    onEnd?.(e);
  };
  window.addEventListener("pointermove", mv);
  window.addEventListener("pointerup", up);
}

// Imanes: bordes y centros del bloque contra bordes y centros de la diapositiva y de los otros bloques.
function ajustar(box, dx, dy, otros, W, H, um) {
  const xs = [0, W / 2, W], ys = [0, H / 2, H];
  otros.forEach((o) => { xs.push(o.x, o.x + o.w / 2, o.x + o.w); ys.push(o.y, o.y + o.h / 2, o.y + o.h); });
  const mejor = (marcas, objetivos) => {
    let m = null;
    marcas.forEach((a) => objetivos.forEach((t) => {
      const d = t - a;
      if (Math.abs(d) <= um && (!m || Math.abs(d) < Math.abs(m.d))) m = { d, t };
    }));
    return m;
  };
  const bx = mejor([box.x + dx, box.x + box.w / 2 + dx, box.x + box.w + dx], xs);
  const by = mejor([box.y + dy, box.y + box.h / 2 + dy, box.y + box.h + dy], ys);
  const guias = [];
  if (bx) guias.push({ v: true, pos: bx.t });
  if (by) guias.push({ v: false, pos: by.t });
  return { dx: dx + (bx?.d || 0), dy: dy + (by?.d || 0), guias };
}

const MANGOS = [
  ["nw", -1, -1], ["n", 0, -1], ["ne", 1, -1],
  ["e", 1, 0], ["se", 1, 1], ["s", 0, 1], ["sw", -1, 1], ["w", -1, 0],
];

export default function Lienzo({ acc }) {
  const { deck, slide, sel, setSel, indice } = acc;
  const W = deck.ancho, H = deck.alto;
  const contRef = useRef(null);
  const lienzoRef = useRef(null);
  const [zoom, setZoom] = useState("fit");
  const [caja, setCaja] = useState({ w: 900, h: 600 });
  const [guias, setGuias] = useState([]);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setCaja({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(contRef.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => setEditando(null), [slide.id]);

  const fit = Math.max(0.1, Math.min((caja.w - 56) / W, (caja.h - 56) / H));
  const esc = zoom === "fit" ? fit : zoom;

  const aSlide = (e) => {
    const r = lienzoRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left) / esc, y: (e.clientY - r.top) / esc };
  };

  const mapear = (fn) => acc.vivo((d) => ({ ...d, slides: d.slides.map((s) => (s.id === slide.id ? { ...s, bloques: s.bloques.map(fn) } : s)) }));

  const mover = (e, b) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    let ids = sel;
    if (!sel.includes(b.id)) { ids = e.shiftKey ? [...sel, b.id] : [b.id]; setSel(ids); }
    else if (e.shiftKey) { setSel(sel.filter((i) => i !== b.id)); return; }
    if (b.bloqueado || editando === b.id) return;
    const p0 = aSlide(e);
    const orig = Object.fromEntries(slide.bloques.filter((x) => ids.includes(x.id)).map((x) => [x.id, { x: x.x, y: x.y, w: x.w, h: x.h }]));
    const rs = Object.values(orig);
    const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
    const box = { x: x0, y: y0, w: Math.max(...rs.map((r) => r.x + r.w)) - x0, h: Math.max(...rs.map((r) => r.y + r.h)) - y0 };
    const otros = slide.bloques.filter((x) => !ids.includes(x.id));
    let movido = false;
    seguir((ev) => {
      const p = aSlide(ev);
      let dx = p.x - p0.x, dy = p.y - p0.y;
      if (!movido) { if (Math.hypot(dx, dy) * esc < 3) return; movido = true; acc.marca(); }
      if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      let g = [];
      if (!ev.altKey) { const r = ajustar(box, dx, dy, otros, W, H, 8 / esc); dx = r.dx; dy = r.dy; g = r.guias; }
      setGuias(g);
      mapear((bl) => (orig[bl.id] ? { ...bl, x: Math.round(orig[bl.id].x + dx), y: Math.round(orig[bl.id].y + dy) } : bl));
    }, () => setGuias([]));
  };

  const redimensionar = (e, b, hx, hy) => {
    e.stopPropagation(); e.preventDefault();
    const p0 = aSlide(e);
    const o = { ...b };
    const c = Math.cos(b.rot * RAD), s = Math.sin(b.rot * RAD);
    const fija = b.tipo === "marcador" || b.forma === "circulo";
    let movido = false;
    seguir((ev) => {
      if (!movido) { movido = true; acc.marca(); }
      const p = aSlide(ev);
      const dx = p.x - p0.x, dy = p.y - p0.y;
      const lx = dx * c + dy * s, ly = -dx * s + dy * c;
      let nw = o.w + hx * lx, nh = o.h + hy * ly;
      if ((ev.shiftKey || fija) && hx !== 0 && hy !== 0) {
        const k = Math.max(nw / o.w, nh / o.h);
        nw = o.w * k; nh = o.h * k;
      }
      nw = Math.max(24, nw); nh = Math.max(24, nh);
      const cxl = (hx * (nw - o.w)) / 2, cyl = (hy * (nh - o.h)) / 2;
      const cx = o.x + o.w / 2 + cxl * c - cyl * s, cy = o.y + o.h / 2 + cxl * s + cyl * c;
      mapear((bl) => (bl.id === b.id ? { ...bl, x: Math.round(cx - nw / 2), y: Math.round(cy - nh / 2), w: Math.round(nw), h: Math.round(nh) } : bl));
    });
  };

  const rotar = (e, b) => {
    e.stopPropagation(); e.preventDefault();
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    let movido = false;
    seguir((ev) => {
      if (!movido) { movido = true; acc.marca(); }
      const p = aSlide(ev);
      let a = Math.atan2(p.y - cy, p.x - cx) / RAD + 90;
      if (ev.shiftKey) a = Math.round(a / 15) * 15;
      else { const r = Math.round(a / 45) * 45; if (Math.abs(a - r) < 3) a = r; }
      a = ((((a + 180) % 360) + 360) % 360) - 180;
      mapear((bl) => (bl.id === b.id ? { ...bl, rot: Math.round(a * 10) / 10 } : bl));
    });
  };

  const alSoltar = (e) => {
    e.preventDefault();
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const p = aSlide(e);
    const bajo = [...slide.bloques].reverse().find((b) => b.tipo === "imagen" && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
    acc.subirImagenes(files, p, bajo?.id);
  };

  const u = 1 / esc;
  const unico = sel.length === 1 ? slide.bloques.find((b) => b.id === sel[0]) : null;

  return (
    <div className="lz">
      <div className="lz-barra">
        <span>{Math.round(esc * 100)}%</span>
        <button onClick={() => setZoom(Math.max(0.2, +(esc - 0.1).toFixed(2)))}>−</button>
        <button onClick={() => setZoom("fit")} className={zoom === "fit" ? "on" : ""}>Ajustar</button>
        <button onClick={() => setZoom(1)}>100%</button>
        <button onClick={() => setZoom(Math.min(3, +(esc + 0.1).toFixed(2)))}>+</button>
        <span className="lz-ayuda">Doble clic: editar texto · Mayús: proporción / ángulo · Alt: sin imanes · Flechas: mover</span>
      </div>
      <div className="lz-cont" ref={contRef} onPointerDown={() => { setSel([]); setEditando(null); }}>
        <div className="lz-marco" style={{ width: W * esc, height: H * esc }}>
          <div
            ref={lienzoRef}
            className="ed-lienzo"
            style={{ width: W, height: H, transform: `scale(${esc})`, "--u": u + "px" }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={alSoltar}
          >
            <Diapositiva slide={slide} deck={deck} n={indice + 1} total={deck.slides.length} editor replay={acc.replay} />
            <div className="ed-capa">
              {slide.bloques.map((b) => {
                const activo = sel.includes(b.id);
                const edita = editando === b.id;
                return (
                  <div
                    key={b.id}
                    data-cj={b.id}
                    className={`cj${activo ? " sel" : ""}${b.bloqueado ? " lock" : ""}`}
                    style={{ left: b.x, top: b.y, width: b.w, height: b.h, transform: b.rot ? `rotate(${b.rot}deg)` : undefined }}
                    onPointerDown={(e) => mover(e, b)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (b.tipo === "texto" || b.tipo === "lista") setEditando(b.id);
                      else if (b.tipo === "imagen") acc.pedirImagen(b.id);
                    }}
                  >
                    {b.anim.disparo === "clic" && <span className="cj-paso" style={{ fontSize: 14 * u * 1.4, padding: `${2 * u}px ${8 * u}px` }}>clic {b.anim.paso}</span>}
                    {edita && b.tipo === "texto" && (
                      <textarea
                        className="cj-edit" autoFocus value={b.texto}
                        style={{ ...estiloTexto(b), display: "block", justifyContent: undefined }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onChange={(e) => acc.patchBloques([b.id], { texto: e.target.value }, "txt" + b.id)}
                        onBlur={() => setEditando(null)}
                        onKeyDown={(e) => { if (e.key === "Escape") setEditando(null); e.stopPropagation(); }}
                      />
                    )}
                    {edita && b.tipo === "lista" && (
                      <textarea
                        className="cj-edit" autoFocus value={b.items}
                        style={{ fontSize: b.tam, fontWeight: b.peso, lineHeight: 1.22, paddingLeft: "1.25em", fontFamily: "var(--f-cuerpo)", color: "var(--texto)" }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onChange={(e) => acc.patchBloques([b.id], { items: e.target.value }, "txt" + b.id)}
                        onBlur={() => setEditando(null)}
                        onKeyDown={(e) => { if (e.key === "Escape") setEditando(null); e.stopPropagation(); }}
                      />
                    )}
                    {activo && unico && unico.id === b.id && !b.bloqueado && !edita && (
                      <>
                        {MANGOS.map(([n, hx, hy]) => (
                          <i
                            key={n} className={`hd hd-${n}`}
                            style={{ left: `${(hx + 1) * 50}%`, top: `${(hy + 1) * 50}%` }}
                            onPointerDown={(e) => redimensionar(e, b, hx, hy)}
                          />
                        ))}
                        <i className="hd-rot" onPointerDown={(e) => rotar(e, b)} />
                      </>
                    )}
                  </div>
                );
              })}
              {guias.map((g, k) => (
                <div key={k} className={`guia ${g.v ? "v" : "h"}`} style={g.v ? { left: g.pos } : { top: g.pos }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
