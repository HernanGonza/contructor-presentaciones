// Catálogos compartidos entre el editor y el reproductor exportado.

export const FORMATOS = {
  "16:9": { ancho: 1920, alto: 1080, nombre: "Panorámico 16:9" },
  "16:10": { ancho: 1728, alto: 1080, nombre: "16:10" },
  "4:3": { ancho: 1440, alto: 1080, nombre: "Clásico 4:3" },
};

export const TRANSICIONES = [
  { id: "deslizar", nombre: "Deslizar" },
  { id: "fundido", nombre: "Fundido" },
  { id: "desenfoque", nombre: "Desenfoque" },
  { id: "zoom", nombre: "Zoom" },
  { id: "giro", nombre: "Giro (puerta)" },
  { id: "cubo", nombre: "Cubo 3D" },
  { id: "voltear", nombre: "Voltear" },
  { id: "cortina", nombre: "Cortina" },
  { id: "caida", nombre: "Caída" },
  { id: "abrir", nombre: "Abrir (inclinado)" },
  { id: "ninguna", nombre: "Sin transición" },
];

export const ENTRADAS = [
  { id: "ninguna", nombre: "Sin animación" },
  { id: "aparecer", nombre: "Aparecer" },
  { id: "subir", nombre: "Subir" },
  { id: "bajar", nombre: "Bajar" },
  { id: "izquierda", nombre: "Desde la izquierda" },
  { id: "derecha", nombre: "Desde la derecha" },
  { id: "zoom", nombre: "Zoom (crece)" },
  { id: "achicar", nombre: "Zoom (se achica)" },
  { id: "giro", nombre: "Giro" },
  { id: "voltear", nombre: "Voltear 3D" },
  { id: "desenfoque", nombre: "Desenfoque" },
  { id: "rebote", nombre: "Rebote" },
  { id: "cortina", nombre: "Cortina" },
  { id: "elastico", nombre: "Elástico" },
];

export const BUCLES = [
  { id: "ninguno", nombre: "Ninguno" },
  { id: "pulso", nombre: "Pulso" },
  { id: "flotar", nombre: "Flotar" },
  { id: "balanceo", nombre: "Balanceo" },
  { id: "girar", nombre: "Girar" },
  { id: "parpadeo", nombre: "Parpadeo" },
  { id: "respirar", nombre: "Respirar (zoom lento)" },
];

export const CURVAS = {
  suave: { nombre: "Suave", css: "cubic-bezier(.22,.8,.2,1)" },
  rebote: { nombre: "Con rebote", css: "cubic-bezier(.34,1.56,.64,1)" },
  entrada: { nombre: "Acelera", css: "cubic-bezier(.5,0,.9,.4)" },
  salida: { nombre: "Frena", css: "cubic-bezier(.1,.6,.3,1)" },
  suaveDoble: { nombre: "Suave doble", css: "cubic-bezier(.65,0,.35,1)" },
  lineal: { nombre: "Lineal", css: "linear" },
};

export const TOKENS_COLOR = [
  ["texto", "Texto"],
  ["acento", "Acento"],
  ["acento2", "Acento claro"],
  ["resalte", "Resalte"],
  ["suave", "Suave"],
  ["fondo", "Fondo"],
];

export const TEMAS = {
  selva: {
    nombre: "Selva",
    fondo: "#234131", fondo2: "#9ca867", texto: "#faf4eb", acento: "#c9346c", acento2: "#f5a5bf", resalte: "#e9e384", suave: "#9ca867",
    fuente: "oak", fuenteTitulo: "oak",
  },
  claro: {
    nombre: "Claro",
    fondo: "#faf4eb", fondo2: "#e9e384", texto: "#1f2d25", acento: "#3e6c51", acento2: "#9ca867", resalte: "#c9346c", suave: "#6b7d5c",
    fuente: "sistema", fuenteTitulo: "sistema",
  },
  noche: {
    nombre: "Noche",
    fondo: "#0f1420", fondo2: "#3b5bdb", texto: "#eef1f7", acento: "#4dabf7", acento2: "#a5d8ff", resalte: "#ffd43b", suave: "#748ffc",
    fuente: "sistema", fuenteTitulo: "sistema",
  },
  oceano: {
    nombre: "Océano",
    fondo: "#0b3c49", fondo2: "#2ec4b6", texto: "#f1fbfa", acento: "#ff9f1c", acento2: "#ffd29a", resalte: "#cbf3f0", suave: "#2ec4b6",
    fuente: "sistema", fuenteTitulo: "sistema",
  },
  papel: {
    nombre: "Papel",
    fondo: "#f4efe6", fondo2: "#d9c9a8", texto: "#2b2118", acento: "#b23a2b", acento2: "#e0897c", resalte: "#1f5f8b", suave: "#8a7a5c",
    fuente: "serif", fuenteTitulo: "serif",
  },
};

// id → pila CSS. "oak" es la tipografía del Ministerio (se embebe al exportar si se usa).
export const FUENTES = [
  { id: "oak", nombre: "Oak Sans (Ministerio)", css: '"Oak Sans", system-ui, sans-serif' },
  { id: "sistema", nombre: "Sans del sistema", css: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { id: "serif", nombre: "Serif clásica", css: 'Georgia, "Times New Roman", serif' },
  { id: "mono", nombre: "Monoespaciada", css: 'ui-monospace, Menlo, Consolas, "Courier New", monospace' },
  { id: "impacto", nombre: "Impacto", css: 'Impact, "Arial Narrow Bold", "Haettenschweiler", sans-serif' },
  { id: "redonda", nombre: "Redondeada", css: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif' },
];

export const PESOS = [
  [300, "Fina"],
  [400, "Normal"],
  [500, "Media"],
  [600, "Seminegrita"],
  [700, "Negrita"],
];

export const MARCADORES = [
  ["gota", "Gota"],
  ["punto", "Punto"],
  ["numero", "Números"],
  ["check", "Tilde"],
  ["guion", "Guion"],
  ["ninguno", "Sin marcador"],
];

// Curva de pulso de los focos (la misma de las páginas del ministerio).
const COLORES = ["#b5a99d", "#f5d35d", "#f6a53d", "#ed6b2f", "#d73b29", "#941c32"];
export const COLORES_PULSO = COLORES;
