import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Diapositiva } from "../shared/Diapositiva.jsx";
import Reproductor from "../shared/Reproductor.jsx";
import { cssDeck } from "../shared/estilos.js";
import { FORMATOS } from "../shared/constantes.js";
import { PLANTILLAS, nombreSlide, normalizar, nuevaDiapositiva, nuevoBloque, nuevoDeck, slideDesdePlantilla, uid, activosUsados } from "../shared/modelo.js";
import { useDeck } from "./store.js";
import { api, fechaCorta, leerAutor } from "./api.js";
import { cssOak } from "./fuentesOak.js";
import { fuenteDesdeArchivo, procesarImagen } from "./imagenes.js";
import { abrirArchivo, exportarGuion, exportarHtml, guardarProyecto } from "./exportar.js";
import Lienzo from "./Lienzo.jsx";
import EspacioEditor from "./EspacioEditor.jsx";
import Inspector from "./Inspector.jsx";

const Miniatura = memo(
  ({ slide, deck, n }) => {
    const ancho = 176;
    const k = ancho / deck.ancho;
    return (
      <div className="mini tv" style={{ width: ancho, height: deck.alto * k }}>
        <div style={{ transform: `scale(${k})`, transformOrigin: "0 0", width: deck.ancho, height: deck.alto }}>
          <Diapositiva slide={slide} deck={deck} n={n} total={deck.slides.length} />
        </div>
      </div>
    );
  },
  (a, b) =>
    a.slide === b.slide && a.n === b.n && a.deck.tema === b.deck.tema && a.deck.assets === b.deck.assets &&
    a.deck.ancho === b.deck.ancho && a.deck.alto === b.deck.alto && a.deck.fuentes === b.deck.fuentes && a.deck.pie === b.deck.pie
);

const FORMAS = (tipo) => ({ forma: tipo, ...(tipo === "linea" || tipo === "flecha" ? { anchoBorde: 8 } : {}) });
const editable = (el) => el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);

export default function App({ id, inicial, versionInicial, onInicio }) {
  const { deck, cambiar, vivo, marca, undo, redo, cargar, puedeUndo, puedeRedo } = useDeck(inicial);
  const [slideId, setSlideId] = useState(inicial.slides[0]?.id);
  const [sel, setSel] = useState([]);
  const [tab, setTab] = useState("slide");
  const [vista, setVista] = useState("slide");
  const [preview, setPreview] = useState(null);
  const [replay, setReplay] = useState(null);
  const [menuPlantillas, setMenuPlantillas] = useState(false);
  const [menuArchivo, setMenuArchivo] = useState(false);
  const [notasAbiertas, setNotasAbiertas] = useState(true);
  const [estado, setEstado] = useState("Guardado en el servidor");
  const [conflicto, setConflicto] = useState(null); // otra persona guardó antes que yo
  const [remoto, setRemoto] = useState(null); // hay una versión más nueva y yo no tengo cambios pendientes
  const [aviso, setAviso] = useState(null);
  const [pasoCascada, setPasoCascada] = useState(0.15);
  const [arrastrando, setArrastrando] = useState(null);
  const [sobre, setSobre] = useState(null);
  const inputImg = useRef(null);
  const inputAbrir = useRef(null);
  const objetivoImg = useRef({});
  const clip = useRef({ bloques: [], n: 0 });

  const indice = Math.max(0, deck.slides.findIndex((s) => s.id === slideId));
  const slide = deck.slides[indice];
  const W = deck.ancho, H = deck.alto;

  useEffect(() => { if (slide && slide.id !== slideId) setSlideId(slide.id); }, [slide, slideId]);

  const avisar = useCallback((msg, ms = 3500) => {
    setAviso(msg);
    clearTimeout(avisar.t);
    avisar.t = setTimeout(() => setAviso(null), ms);
  }, []);

  // ── guardado en el servidor (Postgres) con control de versión ──
  const autor = leerAutor() || "Anónimo";
  const deckRef = useRef(deck); deckRef.current = deck;
  const ver = useRef(versionInicial);
  const pendiente = useRef(false);
  const cola = useRef(Promise.resolve());
  const reintento = useRef(null);
  const guardar = useCallback((forzar = false) => {
    cola.current = cola.current.then(async () => {
      clearTimeout(reintento.current);
      const enviado = deckRef.current;
      try {
        const r = await api.guardar(id, enviado, autor, ver.current, forzar);
        ver.current = r.version;
        pendiente.current = deckRef.current !== enviado; // editó mientras guardaba
        setConflicto(null); setRemoto(null);
        setEstado(pendiente.current ? "Guardando…" : "Guardado " + fechaCorta(r.actualizado));
        if (pendiente.current) guardar();
      } catch (e) {
        if (e.status === 409) { setConflicto(e.datos.actual); setEstado("⚠ Conflicto: otra persona guardó antes"); }
        else if (e.status === 404) setEstado("⚠ La presentación fue borrada");
        else { setEstado("⚠ Sin conexión, reintentando…"); reintento.current = setTimeout(() => guardar(forzar), 5000); }
      }
    });
    return cola.current;
  }, [id, autor]);

  const primera = useRef(true);
  const recargado = useRef(false);
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    if (recargado.current) { recargado.current = false; return; } // vino del servidor: no hay nada que guardar
    pendiente.current = true;
    if (conflicto) return; // no pisar hasta que elija qué hacer
    setEstado("Guardando…");
    const t = setTimeout(() => guardar(), 1200);
    return () => clearTimeout(t);
  }, [deck]); // eslint-disable-line react-hooks/exhaustive-deps

  // ¿Alguien más guardó? Se consulta cada 8 s; si no tengo cambios pendientes aviso para recargar.
  useEffect(() => {
    const t = setInterval(async () => {
      if (conflicto) return;
      try {
        const m = await api.meta(id);
        if (m.version > ver.current && !pendiente.current) setRemoto(m);
      } catch { /* sin red: ya lo avisa el guardado */ }
    }, 8000);
    return () => clearInterval(t);
  }, [id, conflicto]);
  useEffect(() => {
    const f = (e) => { if (pendiente.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, []);

  const recargarDelServidor = async () => {
    try {
      const p = await api.obtener(id);
      const d = normalizar(p.deck);
      recargado.current = true; cargar(d); ver.current = p.version; pendiente.current = false;
      if (!d.slides.some((x) => x.id === slideId)) setSlideId(d.slides[0]?.id);
      setSel([]); setConflicto(null); setRemoto(null); setEstado("Guardado " + fechaCorta(p.actualizado));
    } catch (e) { avisar("No se pudo recargar: " + e.message, 6000); }
  };
  const sobrescribir = () => {
    if (!confirm("Tu versión reemplaza la que guardó la otra persona. ¿Seguro?")) return;
    ver.current = conflicto.version; guardar(true);
  };
  const volverAlInicio = async () => {
    if (pendiente.current && !conflicto) { setEstado("Guardando…"); await guardar(); }
    if (pendiente.current && !confirm("Hay cambios sin guardar. ¿Salir igual y perderlos?")) return;
    onInicio();
  };

  // ── helpers de edición ──
  const upSlide = useCallback((fn, clave) =>
    cambiar((d) => ({ ...d, slides: d.slides.map((s) => (s.id === slideId ? fn(s) : s)) }), clave && clave + slideId), [cambiar, slideId]);
  const patchSlide = useCallback((patch, clave) => upSlide((s) => ({ ...s, ...patch }), clave), [upSlide]);
  const patchBloques = useCallback((ids, patch, clave) =>
    upSlide((s) => ({ ...s, bloques: s.bloques.map((b) => (ids.includes(b.id) ? (typeof patch === "function" ? patch(b) : { ...b, ...patch }) : b)) }), clave), [upSlide]);
  const patchDeck = useCallback((patch, clave) => cambiar((d) => ({ ...d, ...patch }), clave && "d" + clave), [cambiar]);
  const patchEspacio = useCallback((patch) => upSlide((s) => ({ ...s, espacio: { ...s.espacio, ...patch } }), "esp"), [upSlide]);

  const seleccionar = useCallback((ids) => {
    setSel(ids);
    if (ids.length) setTab((t) => (t === "anim" ? "anim" : "bloque"));
  }, []);

  const agregarBloque = useCallback((tipo, extra = {}, geo = {}) => {
    const b = nuevoBloque(tipo, extra, geo);
    const k = slide.bloques.length % 6;
    if (geo.x === undefined) b.x = Math.round((W - b.w) / 2) + k * 24 - 60;
    if (geo.y === undefined) b.y = Math.round((H - b.h) / 2) + k * 24 - 60;
    b.anim.delay = Math.min(1.2, +(slide.bloques.length * 0.15).toFixed(2));
    upSlide((s) => ({ ...s, bloques: [...s.bloques, b] }));
    setSel([b.id]);
    setTab("bloque");
    setVista("slide");
    return b;
  }, [slide, upSlide, W, H]);

  const eliminar = useCallback((ids) => {
    upSlide((s) => ({ ...s, bloques: s.bloques.filter((b) => !ids.includes(b.id)) }));
    setSel([]);
  }, [upSlide]);

  const clonar = useCallback((bs, dx = 30, dy = 30) => bs.map((b) => ({ ...JSON.parse(JSON.stringify(b)), id: uid(), x: b.x + dx, y: b.y + dy })), []);
  const duplicar = useCallback((ids) => {
    const nuevos = clonar(slide.bloques.filter((b) => ids.includes(b.id)));
    upSlide((s) => ({ ...s, bloques: [...s.bloques, ...nuevos] }));
    setSel(nuevos.map((b) => b.id));
  }, [slide, upSlide, clonar]);

  const orden = useCallback((tipo) => {
    upSlide((s) => {
      let a = [...s.bloques];
      const es = (b) => sel.includes(b.id);
      if (tipo === "frente") a = [...a.filter((b) => !es(b)), ...a.filter(es)];
      else if (tipo === "fondo") a = [...a.filter(es), ...a.filter((b) => !es(b))];
      else if (tipo === "sube") for (let i = a.length - 2; i >= 0; i--) { if (es(a[i]) && !es(a[i + 1])) [a[i], a[i + 1]] = [a[i + 1], a[i]]; }
      else if (tipo === "baja") for (let i = 1; i < a.length; i++) { if (es(a[i]) && !es(a[i - 1])) [a[i], a[i - 1]] = [a[i - 1], a[i]]; }
      return { ...s, bloques: a };
    });
  }, [upSlide, sel]);

  const alinear = useCallback((k) => {
    upSlide((s) => {
      const bs = s.bloques.filter((b) => sel.includes(b.id));
      if (k === "dh" || k === "dv") {
        const h = k === "dh";
        const ord = [...bs].sort((a, b) => (h ? a.x - b.x : a.y - b.y));
        const ini = h ? ord[0].x : ord[0].y;
        const fin = h ? ord[ord.length - 1].x + ord[ord.length - 1].w : ord[ord.length - 1].y + ord[ord.length - 1].h;
        const suma = ord.reduce((t, b) => t + (h ? b.w : b.h), 0);
        const hueco = (fin - ini - suma) / (ord.length - 1);
        const pos = {};
        let cur = ini;
        ord.forEach((b) => { pos[b.id] = Math.round(cur); cur += (h ? b.w : b.h) + hueco; });
        return { ...s, bloques: s.bloques.map((b) => (pos[b.id] === undefined ? b : h ? { ...b, x: pos[b.id] } : { ...b, y: pos[b.id] })) };
      }
      return {
        ...s,
        bloques: s.bloques.map((b) => {
          if (!sel.includes(b.id)) return b;
          if (k === "izq") return { ...b, x: 0 };
          if (k === "der") return { ...b, x: W - b.w };
          if (k === "ch") return { ...b, x: Math.round((W - b.w) / 2) };
          if (k === "arr") return { ...b, y: 0 };
          if (k === "aba") return { ...b, y: H - b.h };
          return { ...b, y: Math.round((H - b.h) / 2) };
        }),
      };
    });
  }, [upSlide, sel, W, H]);

  const cascada = useCallback((paso) => {
    upSlide((s) => {
      let i = 0;
      return { ...s, bloques: s.bloques.map((b) => (b.anim.disparo === "auto" ? { ...b, anim: { ...b.anim, delay: +(0.1 + i++ * paso).toFixed(2) } } : b)) };
    });
    avisar("Entradas escalonadas en el orden de las capas");
  }, [upSlide, avisar]);

  const ajustarAlto = useCallback((id) => {
    const el = document.querySelector(`.ed-lienzo [data-bid="${id}"] .txt-i`);
    if (el) patchBloques([id], { h: Math.ceil(el.offsetHeight) + 6 });
  }, [patchBloques]);

  const probar = useCallback((id) => setReplay({ id, n: Date.now() }), []);

  // ── diapositivas ──
  const irASlide = useCallback((id) => { setSlideId(id); setSel([]); }, []);
  const editarSlide = useCallback((id) => { irASlide(id); setVista("slide"); }, [irASlide]);

  const agregarSlide = useCallback((plantilla) => {
    const s = slideDesdePlantilla(deck, plantilla);
    cambiar((d) => {
      const i = d.slides.findIndex((x) => x.id === slideId);
      const a = [...d.slides];
      a.splice(i + 1, 0, s);
      return { ...d, slides: a };
    });
    setSlideId(s.id); setSel([]); setMenuPlantillas(false); setVista("slide"); setTab("slide");
  }, [deck, cambiar, slideId]);

  const duplicarSlide = useCallback((id) => {
    const o = deck.slides.find((s) => s.id === id);
    const ult = deck.slides[deck.slides.length - 1];
    const c = { ...JSON.parse(JSON.stringify(o)), id: uid(), nombre: o.nombre ? o.nombre + " (copia)" : "", bloques: o.bloques.map((b) => ({ ...JSON.parse(JSON.stringify(b)), id: uid() })) };
    c.espacio = { ...o.espacio, x: ult.espacio.x + W * 1.3, y: ult.espacio.y };
    cambiar((d) => {
      const i = d.slides.findIndex((x) => x.id === id);
      const a = [...d.slides];
      a.splice(i + 1, 0, c);
      return { ...d, slides: a };
    });
    setSlideId(c.id); setSel([]);
  }, [deck, cambiar, W]);

  const eliminarSlide = useCallback((id) => {
    if (deck.slides.length < 2) return;
    const i = deck.slides.findIndex((s) => s.id === id);
    cambiar((d) => ({ ...d, slides: d.slides.filter((s) => s.id !== id) }));
    if (id === slideId) setSlideId(deck.slides[Math.max(0, i - 1 + (i === 0 ? 1 : 0))].id);
    setSel([]);
  }, [deck, cambiar, slideId]);

  const moverSlide = useCallback((de, a) => {
    if (de === a) return;
    cambiar((d) => {
      const arr = [...d.slides];
      const [x] = arr.splice(de, 1);
      arr.splice(a, 0, x);
      return { ...d, slides: arr };
    });
  }, [cambiar]);

  const aplicarTransicionATodas = useCallback(() => {
    cambiar((d) => ({ ...d, slides: d.slides.map((s) => ({ ...s, transicion: slide.transicion, duracionT: slide.duracionT })) }));
    avisar("Transición aplicada a todas las diapositivas");
  }, [cambiar, slide, avisar]);

  const distribuir = useCallback((tipo) => {
    cambiar((d) => {
      const n = d.slides.length, gx = d.ancho * 1.3, gy = d.alto * 1.35;
      const cols = Math.ceil(Math.sqrt(n));
      const R = Math.max(d.ancho * 1.5, (n * gx) / (2 * Math.PI));
      return {
        ...d,
        slides: d.slides.map((s, k) => {
          let p;
          if (tipo === "fila") p = { x: k * gx, y: 0 };
          else if (tipo === "grilla") p = { x: (k % cols) * gx, y: Math.floor(k / cols) * gy };
          else p = { x: Math.round(R * Math.cos((k / n) * 2 * Math.PI - Math.PI / 2)), y: Math.round(R * Math.sin((k / n) * 2 * Math.PI - Math.PI / 2)) };
          return { ...s, espacio: { ...p, escala: 1, rot: 0 } };
        }),
      };
    });
  }, [cambiar]);

  const cambiarFormato = useCallback((f) => {
    const fm = FORMATOS[f];
    if (!fm || fm.ancho === W) { patchDeck({ formato: f }); return; }
    const k = fm.ancho / W;
    cambiar((d) => ({
      ...d, formato: f, ancho: fm.ancho, alto: fm.alto,
      slides: d.slides.map((s) => ({ ...s, bloques: s.bloques.map((b) => ({ ...b, x: Math.round(b.x * k), w: Math.round(b.w * k) })) })),
    }));
  }, [cambiar, W, patchDeck]);

  const cambiarModo = useCallback((m) => {
    cambiar((d) => {
      const iguales = d.slides.length > 1 && d.slides.every((s) => s.espacio.x === d.slides[0].espacio.x && s.espacio.y === d.slides[0].espacio.y);
      return { ...d, modo: m, slides: m === "espacio" && iguales ? d.slides.map((s, k) => ({ ...s, espacio: { x: k * d.ancho * 1.3, y: 0, escala: 1, rot: 0 } })) : d.slides };
    });
    setVista(m === "espacio" ? "mapa" : "slide");
  }, [cambiar]);

  // ── imágenes y tipografías ──
  const pedirImagen = useCallback((bloqueId = null) => { objetivoImg.current = { bloqueId }; inputImg.current.multiple = !bloqueId; inputImg.current.click(); }, []);
  const pedirImagenFondo = useCallback(() => { objetivoImg.current = { fondo: true }; inputImg.current.multiple = false; inputImg.current.click(); }, []);

  const subirImagenes = useCallback(async (files, punto, bloqueId, fondo) => {
    let n = 0;
    for (const file of files) {
      try {
        const a = await procesarImagen(file);
        if (fondo) {
          cambiar((d) => ({ ...d, assets: { ...d.assets, [a.id]: a }, slides: d.slides.map((s) => (s.id === slideId ? { ...s, fondo: { ...(s.fondo || {}), tipo: "imagen", asset: a.id, oscurecer: s.fondo?.oscurecer ?? 0.35 } } : s)) }));
        } else if (bloqueId) {
          cambiar((d) => ({ ...d, assets: { ...d.assets, [a.id]: a }, slides: d.slides.map((s) => (s.id === slideId ? { ...s, bloques: s.bloques.map((b) => (b.id === bloqueId ? { ...b, asset: a.id } : b)) } : s)) }));
        } else {
          const k = Math.min(1, 1100 / a.w, 620 / a.h);
          const w = Math.round(a.w * k), h = Math.round(a.h * k);
          const b = nuevoBloque("imagen", { asset: a.id, anim: { entrada: "zoom" } }, {
            w, h,
            x: Math.round((punto ? punto.x : W / 2) - w / 2) + n * 30,
            y: Math.round((punto ? punto.y : H / 2) - h / 2) + n * 30,
          });
          b.anim.delay = Math.min(1.2, +(slide.bloques.length * 0.15).toFixed(2));
          cambiar((d) => ({ ...d, assets: { ...d.assets, [a.id]: a }, slides: d.slides.map((s) => (s.id === slideId ? { ...s, bloques: [...s.bloques, b] } : s)) }));
          setSel([b.id]); setTab("bloque");
        }
        n++;
      } catch (e) {
        avisar("No se pudo cargar «" + file.name + "»: " + e.message);
      }
    }
  }, [cambiar, slideId, W, H, slide, avisar]);

  const agregarImagenDeBiblioteca = useCallback((id) => {
    const a = deck.assets[id];
    const k = Math.min(1, 1100 / a.w, 620 / a.h);
    agregarBloque("imagen", { asset: id, anim: { entrada: "zoom" } }, { w: Math.round(a.w * k), h: Math.round(a.h * k) });
  }, [deck, agregarBloque]);

  const quitarAsset = useCallback((id) => {
    if (activosUsados(deck).has(id)) { avisar("Esa imagen se está usando en alguna diapositiva"); return; }
    cambiar((d) => { const { [id]: _, ...resto } = d.assets; return { ...d, assets: resto }; });
  }, [deck, cambiar, avisar]);

  const subirFuente = useCallback(async (file) => {
    try {
      const f = await fuenteDesdeArchivo(file);
      cambiar((d) => ({ ...d, fuentes: [...d.fuentes, f], tema: { ...d.tema, fuente: f.id, fuenteTitulo: f.id, id: "personalizado" } }));
      avisar(`Tipografía «${f.nombre}» cargada y aplicada`);
    } catch (e) { avisar("No se pudo leer la tipografía"); }
  }, [cambiar, avisar]);

  // ── archivo ──
  const exportar = async () => {
    try {
      avisar("Generando HTML…", 8000);
      const bytes = await exportarHtml(deck);
      avisar(`Exportado «${deck.titulo}» · ${(bytes / 1048576).toFixed(1)} MB · se abre con doble clic, sin internet`, 6000);
    } catch (e) { avisar("No se pudo exportar: " + e.message, 8000); }
  };
  const abrir = async (file) => {
    if (!confirm("El contenido de esta presentación se reemplaza por el del archivo (el resto del equipo verá el cambio). ¿Seguir?")) return;
    try {
      const d = await abrirArchivo(file);
      cargar(d); setSlideId(d.slides[0]?.id); setSel([]); setVista("slide");
      avisar(`Abierta «${d.titulo}»`);
    } catch (e) { avisar("No se pudo abrir: " + e.message, 6000); }
  };

  // ── teclado y portapapeles ──
  const pegar = useCallback(() => {
    if (!clip.current.bloques.length) return;
    clip.current.n++;
    const nuevos = clonar(clip.current.bloques, 30 * clip.current.n, 30 * clip.current.n);
    upSlide((s) => ({ ...s, bloques: [...s.bloques, ...nuevos] }));
    setSel(nuevos.map((b) => b.id));
  }, [upSlide, clonar]);

  useEffect(() => {
    if (preview) return;
    const onKey = (e) => {
      if (editable(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && k === "y") { e.preventDefault(); redo(); }
      else if (mod && k === "d") { e.preventDefault(); if (sel.length) duplicar(sel); }
      else if (mod && k === "a") { e.preventDefault(); setSel(slide.bloques.map((b) => b.id)); }
      else if (mod && (k === "c" || k === "x")) {
        if (!sel.length) return;
        clip.current = { bloques: JSON.parse(JSON.stringify(slide.bloques.filter((b) => sel.includes(b.id)))), n: 0 };
        if (k === "x") eliminar(sel);
        else avisar("Copiado", 1200);
      }
      else if (e.key === "Delete" || e.key === "Backspace") { if (sel.length) { e.preventDefault(); eliminar(sel); } }
      else if (e.key === "Escape") setSel([]);
      else if (e.key.startsWith("Arrow") && sel.length && !mod) {
        e.preventDefault();
        const d = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -d : e.key === "ArrowRight" ? d : 0;
        const dy = e.key === "ArrowUp" ? -d : e.key === "ArrowDown" ? d : 0;
        patchBloques(sel, (b) => (b.bloqueado ? b : { ...b, x: b.x + dx, y: b.y + dy }), "nudge" + sel.join());
      }
    };
    const onPaste = (e) => {
      if (editable(e.target)) return;
      const imgs = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith("image/"));
      if (imgs.length) { e.preventDefault(); subirImagenes(imgs, null, null); }
      else { e.preventDefault(); pegar(); }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("paste", onPaste);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("paste", onPaste); };
  }, [preview, sel, slide, undo, redo, duplicar, eliminar, patchBloques, pegar, subirImagenes, avisar]);

  const acc = useMemo(() => ({
    deck, slide, indice, sel, setSel: seleccionar, vivo, marca, patchBloques, patchSlide, patchDeck, patchEspacio,
    eliminar, duplicar, orden, alinear, cascada, ajustarAlto, probar, replay, pasoCascada, setPasoCascada,
    pedirImagen, pedirImagenFondo, subirImagenes, agregarImagenDeBiblioteca, quitarAsset, subirFuente,
    duplicarSlide, eliminarSlide, aplicarTransicionATodas, reproducirDesde: (i) => setPreview({ inicio: i, k: Date.now() }),
    cambiarFormato, cambiarModo, distribuir, irASlide, editarSlide,
  }), [deck, slide, indice, sel, seleccionar, vivo, marca, patchBloques, patchSlide, patchDeck, patchEspacio, eliminar, duplicar, orden, alinear, cascada, ajustarAlto, probar, replay, pasoCascada,
    pedirImagen, pedirImagenFondo, subirImagenes, agregarImagenDeBiblioteca, quitarAsset, subirFuente, duplicarSlide, eliminarSlide, aplicarTransicionATodas, cambiarFormato, cambiarModo, distribuir, irASlide, editarSlide]);

  const herramientas = [
    ["Título", () => agregarBloque("texto", { texto: "Título", tam: 96, peso: 700, fuente: "titulo" }, { w: 1100, h: 130 })],
    ["Texto", () => agregarBloque("texto")],
    ["Lista", () => agregarBloque("lista")],
    ["Imagen", () => pedirImagen(null)],
    ["Rectángulo", () => agregarBloque("forma", FORMAS("rect"))],
    ["Círculo", () => agregarBloque("forma", FORMAS("circulo"), { w: 240, h: 240 })],
    ["Línea", () => agregarBloque("forma", FORMAS("linea"), { w: 400, h: 24 })],
    ["Flecha", () => agregarBloque("forma", FORMAS("flecha"), { w: 400, h: 40 })],
    ["Tarjeta", () => agregarBloque("tarjeta")],
    ["Marcador", () => agregarBloque("marcador")],
  ];

  if (!slide) return null;
  const mapa = deck.modo === "espacio" && vista === "mapa";

  return (
    <div className="app">
      <style>{cssDeck(deck, cssOak)}</style>

      <header className="top">
        <button className="btn" onClick={volverAlInicio} title="Volver a las presentaciones guardadas">← Presentaciones</button>
        <input className="titulo" value={deck.titulo} onChange={(e) => patchDeck({ titulo: e.target.value }, "titulo")} title="Título de la presentación" />
        <div className="grupo">
          <button className="btn" onClick={undo} disabled={!puedeUndo} title="Deshacer (Ctrl+Z)">↶</button>
          <button className="btn" onClick={redo} disabled={!puedeRedo} title="Rehacer (Ctrl+Y)">↷</button>
        </div>
        <div className="rel">
          <button className="btn" onClick={() => setMenuArchivo((v) => !v)}>Archivo ▾</button>
          {menuArchivo && (
            <>
              <div className="cortina" onClick={() => setMenuArchivo(false)} />
              <div className="menu">
                <button onClick={() => { volverAlInicio(); setMenuArchivo(false); }}>Todas las presentaciones</button>
                <hr />
                <button onClick={() => { inputAbrir.current.click(); setMenuArchivo(false); }}>Reemplazar con proyecto o HTML…</button>
                <button onClick={() => { guardarProyecto(deck); setMenuArchivo(false); }}>Guardar proyecto (.json)</button>
                <button onClick={() => { exportarGuion(deck); setMenuArchivo(false); }}>Exportar guion (.md)</button>
              </div>
            </>
          )}
        </div>
        <span className="estado">{estado}</span>
        <div className="grupo der">
          <button className="btn" onClick={() => setPreview({ inicio: indice, k: Date.now() })} title="Presentar desde la diapositiva actual">▶ Desde acá</button>
          <button className="btn" onClick={() => setPreview({ inicio: 0, k: Date.now() })}>▶ Desde el inicio</button>
          <button className="btn primario" onClick={exportar} title="Descarga un único .html que funciona sin internet">⬇ Exportar HTML</button>
        </div>
      </header>

      {conflicto && (
        <div className="banda peligro">
          <span><b>{conflicto.editado_por}</b> guardó cambios {fechaCorta(conflicto.actualizado)} y los tuyos todavía no se guardaron.</span>
          <button className="btn" onClick={recargarDelServidor}>Descartar lo mío y cargar la suya</button>
          <button className="btn peligro" onClick={sobrescribir}>Guardar la mía encima</button>
        </div>
      )}
      {remoto && !conflicto && (
        <div className="banda">
          <span><b>{remoto.editado_por}</b> guardó una versión más nueva {fechaCorta(remoto.actualizado)}.</span>
          <button className="btn primario" onClick={recargarDelServidor}>Cargar cambios</button>
        </div>
      )}

      <div className="cuerpo">
        <aside className="izq">
          <div className="izq-lista">
            {deck.slides.map((s, k) => (
              <div
                key={s.id}
                draggable
                className={`it${s.id === slideId ? " on" : ""}${sobre === k && arrastrando !== null && arrastrando !== k ? " sobre" : ""}`}
                onClick={() => { irASlide(s.id); setTab((t) => (t === "bloque" || t === "anim" ? "slide" : t)); }}
                onDragStart={() => setArrastrando(k)}
                onDragOver={(e) => { e.preventDefault(); setSobre(k); }}
                onDrop={(e) => { e.preventDefault(); if (arrastrando !== null) moverSlide(arrastrando, k); setArrastrando(null); setSobre(null); }}
                onDragEnd={() => { setArrastrando(null); setSobre(null); }}
              >
                <span className="it-n">{k + 1}</span>
                <Miniatura slide={s} deck={deck} n={k + 1} />
                <em>{nombreSlide(s, k)}</em>
                <div className="it-acc">
                  <button title="Duplicar" onClick={(e) => { e.stopPropagation(); duplicarSlide(s.id); }}>⧉</button>
                  {deck.slides.length > 1 && <button title="Eliminar" onClick={(e) => { e.stopPropagation(); eliminarSlide(s.id); }}>✕</button>}
                </div>
              </div>
            ))}
          </div>
          <div className="rel izq-pie">
            <button className="btn primario ancho" onClick={() => setMenuPlantillas((v) => !v)}>＋ Nueva diapositiva</button>
            {menuPlantillas && (
              <>
                <div className="cortina" onClick={() => setMenuPlantillas(false)} />
                <div className="menu arriba">
                  {PLANTILLAS.map((p) => <button key={p.id} onClick={() => agregarSlide(p.id)}>{p.nombre}</button>)}
                </div>
              </>
            )}
          </div>
        </aside>

        <main className="centro">
          <div className="paleta">
            <span>Agregar:</span>
            {herramientas.map(([n, f]) => <button key={n} className="btn" onClick={f}>{n}</button>)}
            {deck.modo === "espacio" && (
              <div className="seg vista">
                <button className={vista === "mapa" ? "on" : ""} onClick={() => setVista("mapa")}>Mapa del espacio</button>
                <button className={vista === "slide" ? "on" : ""} onClick={() => setVista("slide")}>Editar diapositiva</button>
              </div>
            )}
          </div>
          {mapa ? <EspacioEditor acc={acc} /> : <Lienzo acc={acc} />}
          <div className={`notas-ed${notasAbiertas ? "" : " cerrada"}`}>
            <button onClick={() => setNotasAbiertas((v) => !v)}>{notasAbiertas ? "▾" : "▸"} Guion de esta diapositiva (tecla N al presentar)</button>
            {notasAbiertas && (
              <textarea value={slide.notas} placeholder="Lo que vas a decir mientras mostrás esta diapositiva…" onChange={(e) => patchSlide({ notas: e.target.value }, "notas")} />
            )}
          </div>
        </main>

        <Inspector acc={acc} tab={tab} setTab={setTab} />
      </div>

      <input ref={inputImg} type="file" accept="image/*" multiple hidden onChange={(e) => {
        const o = objetivoImg.current;
        const fs = [...e.target.files];
        if (fs.length) subirImagenes(fs, null, o.bloqueId, o.fondo);
        e.target.value = "";
      }} />
      <input ref={inputAbrir} type="file" accept=".json,.html,.htm" hidden onChange={(e) => { if (e.target.files[0]) abrir(e.target.files[0]); e.target.value = ""; }} />

      {preview && (
        <div className="preview">
          <Reproductor key={preview.k} deck={deck} inicio={preview.inicio} cssExtra={cssOak} onSalir={() => setPreview(null)} />
        </div>
      )}
      {aviso && <div className="toast">{aviso}</div>}
    </div>
  );
}
