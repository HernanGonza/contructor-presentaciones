import { useEffect, useRef, useState } from "react";
import { Diapositiva } from "../shared/Diapositiva.jsx";
import { poseGeneral } from "../shared/camara.js";

const RAD = Math.PI / 180;

function seguir(onMove, onEnd) {
  const up = (e) => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", up); onEnd?.(e); };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", up);
}

// Mapa del espacio: se arrastran, escalan y rotan las diapositivas sobre un lienzo infinito.
export default function EspacioEditor({ acc }) {
  const { deck, slide } = acc;
  const W = deck.ancho, H = deck.alto;
  const ref = useRef(null);
  const [v, setV] = useState({ tx: 0, ty: 0, z: 0.1 });
  const vRef = useRef(v);
  vRef.current = v;
  const [caja, setCaja] = useState(null);

  const verTodo = () => {
    const el = ref.current;
    if (!el) return;
    const p = poseGeneral(deck.slides, W, H, el.clientWidth, el.clientHeight);
    setV({ z: p.z, tx: el.clientWidth / 2 - p.cx * p.z, ty: el.clientHeight / 2 - p.cy * p.z });
  };
  useEffect(() => {
    const el = ref.current;
    setCaja({ w: el.clientWidth, h: el.clientHeight });
    verTodo();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = ref.current;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const { tx, ty, z } = vRef.current;
      const nz = Math.min(2, Math.max(0.01, z * Math.exp(-e.deltaY * 0.0015)));
      const k = nz / z;
      setV({ z: nz, tx: mx - (mx - tx) * k, ty: my - (my - ty) * k });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const aMundo = (e) => {
    const r = ref.current.getBoundingClientRect();
    return { x: (e.clientX - r.left - vRef.current.tx) / vRef.current.z, y: (e.clientY - r.top - vRef.current.ty) / vRef.current.z };
  };
  const setEsp = (id, patch) =>
    acc.vivo((d) => ({ ...d, slides: d.slides.map((s) => (s.id === id ? { ...s, espacio: { ...s.espacio, ...patch(s.espacio) } } : s)) }));

  const panear = (e) => {
    if (e.target.closest("[data-esp]")) return;
    const x0 = e.clientX, y0 = e.clientY, { tx, ty } = vRef.current;
    let movido = false;
    seguir((ev) => {
      movido = true;
      setV((o) => ({ ...o, tx: tx + ev.clientX - x0, ty: ty + ev.clientY - y0 }));
    });
    void movido;
  };

  const moverSlide = (e, s, k) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    acc.irASlide(s.id);
    const p0 = aMundo(e), o = { ...s.espacio };
    let movido = false;
    seguir((ev) => {
      const p = aMundo(ev);
      const dx = p.x - p0.x, dy = p.y - p0.y;
      if (!movido) { if (Math.hypot(dx, dy) * vRef.current.z < 3) return; movido = true; acc.marca(); }
      setEsp(s.id, () => ({ x: Math.round(o.x + dx), y: Math.round(o.y + dy) }));
    });
  };

  const escalar = (e, s) => {
    e.stopPropagation(); e.preventDefault();
    const c = s.espacio, base = Math.hypot(W, H) / 2;
    let movido = false;
    seguir((ev) => {
      if (!movido) { movido = true; acc.marca(); }
      const p = aMundo(ev);
      setEsp(s.id, () => ({ escala: Math.round(Math.min(20, Math.max(0.1, Math.hypot(p.x - c.x, p.y - c.y) / base)) * 100) / 100 }));
    });
  };

  const rotar = (e, s) => {
    e.stopPropagation(); e.preventDefault();
    const c = s.espacio;
    let movido = false;
    seguir((ev) => {
      if (!movido) { movido = true; acc.marca(); }
      const p = aMundo(ev);
      let a = Math.atan2(p.y - c.y, p.x - c.x) / RAD + 90;
      if (ev.shiftKey) a = Math.round(a / 15) * 15;
      else { const r = Math.round(a / 45) * 45; if (Math.abs(a - r) < 4) a = r; }
      setEsp(s.id, () => ({ rot: Math.round((((a + 180) % 360) + 360) % 360 * 10) / 10 - 180 }));
    });
  };

  const { tx, ty, z } = v;
  const ruta = deck.slides.map((s) => `${s.espacio.x},${s.espacio.y}`).join(" ");

  return (
    <div className="lz">
      <div className="lz-barra">
        <button onClick={verTodo}>Ver todo</button>
        <button onClick={() => acc.distribuir("fila")}>En fila</button>
        <button onClick={() => acc.distribuir("grilla")}>En cuadrícula</button>
        <button onClick={() => acc.distribuir("circulo")}>En círculo</button>
        <span className="lz-ayuda">Arrastrá el fondo para moverte · rueda: zoom · esquina: escala · círculo superior: rotar · doble clic: editar</span>
      </div>
      <div className="esp" ref={ref} onPointerDown={(e) => { panear(e); if (!e.target.closest("[data-esp]")) {} }}>
        {caja && (
          <div className="esp-mundo tv" style={{ transform: `translate(${tx}px, ${ty}px) scale(${z})` }}>
            <svg className="esp-ruta" width="1" height="1" style={{ overflow: "visible" }}>
              <polyline points={ruta} fill="none" stroke="var(--acento, #c9346c)" strokeWidth={4 / z} strokeDasharray={`${14 / z} ${10 / z}`} strokeLinecap="round" />
            </svg>
            {deck.slides.map((s, k) => {
              const e = s.espacio;
              const activo = s.id === slide.id;
              const hs = 18 / (z * e.escala);
              return (
                <div
                  key={s.id}
                  data-esp={s.id}
                  className={`esp-s${activo ? " sel" : ""}`}
                  style={{ left: e.x - W / 2, top: e.y - H / 2, width: W, height: H, transform: `rotate(${e.rot}deg) scale(${e.escala})`, outlineWidth: (activo ? 4 : 2) / (z * e.escala) }}
                  onPointerDown={(ev) => moverSlide(ev, s, k)}
                  onDoubleClick={() => acc.editarSlide(s.id)}
                >
                  <div style={{ pointerEvents: "none" }}>
                    <Diapositiva slide={s} deck={deck} n={k + 1} total={deck.slides.length} />
                  </div>
                  <div className="esp-n" style={{ fontSize: Math.min(400, Math.max(60, 26 / (z * e.escala))) }}>{k + 1}</div>
                  {activo && (
                    <>
                      <i className="esp-h esp-esc" style={{ width: hs, height: hs, right: -hs / 2, bottom: -hs / 2 }} onPointerDown={(ev) => escalar(ev, s)} />
                      <i className="esp-h esp-rot" style={{ width: hs, height: hs, left: "50%", top: -hs * 2.4, marginLeft: -hs / 2 }} onPointerDown={(ev) => rotar(ev, s)} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
