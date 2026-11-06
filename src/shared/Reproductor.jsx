import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Diapositiva } from "./Diapositiva.jsx";
import { cssDeck } from "./estilos.js";
import { pasosMax, nombreSlide } from "./modelo.js";
import { poseDeDiapositiva, poseGeneral, useCamara } from "./camara.js";

function useViewport() {
  const calc = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [v, setV] = useState(calc);
  useEffect(() => {
    const f = () => setV(calc());
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return v;
}

const clamp = (n, a, b) => Math.min(Math.max(n, a), b);

export default function Reproductor({ deck, inicio = 0, onSalir, usarHash = false, cssExtra = "" }) {
  const { slides, ancho: W, alto: H } = deck;
  const total = slides.length;
  const espacio = deck.modo === "espacio";
  const hashInicial = () => {
    if (!usarHash) return inicio;
    const n = parseInt(location.hash.slice(1), 10);
    return Number.isFinite(n) ? n - 1 : inicio;
  };

  const [i, setI] = useState(() => clamp(hashInicial(), 0, total - 1));
  const [paso, setPaso] = useState(0);
  const [prev, setPrev] = useState(null);
  const [saliendo, setSaliendo] = useState(false);
  const [trans, setTrans] = useState({ t: slides[0]?.transicion || "deslizar", d: 0.8 });
  const [notas, setNotas] = useState(false);
  const [indice, setIndice] = useState(false);
  const [general, setGeneral] = useState(false);
  const toque = useRef(null);
  const vp = useViewport();

  const ir = useCallback((n, alFinal = false) => {
    n = clamp(n, 0, total - 1);
    if (n === i) return;
    const adelante = n > i;
    const ef = adelante ? slides[n] : slides[i];
    setTrans({ t: ef.transicion || "deslizar", d: ef.duracionT ?? 0.8 });
    setPrev(i);
    setSaliendo(true);
    setI(n);
    setPaso(alFinal || !adelante ? pasosMax(slides[n]) : 0);
  }, [i, slides, total]);

  // El que sale queda visible mientras dura la transición; después se "resetea".
  useEffect(() => {
    if (prev === null) return;
    const ms = (espacio ? 0 : trans.t === "ninguna" ? 0 : trans.d * 1000) + 250;
    const id = setTimeout(() => setSaliendo(false), ms);
    return () => clearTimeout(id);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const siguiente = useCallback(() => {
    if (paso < pasosMax(slides[i])) setPaso(paso + 1);
    else ir(i + 1);
  }, [paso, i, slides, ir]);
  const anterior = useCallback(() => {
    if (paso > 0) setPaso(paso - 1);
    else ir(i - 1);
  }, [paso, i, ir]);

  useEffect(() => {
    if (usarHash) history.replaceState(null, "", `#${i + 1}`);
  }, [i, usarHash]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (["ArrowRight", "PageDown", " ", "Enter", "ArrowDown"].includes(k)) { e.preventDefault(); siguiente(); }
      else if (["ArrowLeft", "PageUp", "Backspace", "ArrowUp"].includes(k)) { e.preventDefault(); anterior(); }
      else if (k === "Home") ir(0);
      else if (k === "End") ir(total - 1);
      else if (k === "n" || k === "N") setNotas((v) => !v);
      else if (k === "g" || k === "G") setIndice((v) => !v);
      else if ((k === "o" || k === "O") && espacio) setGeneral((v) => !v);
      else if (k === "f" || k === "F") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen?.();
      } else if (k === "Escape") {
        if (indice) setIndice(false);
        else if (general) setGeneral(false);
        else onSalir?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [siguiente, anterior, ir, total, espacio, indice, general, onSalir]);

  // ── modo espacio: cámara ──
  const stageRef = useRef(null);
  const worldRef = useRef(null);
  const { fijar, volar } = useCamara(stageRef, worldRef);
  const claveAnt = useRef(null);
  useLayoutEffect(() => {
    if (!espacio) return;
    const destino = general ? poseGeneral(slides, W, H, vp.w, vp.h) : poseDeDiapositiva(slides[i], W, H, vp.w, vp.h);
    const clave = `${i}|${general}`;
    if (claveAnt.current === null || claveAnt.current === clave) fijar(destino);
    else volar(destino, deck.camara.dur * 1000, deck.camara.arco);
    claveAnt.current = clave;
  }, [espacio, i, general, vp.w, vp.h, slides, W, H]); // eslint-disable-line react-hooks/exhaustive-deps

  const css = useMemo(() => cssDeck(deck, cssExtra), [deck, cssExtra]);
  const progreso = ((i + 1) / total) * 100;
  const esc = Math.min(vp.w / W, vp.h / H);

  const gestos = {
    onTouchStart: (e) => (toque.current = e.touches[0].clientX),
    onTouchEnd: (e) => {
      if (toque.current == null) return;
      const dx = e.changedTouches[0].clientX - toque.current;
      if (Math.abs(dx) > 50) (dx < 0 ? siguiente : anterior)();
      toque.current = null;
    },
  };

  const controles = (
    <>
      <button className="nav izq" onClick={anterior} disabled={i === 0 && paso === 0} aria-label="Anterior">‹</button>
      <button className="nav der" onClick={siguiente} disabled={i === total - 1 && paso >= pasosMax(slides[i])} aria-label="Siguiente">›</button>
      <div className="ayuda">← → mover · N guion · G índice{espacio ? " · O vista general" : ""} · F pantalla completa</div>
      {onSalir && <button className="salir" onClick={onSalir}>✕ Salir (Esc)</button>}
      {notas && (
        <aside className="notas">
          <h4>Guion · {i + 1}. {nombreSlide(slides[i], i)}</h4>
          <p>{slides[i].notas || "(sin notas en esta diapositiva)"}</p>
        </aside>
      )}
      {indice && (
        <div className="indice" onClick={() => setIndice(false)}>
          <ul onClick={(e) => e.stopPropagation()}>
            {slides.map((s, k) => (
              <li key={s.id} className={k === i ? "act" : ""} onClick={() => { ir(k); setIndice(false); }}>
                <span>{k + 1}</span>{nombreSlide(s, k)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  if (espacio) {
    const t0 = deck.camara.dur * 0.6;
    return (
      <div ref={stageRef} className={`escenario tv${general ? " general" : ""}`} {...gestos}>
        <style>{css}</style>
        <div ref={worldRef} className="mundo">
          {slides.map((s, k) => {
            const e = s.espacio;
            const activa = k === i && !general;
            return (
              <div
                key={s.id}
                className="esp-hoja"
                style={{ left: e.x - W / 2, top: e.y - H / 2, width: W, height: H, transform: `rotate(${e.rot}deg) scale(${e.escala})` }}
                onClick={general ? () => { ir(k); setGeneral(false); } : undefined}
              >
                <Diapositiva slide={s} deck={deck} n={k + 1} total={total} fase={activa ? "in" : "fin"} paso={activa ? paso : 99} t0={activa ? t0 : 0} />
              </div>
            );
          })}
        </div>
        <div className="barra"><i style={{ width: `${progreso}%` }} /></div>
        {controles}
      </div>
    );
  }

  return (
    <div className="escenario tv" {...gestos}>
      <style>{css}</style>
      <div
        className="lienzo"
        data-t={trans.t}
        style={{ width: W, height: H, marginLeft: -W / 2, marginTop: -H / 2, transform: `scale(${esc})`, "--td": `${trans.t === "ninguna" ? 0 : trans.d}s` }}
      >
        {slides.map((s, k) => {
          const pos = k - i;
          const fase = k === i ? "in" : saliendo && k === prev ? "fin" : "pre";
          return (
            <section key={s.id} className="hoja" data-pos={pos < -1 ? -2 : pos > 1 ? 2 : pos} aria-hidden={pos !== 0}>
              <Diapositiva slide={s} deck={deck} n={k + 1} total={total} fase={fase} paso={k === i ? paso : k === prev ? 99 : 0} />
            </section>
          );
        })}
        <div className="barra"><i style={{ width: `${progreso}%` }} /></div>
      </div>
      {controles}
    </div>
  );
}
