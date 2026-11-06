import { useEffect, useRef, useState } from "react";

// Diálogos estilo SweetAlert, sin dependencias. Uso (devuelven Promesas):
//   if (!(await confirmar({ titulo, texto, ok: "Borrar", tipo: "peligro" }))) return;
//   await avisar({ titulo, texto, tipo: "error" });
let emitir = null;
const abrir = (d) => new Promise((resolver) => (emitir ? emitir({ ...d, resolver }) : resolver(false)));

export const confirmar = ({ titulo, texto, ok = "Aceptar", cancelar = "Cancelar", tipo = "pregunta" }) =>
  abrir({ titulo, texto, ok, cancelar, tipo });
export const avisar = ({ titulo, texto, ok = "Entendido", tipo = "info" }) => abrir({ titulo, texto, ok, cancelar: null, tipo });

const ICONOS = { pregunta: "?", peligro: "!", error: "✕", info: "i", exito: "✓" };

export function Dialogos() {
  const [d, setD] = useState(null);
  const [saliendo, setSaliendo] = useState(false);
  const btnOk = useRef(null);
  const previo = useRef(null);

  useEffect(() => {
    emitir = (nuevo) => { previo.current = document.activeElement; setSaliendo(false); setD(nuevo); };
    return () => { emitir = null; };
  }, []);

  const cerrar = (valor) => {
    if (!d) return;
    setSaliendo(true);
    setTimeout(() => { d.resolver(valor); setD(null); setSaliendo(false); previo.current?.focus?.(); }, 140);
  };

  useEffect(() => {
    if (!d) return;
    btnOk.current?.focus();
    const f = (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cerrar(false); }
      else if (e.key === "Tab") { // el foco se queda dentro del diálogo
        const bs = [...document.querySelectorAll(".dlg button")];
        const i = bs.indexOf(document.activeElement);
        e.preventDefault();
        bs[(i + (e.shiftKey ? bs.length - 1 : 1)) % bs.length]?.focus();
      } else e.stopPropagation(); // que no se disparen atajos del editor (Supr, flechas…)
    };
    window.addEventListener("keydown", f, true);
    return () => window.removeEventListener("keydown", f, true);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  if (!d) return null;
  return (
    <div className={`dlg-fondo${saliendo ? " sale" : ""}`} onMouseDown={(e) => e.target === e.currentTarget && cerrar(false)}>
      <div className={`dlg ${d.tipo}`} role="alertdialog" aria-modal="true" aria-labelledby="dlg-t">
        <div className="dlg-ico"><span>{ICONOS[d.tipo] || "i"}</span></div>
        <h2 id="dlg-t">{d.titulo}</h2>
        {d.texto && <p>{d.texto}</p>}
        <div className="dlg-btns">
          {d.cancelar && <button className="btn" onClick={() => cerrar(false)}>{d.cancelar}</button>}
          <button ref={btnOk} className={`btn ${d.tipo === "peligro" ? "rojo" : "primario"}`} onClick={() => cerrar(true)}>{d.ok}</button>
        </div>
      </div>
    </div>
  );
}
