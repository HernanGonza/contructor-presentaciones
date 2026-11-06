import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../shared/core.css";
import "./editor.css";
import App from "./App.jsx";
import Inicio, { irA } from "./Inicio.jsx";
import { api } from "./api.js";
import { normalizar } from "../shared/modelo.js";

const idDeHash = () => (location.hash.match(/^#\/p\/([0-9a-f-]{36})$/) || [])[1] || null;

function Editor({ id }) {
  const [est, setEst] = useState({ cargando: true });
  useEffect(() => {
    let vivo = true;
    setEst({ cargando: true });
    api.obtener(id)
      .then((p) => { if (vivo) setEst({ deck: normalizar(p.deck), version: p.version }); })
      .catch((e) => { if (vivo) setEst({ error: e.status === 404 ? "Esa presentación no existe (¿la borraron?)" : e.message }); });
    return () => { vivo = false; };
  }, [id]);
  if (est.cargando) return <div className="cargando">Cargando…</div>;
  if (est.error) return <div className="cargando"><div>⚠ {est.error}<br /><br /><button className="btn" onClick={() => irA(null)}>← Volver a las presentaciones</button></div></div>;
  return <App key={id} id={id} inicial={est.deck} versionInicial={est.version} onInicio={() => irA(null)} />;
}

function Raiz() {
  const [id, setId] = useState(idDeHash);
  useEffect(() => {
    const f = () => setId(idDeHash());
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return id ? <Editor id={id} /> : <Inicio />;
}

createRoot(document.getElementById("root")).render(<Raiz />);
