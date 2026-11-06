// Modelo de datos de la presentación + fábricas (bloques, diapositivas, plantillas).
import { FORMATOS, TEMAS } from "./constantes.js";

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

export const ANIM_BASE = {
  entrada: "subir",
  dur: 0.7,
  delay: 0,
  curva: "suave",
  disparo: "auto", // auto | clic
  paso: 1, // nº de clic en el que aparece (si disparo = clic)
  bucle: "ninguno",
  velBucle: 3,
  escalonar: 0, // listas: segundos entre ítem e ítem
};

export const DIMS = {
  texto: [700, 120],
  lista: [900, 360],
  imagen: [720, 450],
  forma: [300, 200],
  tarjeta: [380, 440],
  marcador: [64, 64],
};

const PROPS = {
  texto: () => ({
    texto: "Escribí tu texto", tam: 56, peso: 400, color: "@texto", align: "left", valign: "top",
    fuente: "cuerpo", alto: 1.25, espaciado: 0, mayus: false, sombra: false, contorno: 0,
  }),
  lista: () => ({
    items: "Primer punto\nSegundo punto\nTercer punto", tam: 42, peso: 400, color: "@texto",
    marcador: "gota", colorMarcador: "@acento", separacion: 24, fuente: "cuerpo",
  }),
  imagen: () => ({
    asset: null, ajuste: "cubrir", pos: "top", radio: 18, sombra: true, borde: true,
    marco: "ninguno", tituloMarco: "",
  }),
  forma: () => ({
    forma: "rect", relleno: "@acento", rellenoOp: 1, relleno2: "", angulo: 135,
    borde: "@texto", anchoBorde: 0, radio: 0,
  }),
  tarjeta: () => ({
    numero: "1", titulo: "Título", texto: "Descripción breve del paso.",
    colorNum: "@acento", tamTitulo: 44, tamTexto: 30,
  }),
  marcador: () => ({ numero: "1", color: "@acento", pulso: true }),
};

export function nuevoBloque(tipo, extra = {}, geo = {}) {
  const [w, h] = DIMS[tipo] || [400, 200];
  return {
    id: uid(), tipo, nombre: "", x: 160, y: 160, w, h, rot: 0, op: 1, bloqueado: false,
    ...PROPS[tipo](),
    ...extra,
    ...geo,
    anim: { ...ANIM_BASE, ...(extra.anim || {}) },
  };
}

export function nuevaDiapositiva(deck, bloques = [], extra = {}) {
  const prev = deck?.slides?.[deck.slides.length - 1];
  const W = deck?.ancho || 1920;
  const e = prev?.espacio
    ? { x: prev.espacio.x + W * 1.3, y: prev.espacio.y, escala: 1, rot: 0 }
    : { x: 0, y: 0, escala: 1, rot: 0 };
  return {
    id: uid(), nombre: "", notas: "", fondo: { tipo: "tema" }, transicion: "deslizar", duracionT: 0.8,
    sinPie: false, espacio: e, bloques, ...extra,
  };
}

// ───────── Plantillas de diapositiva (pensadas para 1920×1080, se escalan en x para otros formatos) ─────────
const T = (texto, x, y, w, h, o = {}) => nuevoBloque("texto", { texto, ...o }, { x, y, w, h });
const BARRA = (x, y) => nuevoBloque("forma", { relleno: "@acento", relleno2: "@acento2", angulo: 90, radio: 4, nombre: "Barra" }, { x, y, w: 110, h: 8 });
const escalonar = (bloques, paso = 0.15, ini = 0.1) => {
  bloques.forEach((b, i) => { b.anim.delay = +(ini + i * paso).toFixed(2); });
  return bloques;
};

export const PLANTILLAS = [
  {
    id: "vacia", nombre: "En blanco", build: () => ({ bloques: [] }),
  },
  {
    id: "portada", nombre: "Portada",
    build: () => ({
      transicion: "desenfoque",
      bloques: escalonar([
        T("Título de la presentación", 210, 330, 1500, 190, { tam: 140, peso: 700, align: "center", fuente: "titulo", alto: 1.05, valign: "bottom" }),
        T("Una frase que resuma de qué se trata", 310, 550, 1300, 110, { tam: 44, peso: 300, align: "center" }),
        T("Nombre · Área · Fecha", 260, 800, 1400, 50, { tam: 26, peso: 400, align: "center", color: "@suave", mayus: true, espaciado: 3 }),
      ]),
    }),
  },
  {
    id: "seccion", nombre: "Sección",
    build: () => ({
      transicion: "giro", sinPie: true,
      bloques: escalonar([
        T("01", 110, 230, 760, 440, { tam: 420, peso: 700, color: "@suave", contorno: 3, fuente: "titulo", alto: 0.9, nombre: "Número" }),
        T("Nombre de la sección", 900, 330, 910, 260, { tam: 120, peso: 700, fuente: "titulo", alto: 1.02, valign: "bottom" }),
        T("Una línea que cuente de qué trata esta parte", 900, 620, 880, 160, { tam: 40, peso: 300 }),
      ], 0.18),
    }),
  },
  {
    id: "puntos", nombre: "Título + puntos",
    build: () => ({
      transicion: "deslizar",
      bloques: escalonar([
        T("Título de la diapositiva", 120, 80, 1680, 110, { tam: 72, peso: 700, fuente: "titulo", valign: "center" }),
        BARRA(120, 205),
        nuevoBloque("lista", { items: "Primera idea importante\nSegunda idea importante\nTercera idea importante\nCuarta idea importante", anim: { escalonar: 0.25 } }, { x: 120, y: 290, w: 1600, h: 560 }),
      ]),
    }),
  },
  {
    id: "captura", nombre: "Imagen + puntos",
    build: () => ({
      transicion: "cortina",
      bloques: escalonar([
        T("Título de la diapositiva", 120, 70, 1680, 100, { tam: 64, peso: 700, fuente: "titulo", valign: "center" }),
        BARRA(120, 185),
        nuevoBloque("imagen", { marco: "navegador", tituloMarco: "captura.png", anim: { entrada: "zoom" } }, { x: 120, y: 250, w: 1080, h: 675 }),
        nuevoBloque("lista", { items: "Primer punto de la imagen\nSegundo punto de la imagen\nTercer punto de la imagen", marcador: "numero", tam: 34, separacion: 30, anim: { escalonar: 0.3 } }, { x: 1250, y: 290, w: 550, h: 560 }),
      ], 0.2),
    }),
  },
  {
    id: "mosaico", nombre: "Mosaico de 3",
    build: () => {
      const col = (x, i) => [
        nuevoBloque("imagen", { marco: "navegador", tituloMarco: `imagen-${i}.png`, anim: { entrada: "subir" } }, { x, y: 250, w: 520, h: 360 }),
        T("Subtítulo", x, 645, 520, 50, { tam: 32, peso: 600, color: "@resalte", fuente: "titulo" }),
        T("Descripción corta de lo que se ve.", x, 700, 520, 150, { tam: 26, peso: 300 }),
      ];
      return {
        transicion: "cortina",
        bloques: escalonar([
          T("Título del mosaico", 120, 70, 1680, 100, { tam: 64, peso: 700, fuente: "titulo", valign: "center" }),
          BARRA(120, 185),
          ...col(120, 1), ...col(700, 2), ...col(1280, 3),
        ], 0.12),
      };
    },
  },
  {
    id: "pasos", nombre: "Pasos (4 tarjetas)",
    build: () => ({
      transicion: "zoom",
      bloques: escalonar([
        T("Cómo funciona", 120, 80, 1680, 110, { tam: 72, peso: 700, fuente: "titulo", valign: "center" }),
        BARRA(120, 205),
        ...[0, 1, 2, 3].map((i) =>
          nuevoBloque("tarjeta", { numero: String(i + 1), titulo: `Paso ${i + 1}`, texto: "Qué pasa en este paso, en una o dos líneas." }, { x: 120 + i * 433, y: 300, w: 380, h: 480 })
        ),
      ], 0.18),
    }),
  },
  {
    id: "pantalla", nombre: "Imagen a pantalla completa",
    build: () => ({
      transicion: "desenfoque", sinPie: true,
      bloques: [
        nuevoBloque("imagen", { radio: 0, sombra: false, borde: false, pos: "center", anim: { entrada: "aparecer", dur: 1, bucle: "respirar", velBucle: 14 }, nombre: "Fondo" }, { x: 0, y: 0, w: 1920, h: 1080 }),
        T("Una frase potente", 160, 760, 1600, 200, { tam: 96, peso: 700, fuente: "titulo", sombra: true, valign: "bottom", anim: { entrada: "subir", delay: 0.4 } }),
      ],
    }),
  },
];

export function slideDesdePlantilla(deck, id) {
  const p = PLANTILLAS.find((t) => t.id === id) || PLANTILLAS[0];
  const r = p.build();
  const k = (deck.ancho || 1920) / 1920;
  const { bloques, ...resto } = r;
  if (k !== 1) bloques.forEach((b) => { b.x = Math.round(b.x * k); b.w = Math.round(b.w * k); });
  return nuevaDiapositiva(deck, bloques, resto);
}

export function nuevoDeck(conEjemplo = true) {
  const deck = {
    version: 1,
    titulo: "Presentación sin título",
    modo: "diapositivas", // diapositivas | espacio
    formato: "16:9",
    ancho: FORMATOS["16:9"].ancho,
    alto: FORMATOS["16:9"].alto,
    tema: { id: "selva", ...TEMAS.selva },
    fuentes: [],
    camara: { dur: 1.6, arco: 0.7 },
    pie: { mostrar: true, texto: "", numero: true },
    assets: {},
    slides: [],
  };
  if (conEjemplo) {
    const p = slideDesdePlantilla(deck, "portada");
    p.bloques[0].texto = "Mi primera presentación";
    p.bloques[1].texto = "Hecha con el Constructor de Presentaciones";
    p.bloques[2].texto = "Tu nombre · Tu área";
    p.notas = "Saludo y presentación. Acá va lo que quieras decir mientras mostrás esta diapositiva (tecla N en la presentación).";
    p.nombre = "Portada";
    deck.slides.push(p);
    const s = slideDesdePlantilla(deck, "puntos");
    s.nombre = "Puntos";
    s.bloques[0].texto = "Armala como quieras";
    s.bloques[2].items = "Arrastrá, redimensioná y rotá cada bloque\nElegí cómo aparece cada uno: subir, zoom, giro…\nCada diapositiva tiene su propia transición\nExportá un único HTML que funciona sin internet";
    s.notas = "Mostrar cómo se anima cada punto de la lista.";
    deck.slides.push(s);
    const t = slideDesdePlantilla(deck, "pasos");
    t.nombre = "Pasos";
    t.bloques[0].texto = "Cuatro pasos y listo";
    ["Agregá bloques", "Subí imágenes", "Animá", "Exportá"].forEach((x, i) => { t.bloques[2 + i].titulo = x; });
    ["Texto, listas, formas, tarjetas.", "Capturas, fotos, logos. Todo queda dentro del archivo.", "Entradas, retrasos, clics y bucles.", "Un solo .html para abrir con doble clic."].forEach((x, i) => { t.bloques[2 + i].texto = x; });
    deck.slides.push(t);
  }
  return deck;
}

// Completa lo que falte en un deck viejo o importado.
export function normalizar(d) {
  if (!d || !Array.isArray(d.slides)) throw new Error("El archivo no es una presentación válida");
  const base = nuevoDeck(false);
  const deck = { ...base, ...d, tema: { ...base.tema, ...(d.tema || {}) }, camara: { ...base.camara, ...(d.camara || {}) }, pie: { ...base.pie, ...(d.pie || {}) } };
  deck.assets = d.assets || {};
  deck.fuentes = d.fuentes || [];
  deck.slides = d.slides.map((s, i) => ({
    ...nuevaDiapositiva({ ancho: deck.ancho, slides: [] }, []),
    ...s,
    espacio: s.espacio || { x: i * deck.ancho * 1.3, y: 0, escala: 1, rot: 0 },
    bloques: (s.bloques || []).map((b) => {
      const def = PROPS[b.tipo] ? PROPS[b.tipo]() : {};
      return { ...def, ...b, anim: { ...ANIM_BASE, ...(b.anim || {}) } };
    }),
  }));
  return deck;
}

export const pasosMax = (slide) =>
  slide.bloques.reduce((m, b) => (b.anim.disparo === "clic" ? Math.max(m, +b.anim.paso || 1) : m), 0);

export function activosUsados(deck) {
  const usados = new Set();
  deck.slides.forEach((s) => {
    if (s.fondo?.tipo === "imagen" && s.fondo.asset) usados.add(s.fondo.asset);
    s.bloques.forEach((b) => b.tipo === "imagen" && b.asset && usados.add(b.asset));
  });
  return usados;
}

export const nombreSlide = (s, i) => s.nombre || tituloAuto(s) || `Diapositiva ${i + 1}`;
function tituloAuto(s) {
  const t = s.bloques.find((b) => b.tipo === "texto" && b.texto?.trim());
  return t ? t.texto.trim().split("\n")[0].slice(0, 40) : "";
}
