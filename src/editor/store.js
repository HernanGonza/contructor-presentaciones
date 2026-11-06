import { useCallback, useReducer, useRef } from "react";

const MAX_HIST = 80;

function reducer(s, a) {
  switch (a.t) {
    case "set": {
      const pres = a.fn(s.pres);
      if (pres === s.pres) return s;
      return a.push ? { pres, pasado: [...s.pasado.slice(-MAX_HIST), s.pres], futuro: [] } : { ...s, pres };
    }
    case "marca":
      return { ...s, pasado: [...s.pasado.slice(-MAX_HIST), s.pres], futuro: [] };
    case "undo":
      return s.pasado.length ? { pres: s.pasado[s.pasado.length - 1], pasado: s.pasado.slice(0, -1), futuro: [s.pres, ...s.futuro] } : s;
    case "redo":
      return s.futuro.length ? { pres: s.futuro[0], pasado: [...s.pasado, s.pres], futuro: s.futuro.slice(1) } : s;
    case "cargar":
      return { pres: a.deck, pasado: [], futuro: [] };
    default:
      return s;
  }
}

// Estado del documento con deshacer/rehacer. `clave` agrupa ediciones seguidas (tipear, arrastrar un slider) en un solo paso.
export function useDeck(inicial) {
  const [s, d] = useReducer(reducer, inicial, (deck) => ({ pres: deck, pasado: [], futuro: [] }));
  const ult = useRef({ clave: null, t: 0 });
  const cambiar = useCallback((fn, clave) => {
    const ahora = Date.now();
    const push = !(clave && ult.current.clave === clave && ahora - ult.current.t < 1000);
    ult.current = { clave, t: ahora };
    d({ t: "set", fn, push });
  }, []);
  const vivo = useCallback((fn) => d({ t: "set", fn, push: false }), []);
  const marca = useCallback(() => d({ t: "marca" }), []);
  const undo = useCallback(() => { ult.current = { clave: null, t: 0 }; d({ t: "undo" }); }, []);
  const redo = useCallback(() => { ult.current = { clave: null, t: 0 }; d({ t: "redo" }); }, []);
  const cargar = useCallback((deck) => d({ t: "cargar", deck }), []);
  return { deck: s.pres, cambiar, vivo, marca, undo, redo, cargar, puedeUndo: s.pasado.length > 0, puedeRedo: s.futuro.length > 0 };
}
