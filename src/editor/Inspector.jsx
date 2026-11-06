import { useRef } from "react";
import { BUCLES, CURVAS, ENTRADAS, FORMATOS, FUENTES, MARCADORES, PESOS, TEMAS, TRANSICIONES } from "../shared/constantes.js";
import { Area, Boton, Chk, Col, Num, Rng, Sel, Seccion, Seg, Txt } from "./campos.jsx";
import { nombreSlide } from "../shared/modelo.js";

const TIPOS = { texto: "Texto", lista: "Lista", imagen: "Imagen", forma: "Forma", tarjeta: "Tarjeta", marcador: "Marcador" };

// ─────────────────────────── Pestaña: bloque ───────────────────────────
function PropsTipo({ b, acc, p }) {
  const t = acc.deck.tema;
  const fuentes = [["cuerpo", "Cuerpo"], ["titulo", "Títulos"]];
  const pesos = PESOS.map(([v, n]) => [String(v), n]);
  switch (b.tipo) {
    case "texto":
      return (
        <Seccion titulo="Texto">
          <Area v={b.texto} onChange={(v) => p({ texto: v })} filas={4} etiqueta="Contenido (**así** se resalta)" />
          <Num etiqueta="Tamaño" v={b.tam} min={8} max={700} onChange={(v) => p({ tam: v })} />
          <Sel etiqueta="Grosor" v={String(b.peso)} opciones={pesos} onChange={(v) => p({ peso: +v })} />
          <Seg etiqueta="Alineación" v={b.align} onChange={(v) => p({ align: v })} opciones={[["left", "Izq."], ["center", "Centro"], ["right", "Der."]]} />
          <Seg etiqueta="Vertical" v={b.valign} onChange={(v) => p({ valign: v })} opciones={[["top", "Arriba"], ["center", "Centro"], ["bottom", "Abajo"]]} />
          <Sel etiqueta="Tipografía" v={b.fuente} opciones={fuentes} onChange={(v) => p({ fuente: v })} />
          <Num etiqueta="Interlineado" v={b.alto} min={0.7} max={3} paso={0.05} onChange={(v) => p({ alto: v })} />
          <Col etiqueta="Color" v={b.color} tema={t} onChange={(v) => p({ color: v })} />
          <Num etiqueta="Espaciado letras" v={b.espaciado} min={-10} max={40} onChange={(v) => p({ espaciado: v })} />
          <Num etiqueta="Solo contorno (px)" v={b.contorno} min={0} max={30} onChange={(v) => p({ contorno: v })} />
          <Chk etiqueta="MAYÚSCULAS" v={b.mayus} onChange={(v) => p({ mayus: v })} />
          <Chk etiqueta="Sombra" v={b.sombra} onChange={(v) => p({ sombra: v })} />
          <Boton onClick={() => acc.ajustarAlto(b.id)}>Ajustar alto al texto</Boton>
        </Seccion>
      );
    case "lista":
      return (
        <Seccion titulo="Lista">
          <Area v={b.items} onChange={(v) => p({ items: v })} filas={5} etiqueta="Un punto por línea" />
          <Num etiqueta="Tamaño" v={b.tam} min={8} max={300} onChange={(v) => p({ tam: v })} />
          <Sel etiqueta="Grosor" v={String(b.peso)} opciones={pesos} onChange={(v) => p({ peso: +v })} />
          <Sel etiqueta="Marcador" v={b.marcador} opciones={MARCADORES} onChange={(v) => p({ marcador: v })} />
          <Num etiqueta="Separación" v={b.separacion} min={0} max={200} onChange={(v) => p({ separacion: v })} />
          <Col etiqueta="Color del texto" v={b.color} tema={t} onChange={(v) => p({ color: v })} />
          <Col etiqueta="Color del marcador" v={b.colorMarcador} tema={t} onChange={(v) => p({ colorMarcador: v })} />
          <Sel etiqueta="Tipografía" v={b.fuente} opciones={fuentes} onChange={(v) => p({ fuente: v })} ancho={2} />
        </Seccion>
      );
    case "imagen": {
      const a = acc.deck.assets[b.asset];
      return (
        <Seccion titulo="Imagen">
          <Boton onClick={() => acc.pedirImagen(b.id)}>{a ? "Cambiar imagen…" : "Elegir imagen…"}</Boton>
          {Object.keys(acc.deck.assets).length > 0 && (
            <Sel etiqueta="De la biblioteca" v={b.asset || ""} onChange={(v) => p({ asset: v || null })}
              opciones={[["", "— ninguna —"], ...Object.values(acc.deck.assets).map((x) => [x.id, x.nombre])]} />
          )}
          <Sel etiqueta="Ajuste" v={b.ajuste} onChange={(v) => p({ ajuste: v })} opciones={[["cubrir", "Cubrir (recorta)"], ["contener", "Contener (entera)"]]} />
          <Sel etiqueta="Encuadre" v={b.pos} onChange={(v) => p({ pos: v })} opciones={[["top", "Arriba"], ["center", "Centro"], ["bottom", "Abajo"]]} />
          <Sel etiqueta="Marco" v={b.marco} onChange={(v) => p({ marco: v })} opciones={[["ninguno", "Sin marco"], ["navegador", "Ventana de navegador"], ["celular", "Celular"]]} />
          {b.marco === "navegador" && <Txt etiqueta="Texto de la barra" v={b.tituloMarco} onChange={(v) => p({ tituloMarco: v })} />}
          {b.marco === "ninguno" && <Num etiqueta="Redondeo" v={b.radio} min={0} max={400} onChange={(v) => p({ radio: v })} />}
          <Chk etiqueta="Sombra" v={b.sombra} onChange={(v) => p({ sombra: v })} />
          {b.marco === "ninguno" && <Chk etiqueta="Borde" v={b.borde} onChange={(v) => p({ borde: v })} />}
          {a && <Boton onClick={() => acc.patchBloques([b.id], { h: Math.round((b.w * a.h) / a.w) })}>Ajustar proporción</Boton>}
        </Seccion>
      );
    }
    case "forma":
      return (
        <Seccion titulo="Forma">
          <Sel etiqueta="Tipo" v={b.forma} onChange={(v) => p({ forma: v })} opciones={[["rect", "Rectángulo"], ["circulo", "Círculo"], ["linea", "Línea"], ["flecha", "Flecha"]]} />
          <Col etiqueta="Relleno / trazo" v={b.relleno} tema={t} onChange={(v) => p({ relleno: v })} />
          <Num etiqueta="Opacidad (0–1)" v={b.rellenoOp} min={0} max={1} paso={0.05} onChange={(v) => p({ rellenoOp: v })} />
          {(b.forma === "linea" || b.forma === "flecha") ? (
            <Num etiqueta="Grosor" v={b.anchoBorde || 8} min={2} max={80} onChange={(v) => p({ anchoBorde: v })} />
          ) : (
            <>
              <Col etiqueta="Degradado hacia…" v={b.relleno2} tema={t} vacio onChange={(v) => p({ relleno2: v })} />
              {b.relleno2 && <Num etiqueta="Ángulo" v={b.angulo} min={0} max={360} onChange={(v) => p({ angulo: v })} />}
              <Col etiqueta="Borde" v={b.borde} tema={t} onChange={(v) => p({ borde: v })} />
              <Num etiqueta="Ancho de borde" v={b.anchoBorde} min={0} max={60} onChange={(v) => p({ anchoBorde: v })} />
              {b.forma === "rect" && <Num etiqueta="Redondeo" v={b.radio} min={0} max={1000} onChange={(v) => p({ radio: v })} />}
            </>
          )}
        </Seccion>
      );
    case "tarjeta":
      return (
        <Seccion titulo="Tarjeta">
          <Txt etiqueta="Número (vacío = sin círculo)" v={b.numero} onChange={(v) => p({ numero: v })} />
          <Txt etiqueta="Título" v={b.titulo} onChange={(v) => p({ titulo: v })} />
          <Area etiqueta="Texto" v={b.texto} filas={4} onChange={(v) => p({ texto: v })} />
          <Num etiqueta="Tamaño título" v={b.tamTitulo} min={10} max={200} onChange={(v) => p({ tamTitulo: v })} />
          <Num etiqueta="Tamaño texto" v={b.tamTexto} min={10} max={200} onChange={(v) => p({ tamTexto: v })} />
          <Col etiqueta="Color del círculo" v={b.colorNum} tema={t} onChange={(v) => p({ colorNum: v })} />
        </Seccion>
      );
    case "marcador":
      return (
        <Seccion titulo="Marcador">
          <Txt etiqueta="Número / símbolo" v={b.numero} onChange={(v) => p({ numero: v })} ancho={1} />
          <Chk etiqueta="Anillo pulsante" v={b.pulso} onChange={(v) => p({ pulso: v })} />
          <Col etiqueta="Color" v={b.color} tema={t} onChange={(v) => p({ color: v })} />
        </Seccion>
      );
    default:
      return null;
  }
}

function TabBloque({ acc }) {
  const { slide, sel, deck } = acc;
  const bs = slide.bloques.filter((b) => sel.includes(b.id));
  if (!bs.length)
    return <p className="vacio">Elegí un bloque del lienzo (o agregá uno desde la barra de arriba) para editarlo.</p>;
  const b = bs[0];
  const un = bs.length === 1;
  const p = (patch) => acc.patchBloques(sel, patch, "p" + Object.keys(patch).join() + sel.join());
  return (
    <>
      <div className="enc">
        <b>{un ? TIPOS[b.tipo] : `${bs.length} bloques`}</b>
        {un && <input className="nom" placeholder="Nombre (opcional)" value={b.nombre} onChange={(e) => p({ nombre: e.target.value })} />}
      </div>

      <Seccion titulo="Posición y tamaño">
        {un ? (
          <>
            <Num etiqueta="X" v={b.x} onChange={(v) => p({ x: v })} />
            <Num etiqueta="Y" v={b.y} onChange={(v) => p({ y: v })} />
            <Num etiqueta="Ancho" v={b.w} min={8} onChange={(v) => p({ w: v })} />
            <Num etiqueta="Alto" v={b.h} min={8} onChange={(v) => p({ h: v })} />
            <Num etiqueta="Giro (°)" v={b.rot} min={-180} max={180} onChange={(v) => p({ rot: v })} />
            <Rng etiqueta="Opacidad" v={Math.round(b.op * 100)} unidad="%" ancho={1} onChange={(v) => p({ op: v / 100 })} />
          </>
        ) : (
          <Rng etiqueta="Opacidad" v={Math.round(b.op * 100)} unidad="%" onChange={(v) => p({ op: v / 100 })} />
        )}
        <div className="campo" style={{ gridColumn: "span 2" }}>
          <span>Alinear en la diapositiva</span>
          <div className="seg">
            {[["izq", "⇤"], ["ch", "↔"], ["der", "⇥"], ["arr", "⤒"], ["cv", "↕"], ["aba", "⤓"]].map(([k, g]) => (
              <button key={k} title={{ izq: "Izquierda", ch: "Centro horizontal", der: "Derecha", arr: "Arriba", cv: "Centro vertical", aba: "Abajo" }[k]} onClick={() => acc.alinear(k)}>{g}</button>
            ))}
          </div>
        </div>
        {!un && bs.length > 2 && (
          <div className="campo" style={{ gridColumn: "span 2" }}>
            <span>Distribuir</span>
            <div className="seg">
              <button onClick={() => acc.alinear("dh")}>Horizontal</button>
              <button onClick={() => acc.alinear("dv")}>Vertical</button>
            </div>
          </div>
        )}
      </Seccion>

      {un && <PropsTipo b={b} acc={acc} p={p} />}

      <Seccion titulo="Capa y acciones">
        <div className="fila2">
          <Boton onClick={() => acc.orden("frente")}>Al frente</Boton>
          <Boton onClick={() => acc.orden("sube")}>Subir</Boton>
          <Boton onClick={() => acc.orden("baja")}>Bajar</Boton>
          <Boton onClick={() => acc.orden("fondo")}>Al fondo</Boton>
        </div>
        <div className="fila2">
          <Boton onClick={() => acc.duplicar(sel)}>Duplicar</Boton>
          <Boton activo={b.bloqueado} onClick={() => p({ bloqueado: !b.bloqueado })}>{b.bloqueado ? "Desbloquear" : "Bloquear"}</Boton>
          <Boton peligro onClick={() => acc.eliminar(sel)}>Eliminar</Boton>
        </div>
      </Seccion>
    </>
  );
}

// ─────────────────────────── Pestaña: animación ───────────────────────────
function TabAnim({ acc }) {
  const { slide, sel } = acc;
  const bs = slide.bloques.filter((b) => sel.includes(b.id));
  if (!bs.length)
    return (
      <>
        <p className="vacio">Elegí un bloque para definir cómo aparece.</p>
        <Seccion titulo="Toda la diapositiva">
          <Num etiqueta="Segundos entre bloques" v={acc.pasoCascada} min={0.02} max={2} paso={0.05} onChange={acc.setPasoCascada} />
          <Boton onClick={() => acc.cascada(acc.pasoCascada)}>Escalonar en el orden de las capas</Boton>
        </Seccion>
      </>
    );
  const b = bs[0], a = b.anim;
  const pa = (patch) => acc.patchBloques(sel, (bl) => ({ ...bl, anim: { ...bl.anim, ...patch } }), "a" + Object.keys(patch).join() + sel.join());
  return (
    <>
      <div className="enc">
        <b>Animación · {bs.length > 1 ? `${bs.length} bloques` : TIPOS[b.tipo]}</b>
        <Boton onClick={() => acc.probar(b.id)}>▶ Probar</Boton>
      </div>
      <Seccion titulo="Entrada">
        <Sel etiqueta="Efecto" v={a.entrada} opciones={ENTRADAS} onChange={(v) => pa({ entrada: v })} />
        <Num etiqueta="Duración (s)" v={a.dur} min={0.1} max={20} paso={0.1} onChange={(v) => pa({ dur: v })} />
        <Num etiqueta="Retraso (s)" v={a.delay} min={0} max={60} paso={0.05} onChange={(v) => pa({ delay: v })} />
        <Sel etiqueta="Curva" v={a.curva} opciones={Object.entries(CURVAS).map(([id, c]) => [id, c.nombre])} onChange={(v) => pa({ curva: v })} />
        <Seg etiqueta="Cuándo aparece" v={a.disparo} onChange={(v) => pa({ disparo: v })} opciones={[["auto", "Al entrar a la diapositiva"], ["clic", "Con un clic / tecla"]]} />
        {a.disparo === "clic" && <Num etiqueta="N.º de clic" v={a.paso} min={1} max={30} onChange={(v) => pa({ paso: v })} />}
        {b.tipo === "lista" && <Num etiqueta="Entre ítems (s)" v={a.escalonar} min={0} max={5} paso={0.05} onChange={(v) => pa({ escalonar: v })} />}
      </Seccion>
      <Seccion titulo="Movimiento continuo">
        <Sel etiqueta="Bucle" v={a.bucle} opciones={BUCLES} onChange={(v) => pa({ bucle: v })} />
        {a.bucle !== "ninguno" && <Num etiqueta="Vuelta cada (s)" v={a.velBucle} min={0.3} max={60} paso={0.1} onChange={(v) => pa({ velBucle: v })} />}
      </Seccion>
      <p className="nota">Los bloques con el mismo «N.º de clic» aparecen juntos. En la presentación, la flecha → primero revela los clics y después pasa de diapositiva.</p>
    </>
  );
}

// ─────────────────────────── Pestaña: diapositiva ───────────────────────────
function TabSlide({ acc }) {
  const { slide, deck, indice } = acc;
  const f = slide.fondo || { tipo: "tema" };
  const t = deck.tema;
  const ps = (patch) => acc.patchSlide(patch, "s" + Object.keys(patch).join());
  const pf = (patch) => ps({ fondo: { ...f, ...patch } });
  const fondoRef = useRef(null);
  const cambiarTipoFondo = (v) => {
    const nuevos = {
      tema: { tipo: "tema" },
      color: { tipo: "color", color: "@fondo" },
      degradado: { tipo: "degradado", color: "@fondo", color2: "@acento", angulo: 160 },
      imagen: { ...f, tipo: "imagen", oscurecer: f.oscurecer ?? 0.35, asset: f.asset || null },
    };
    ps({ fondo: nuevos[v] });
  };
  return (
    <>
      <div className="enc"><b>Diapositiva {indice + 1}</b></div>
      <Seccion titulo="General">
        <Txt etiqueta="Nombre (para el índice)" v={slide.nombre} placeholder={nombreSlide({ ...slide, nombre: "" }, indice)} onChange={(v) => ps({ nombre: v })} />
        <Chk etiqueta="Ocultar pie de página" v={slide.sinPie} onChange={(v) => ps({ sinPie: v })} ancho={2} />
      </Seccion>

      <Seccion titulo="Fondo">
        <Sel etiqueta="Tipo" v={f.tipo} onChange={cambiarTipoFondo}
            opciones={[["tema", "Del tema"], ["color", "Color liso"], ["degradado", "Degradado"], ["imagen", "Imagen"]]} />
        {f.tipo === "color" && <Col etiqueta="Color" v={f.color} tema={t} onChange={(v) => pf({ color: v })} />}
        {f.tipo === "degradado" && (
          <>
            <Col etiqueta="Desde" v={f.color} tema={t} onChange={(v) => pf({ color: v })} />
            <Col etiqueta="Hasta" v={f.color2} tema={t} onChange={(v) => pf({ color2: v })} />
            <Num etiqueta="Ángulo" v={f.angulo} min={0} max={360} onChange={(v) => pf({ angulo: v })} />
          </>
        )}
        {f.tipo === "imagen" && (
          <>
            <Boton onClick={() => acc.pedirImagenFondo()}>{f.asset ? "Cambiar imagen…" : "Elegir imagen…"}</Boton>
            {Object.keys(deck.assets).length > 0 && (
              <Sel etiqueta="De la biblioteca" v={f.asset || ""} onChange={(v) => pf({ asset: v || null })} opciones={[["", "— ninguna —"], ...Object.values(deck.assets).map((x) => [x.id, x.nombre])]} />
            )}
            <Rng etiqueta="Oscurecer" v={Math.round((f.oscurecer ?? 0.35) * 100)} unidad="%" onChange={(v) => pf({ oscurecer: v / 100 })} />
            <Sel etiqueta="Ajuste" v={f.ajuste || "cover"} onChange={(v) => pf({ ajuste: v })} opciones={[["cover", "Cubrir"], ["contain", "Contener"]]} />
          </>
        )}
        <span ref={fondoRef} />
      </Seccion>

      {deck.modo === "diapositivas" ? (
        <Seccion titulo="Transición al llegar">
          <Sel etiqueta="Efecto" v={slide.transicion} opciones={TRANSICIONES} onChange={(v) => ps({ transicion: v })} />
          <Num etiqueta="Duración (s)" v={slide.duracionT} min={0.1} max={5} paso={0.1} onChange={(v) => ps({ duracionT: v })} />
          <Boton onClick={() => acc.reproducirDesde(Math.max(0, indice - 1))}>▶ Ver transición</Boton>
          <Boton onClick={() => acc.aplicarTransicionATodas()}>Usar en todas</Boton>
        </Seccion>
      ) : (
        <Seccion titulo="Posición en el espacio">
          <Num etiqueta="X" v={slide.espacio.x} onChange={(v) => acc.patchEspacio({ x: v })} />
          <Num etiqueta="Y" v={slide.espacio.y} onChange={(v) => acc.patchEspacio({ y: v })} />
          <Num etiqueta="Escala" v={slide.espacio.escala} min={0.1} max={20} paso={0.1} onChange={(v) => acc.patchEspacio({ escala: v })} />
          <Num etiqueta="Giro (°)" v={slide.espacio.rot} min={-180} max={180} onChange={(v) => acc.patchEspacio({ rot: v })} />
          <p className="nota">Se acomoda más fácil en la vista «Mapa del espacio». La cámara vuela entre diapositivas en el orden de la lista.</p>
        </Seccion>
      )}

      <Seccion titulo={`Capas (${slide.bloques.length})`}>
        <ul className="capas">
          {[...slide.bloques].reverse().map((b) => (
            <li key={b.id} className={acc.sel.includes(b.id) ? "on" : ""} onClick={(e) => acc.setSel(e.shiftKey ? [...new Set([...acc.sel, b.id])] : [b.id])}>
              <span>{TIPOS[b.tipo]}</span>
              <em>{b.nombre || b.texto?.split("\n")[0] || b.titulo || b.items?.split("\n")[0] || ""}</em>
              <button title={b.bloqueado ? "Desbloquear" : "Bloquear"} onClick={(ev) => { ev.stopPropagation(); acc.patchBloques([b.id], { bloqueado: !b.bloqueado }); }}>{b.bloqueado ? "🔒" : "🔓"}</button>
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion titulo="Acciones">
        <div className="fila2">
          <Boton onClick={() => acc.duplicarSlide(slide.id)}>Duplicar</Boton>
          <Boton peligro deshabilitado={deck.slides.length < 2} onClick={() => acc.eliminarSlide(slide.id)}>Eliminar</Boton>
        </div>
      </Seccion>
    </>
  );
}

// ─────────────────────────── Pestaña: presentación ───────────────────────────
function TabDeck({ acc }) {
  const { deck } = acc;
  const t = deck.tema;
  const pt = (patch) => acc.patchDeck({ tema: { ...t, ...patch } }, "t" + Object.keys(patch).join());
  const fuentes = [...FUENTES.map((f) => [f.id, f.nombre]), ...deck.fuentes.filter((f, i, a) => a.findIndex((x) => x.id === f.id) === i).map((f) => [f.id, f.nombre + " (subida)"])];
  const refFuente = useRef(null);
  return (
    <>
      <Seccion titulo="General">
        <Txt etiqueta="Título" v={deck.titulo} onChange={(v) => acc.patchDeck({ titulo: v }, "titulo")} />
        <Sel etiqueta="Proporción" v={deck.formato} onChange={(v) => acc.cambiarFormato(v)} opciones={Object.entries(FORMATOS).map(([k, f]) => [k, f.nombre])} />
        <Seg etiqueta="Estilo de presentación" v={deck.modo} onChange={(v) => acc.cambiarModo(v)}
          opciones={[["diapositivas", "Diapositivas"], ["espacio", "Espacio (tipo Prezi)"]]} />
        {deck.modo === "espacio" && (
          <>
            <Num etiqueta="Vuelo (s)" v={deck.camara.dur} min={0.2} max={10} paso={0.1} onChange={(v) => acc.patchDeck({ camara: { ...deck.camara, dur: v } }, "cam")} />
            <Rng etiqueta="Zoom de vuelo" v={Math.round(deck.camara.arco * 100)} unidad="%" onChange={(v) => acc.patchDeck({ camara: { ...deck.camara, arco: v / 100 } }, "cam2")} />
          </>
        )}
      </Seccion>

      <Seccion titulo="Tema">
        <div className="temas">
          {Object.entries(TEMAS).map(([id, tm]) => (
            <button key={id} className={t.id === id ? "on" : ""} onClick={() => acc.patchDeck({ tema: { id, ...tm } })} title={tm.nombre}>
              <i style={{ background: tm.fondo }}><b style={{ background: tm.acento }} /><b style={{ background: tm.resalte }} /></i>
              {tm.nombre}
            </button>
          ))}
        </div>
        {[["fondo", "Fondo"], ["fondo2", "Brillo del fondo"], ["texto", "Texto"], ["acento", "Acento"], ["acento2", "Acento claro"], ["resalte", "Resalte"], ["suave", "Suave"]].map(([k, n]) => (
          <label key={k} className="campo col-simple">
            <span>{n}</span>
            <input type="color" value={t[k]} onChange={(e) => pt({ [k]: e.target.value, id: "personalizado" })} />
          </label>
        ))}
        <Sel etiqueta="Tipografía del cuerpo" v={t.fuente} opciones={fuentes} onChange={(v) => pt({ fuente: v })} />
        <Sel etiqueta="Tipografía de títulos" v={t.fuenteTitulo} opciones={fuentes} onChange={(v) => pt({ fuenteTitulo: v })} />
        <input ref={refFuente} type="file" accept=".ttf,.otf,.woff,.woff2" hidden onChange={(e) => { if (e.target.files[0]) acc.subirFuente(e.target.files[0]); e.target.value = ""; }} />
        <Boton onClick={() => refFuente.current.click()}>Subir tipografía (.ttf / .otf / .woff2)…</Boton>
      </Seccion>

      <Seccion titulo="Pie de página">
        <Chk etiqueta="Mostrar pie" v={deck.pie.mostrar} onChange={(v) => acc.patchDeck({ pie: { ...deck.pie, mostrar: v } })} ancho={2} />
        <Txt etiqueta="Texto del pie" v={deck.pie.texto} onChange={(v) => acc.patchDeck({ pie: { ...deck.pie, texto: v } }, "pie")} />
        <Chk etiqueta="Número de diapositiva" v={deck.pie.numero} onChange={(v) => acc.patchDeck({ pie: { ...deck.pie, numero: v } })} ancho={2} />
      </Seccion>

      <Seccion titulo={`Biblioteca de imágenes (${Object.keys(deck.assets).length})`}>
        {Object.keys(deck.assets).length === 0 && <p className="nota">Las imágenes que subas aparecen acá para reutilizarlas.</p>}
        <div className="biblio">
          {Object.values(deck.assets).map((a) => (
            <figure key={a.id} title={`${a.nombre} · ${a.w}×${a.h}`}>
              <img src={a.src} alt="" onClick={() => acc.agregarImagenDeBiblioteca(a.id)} />
              <button title="Quitar de la biblioteca (solo si no se usa)" onClick={() => acc.quitarAsset(a.id)}>×</button>
              <figcaption>{a.nombre}</figcaption>
            </figure>
          ))}
        </div>
        <p className="nota">Clic en una imagen para agregarla a la diapositiva actual.</p>
      </Seccion>
    </>
  );
}

export default function Inspector({ acc, tab, setTab }) {
  const tabs = [["bloque", "Bloque"], ["anim", "Animación"], ["slide", "Diapositiva"], ["deck", "Presentación"]];
  return (
    <aside className="insp">
      <nav className="tabs">
        {tabs.map(([k, n]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{n}</button>
        ))}
      </nav>
      <div className="insp-cuerpo">
        {tab === "bloque" && <TabBloque acc={acc} />}
        {tab === "anim" && <TabAnim acc={acc} />}
        {tab === "slide" && <TabSlide acc={acc} />}
        {tab === "deck" && <TabDeck acc={acc} />}
      </div>
    </aside>
  );
}
