import { createRoot } from "react-dom/client";
import "../shared/core.css";
import Reproductor from "../shared/Reproductor.jsx";
import { normalizar } from "../shared/modelo.js";

// Los datos de la presentación viajan dentro del propio HTML (los inyecta el editor al exportar).
let deck = null;
let error = "";
try {
  deck = normalizar(JSON.parse(document.getElementById("deck-data").textContent));
} catch (e) {
  error = "Este archivo es la plantilla vacía del reproductor. Exportá una presentación desde el Constructor.";
}

createRoot(document.getElementById("root")).render(
  deck ? <Reproductor deck={deck} usarHash /> : <p style={{ color: "#fff", font: "18px system-ui", padding: 40 }}>{error}</p>
);
if (deck) document.title = deck.titulo;
