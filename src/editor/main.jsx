import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../shared/core.css";
import "./editor.css";
import App from "./App.jsx";
import { cargarLocal } from "./db.js";
import { normalizar, nuevoDeck } from "../shared/modelo.js";

function Raiz() {
  const [deck, setDeck] = useState(undefined);
  useEffect(() => {
    cargarLocal("deck").then((v) => {
      try { setDeck(v ? normalizar(v) : nuevoDeck(true)); } catch { setDeck(nuevoDeck(true)); }
    });
  }, []);
  if (deck === undefined) return <div className="cargando">Cargando…</div>;
  return <App inicial={deck} />;
}

createRoot(document.getElementById("root")).render(<Raiz />);
