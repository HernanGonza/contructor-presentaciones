import { useCallback, useEffect, useRef, useState } from "react";
import { abrirArchivo } from "./exportar.js";
import { avisar, confirmar } from "./dialogos.jsx";
import { api, fechaCorta, guardarAutor, leerAutor } from "./api.js";
import { nuevoDeck, slideDesdePlantilla } from "../shared/modelo.js";

export const irA = (id) => { location.hash = id ? `#/p/${id}` : ""; };

export default function Inicio() {
  const [lista, setLista] = useState(null);
  const [error, setError] = useState(null);
  const [autor, setAutor] = useState(leerAutor);
  const [busca, setBusca] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const inputAbrir = useRef(null);

  const cargar = useCallback(() => api.listar().then((l) => { setLista(l); setError(null); }).catch((e) => setError(e.message)), []);
  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 15000); // ves lo que va guardando el resto del equipo
    return () => clearInterval(t);
  }, [cargar]);

  const crear = async (deck) => {
    if (!autor.trim()) { await avisar({ titulo: "¿Cómo te llamás?", texto: "Escribí tu nombre arriba a la derecha para que el equipo sepa quién edita cada presentación.", tipo: "pregunta" }); return; }
    setOcupado(true);
    try { irA((await api.crear(deck, autor)).id); }
    catch (e) { setError(e.message); setOcupado(false); }
  };
  const nueva = (conEjemplo) => {
    const d = nuevoDeck(conEjemplo);
    if (!conEjemplo) d.slides.push(slideDesdePlantilla(d, "vacia"));
    crear(d);
  };
  const importar = async (file) => {
    try { await crear(await abrirArchivo(file)); } catch (e) { avisar({ titulo: "No se pudo abrir el archivo", texto: e.message, tipo: "error" }); }
  };
  const borrar = async (p) => {
    if (!(await confirmar({ titulo: "¿Borrar la presentación?", texto: `«${p.titulo}» se elimina para todo el equipo. No se puede deshacer.`, ok: "Sí, borrar", tipo: "peligro" }))) return;
    try { await api.borrar(p.id); cargar(); } catch (e) { setError(e.message); }
  };

  const visibles = (lista || []).filter((p) => p.titulo.toLowerCase().includes(busca.toLowerCase()));
  return (
    <div className="inicio">
      <header className="ini-top">
        <div className="marca"><b>◧</b> Constructor de presentaciones</div>
        <label className="ini-autor">
          Tu nombre
          <input value={autor} placeholder="Ej: Hernán" onChange={(e) => { setAutor(e.target.value); guardarAutor(e.target.value); }} />
        </label>
      </header>

      <main className="ini-cuerpo">
        <div className="ini-barra">
          <h1>Presentaciones</h1>
          <input className="ini-busca" type="search" placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <button className="btn" onClick={() => inputAbrir.current.click()} disabled={ocupado}>Importar .json / .html…</button>
          <button className="btn" onClick={() => nueva(true)} disabled={ocupado}>Nueva con ejemplo</button>
          <button className="btn primario" onClick={() => nueva(false)} disabled={ocupado}>＋ Nueva en blanco</button>
          <input ref={inputAbrir} type="file" accept=".json,.html,.htm" hidden onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; if (f) importar(f); }} />
        </div>

        {error && <div className="ini-error">⚠ {error}. <button className="btn" onClick={cargar}>Reintentar</button></div>}
        {!lista && !error && <p className="vacio">Cargando…</p>}
        {lista && !visibles.length && <p className="vacio">{lista.length ? "Nada coincide con la búsqueda." : "Todavía no hay presentaciones. Creá la primera con «Nueva»."}</p>}

        <div className="ini-grilla">
          {visibles.map((p) => {
            const t = p.resumen?.tema || {};
            return (
              <article key={p.id} className="tarjeta" onClick={() => irA(p.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && irA(p.id)}>
                <div className="tj-portada" style={{ background: `linear-gradient(135deg, ${t.fondo || "#234131"}, ${t.fondo2 || t.fondo || "#234131"})`, color: t.texto || "#fff" }}>
                  <span className="tj-franja" style={{ background: t.acento || "#c9346c" }} />
                  <b>{p.titulo}</b>
                </div>
                <div className="tj-info">
                  <strong title={p.titulo}>{p.titulo}</strong>
                  <span>{p.resumen?.slides ?? 0} diapositivas{p.resumen?.modo === "espacio" ? " · modo espacio" : ""}</span>
                  <span>Editado {fechaCorta(p.actualizado)} por {p.editado_por || "—"}</span>
                </div>
                <button className="tj-borrar" title="Borrar" onClick={(e) => { e.stopPropagation(); borrar(p); }}>🗑</button>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
