import { useEffect, useRef, useState } from "react";
import { TOKENS_COLOR } from "../shared/constantes.js";

export const Seccion = ({ titulo, children, abierta = true }) => (
  <details className="sec" open={abierta}>
    <summary>{titulo}</summary>
    <div className="sec-cuerpo">{children}</div>
  </details>
);

export const Campo = ({ etiqueta, children, ancho }) => (
  <label className="campo" style={ancho ? { gridColumn: `span ${ancho}` } : undefined}>
    {etiqueta && <span>{etiqueta}</span>}
    {children}
  </label>
);

const redond = (n) => (Number.isInteger(n) ? n : Math.round(n * 100) / 100);

export function Num({ v, onChange, min = -99999, max = 99999, paso = 1, etiqueta, ancho }) {
  const [t, setT] = useState(String(redond(v)));
  const foco = useRef(false);
  useEffect(() => { if (!foco.current) setT(String(redond(v))); }, [v]);
  return (
    <Campo etiqueta={etiqueta} ancho={ancho}>
      <input
        type="number" value={t} step={paso} min={min} max={max}
        onFocus={() => (foco.current = true)}
        onBlur={() => { foco.current = false; setT(String(redond(v))); }}
        onChange={(e) => {
          setT(e.target.value);
          const n = parseFloat(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
      />
    </Campo>
  );
}

export function Rng({ v, onChange, min = 0, max = 100, paso = 1, etiqueta, unidad = "", ancho = 2 }) {
  return (
    <Campo etiqueta={etiqueta && `${etiqueta} · ${redond(v)}${unidad}`} ancho={ancho}>
      <input type="range" value={v} min={min} max={max} step={paso} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </Campo>
  );
}

export function Sel({ v, onChange, opciones, etiqueta, ancho }) {
  return (
    <Campo etiqueta={etiqueta} ancho={ancho}>
      <select value={v} onChange={(e) => onChange(e.target.value)}>
        {opciones.map((o) => {
          const [val, nom] = Array.isArray(o) ? o : [o.id, o.nombre];
          return <option key={val} value={val}>{nom}</option>;
        })}
      </select>
    </Campo>
  );
}

export const Txt = ({ v, onChange, etiqueta, ancho = 2, placeholder }) => (
  <Campo etiqueta={etiqueta} ancho={ancho}>
    <input type="text" value={v ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </Campo>
);

export const Area = ({ v, onChange, etiqueta, filas = 4, ancho = 2 }) => (
  <Campo etiqueta={etiqueta} ancho={ancho}>
    <textarea rows={filas} value={v ?? ""} onChange={(e) => onChange(e.target.value)} />
  </Campo>
);

export const Chk = ({ v, onChange, etiqueta, ancho = 1 }) => (
  <label className="chk" style={{ gridColumn: `span ${ancho}` }}>
    <input type="checkbox" checked={!!v} onChange={(e) => onChange(e.target.checked)} />
    <span>{etiqueta}</span>
  </label>
);

export function Seg({ v, onChange, opciones, etiqueta, ancho = 2 }) {
  return (
    <div className="campo" style={{ gridColumn: `span ${ancho}` }}>
      {etiqueta && <span>{etiqueta}</span>}
      <div className="seg">
        {opciones.map(([val, nom, tip]) => (
          <button key={val} type="button" title={tip || (typeof nom === "string" ? nom : "")} className={v === val ? "on" : ""} onClick={() => onChange(val)}>
            {nom}
          </button>
        ))}
      </div>
    </div>
  );
}

const esHex = (c) => /^#[0-9a-f]{6}$/i.test(c || "");

export function Col({ v, onChange, tema, etiqueta, vacio = false, ancho = 2 }) {
  const hex = v?.[0] === "@" ? tema[v.slice(1)] : esHex(v) ? v : "#000000";
  return (
    <div className="campo" style={{ gridColumn: `span ${ancho}` }}>
      {etiqueta && <span>{etiqueta}</span>}
      <div className="colores">
        {TOKENS_COLOR.map(([tok, nom]) => (
          <button key={tok} type="button" title={nom} className={v === "@" + tok ? "on" : ""} style={{ background: tema[tok] }} onClick={() => onChange("@" + tok)} />
        ))}
        <input type="color" value={hex} title="Color personalizado" onChange={(e) => onChange(e.target.value)} />
        {vacio && <button type="button" className={`ninguno${!v ? " on" : ""}`} title="Ninguno" onClick={() => onChange("")}>∅</button>}
      </div>
    </div>
  );
}

export const Boton = ({ children, onClick, peligro, activo, titulo, deshabilitado, className = "" }) => (
  <button type="button" className={`btn${peligro ? " peligro" : ""}${activo ? " on" : ""} ${className}`} onClick={onClick} title={titulo} disabled={deshabilitado}>
    {children}
  </button>
);
