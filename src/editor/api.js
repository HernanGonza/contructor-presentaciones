// Cliente de la API (/api, la sirve nginx y la atiende server/index.js → Postgres).
async function pedir(metodo, url, cuerpo) {
  let r;
  try {
    r = await fetch(url, { method: metodo, headers: cuerpo ? { "Content-Type": "application/json" } : undefined, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  } catch {
    throw Object.assign(new Error("Sin conexión con el servidor"), { status: 0 });
  }
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(datos.error || `Error ${r.status}`), { status: r.status, datos });
  return datos;
}

export const api = {
  listar: () => pedir("GET", "/api/presentaciones"),
  obtener: (id) => pedir("GET", `/api/presentaciones/${id}`),
  meta: (id) => pedir("GET", `/api/presentaciones/${id}/meta`),
  crear: (deck, autor) => pedir("POST", "/api/presentaciones", { deck, autor }),
  guardar: (id, deck, autor, version, forzar = false) => pedir("PUT", `/api/presentaciones/${id}`, { deck, autor, version, forzar }),
  borrar: (id) => pedir("DELETE", `/api/presentaciones/${id}`),
};

// Nombre de quien edita (se muestra como «editado por»). Queda en este navegador.
export const leerAutor = () => { try { return localStorage.getItem("autor") || ""; } catch { return ""; } };
export const guardarAutor = (n) => { try { localStorage.setItem("autor", n); } catch { /* sin storage */ } };

export const fechaCorta = (iso) => {
  const d = new Date(iso), seg = (Date.now() - d) / 1000;
  if (seg < 60) return "recién";
  if (seg < 3600) return `hace ${Math.floor(seg / 60)} min`;
  if (seg < 86400) return `hace ${Math.floor(seg / 3600)} h`;
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
};
