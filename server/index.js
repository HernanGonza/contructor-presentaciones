// API mínima: guarda las presentaciones en Postgres (una fila por presentación, el deck entero en jsonb).
// Edición en equipo con bloqueo optimista: cada guardado manda la `version` que el cliente tenía;
// si otra persona guardó antes, responde 409 y el editor ofrece recargar o sobrescribir.
import http from "node:http";
import pg from "pg";

const PORT = +process.env.PORT || 3000;
const LIMITE = 150 * 1024 * 1024; // las imágenes viajan dentro del deck (base64)
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgres://constructor:constructor@localhost:5432/constructor" });

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function iniciarDb() {
  for (let i = 1; ; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS presentaciones (
          id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          titulo      text NOT NULL DEFAULT 'Presentación sin título',
          deck        jsonb NOT NULL,
          resumen     jsonb NOT NULL DEFAULT '{}',
          version     integer NOT NULL DEFAULT 1,
          creado_por  text,
          editado_por text,
          creado      timestamptz NOT NULL DEFAULT now(),
          actualizado timestamptz NOT NULL DEFAULT now()
        )`);
      return;
    } catch (e) {
      if (i >= 30) throw e;
      console.log(`Esperando a Postgres (${i}/30): ${e.message}`);
      await esperar(2000);
    }
  }
}

const quien = (s) => (typeof s === "string" && s.trim() ? s.trim().slice(0, 60) : "Anónimo");
function resumenDe(deck) {
  const t = deck.tema || {};
  return { slides: deck.slides?.length || 0, modo: deck.modo, tema: { fondo: t.fondo, fondo2: t.fondo2, acento: t.acento, texto: t.texto, resalte: t.resalte } };
}
const validar = (deck) => deck && typeof deck === "object" && Array.isArray(deck.slides) && typeof deck.titulo === "string";
const COLS_LISTA = "id, titulo, resumen, version, creado_por, editado_por, actualizado";

const json = (res, code, obj) => {
  const s = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(s);
};
function leerCuerpo(req) {
  return new Promise((ok, mal) => {
    let n = 0; const partes = [];
    req.on("data", (c) => {
      n += c.length;
      if (n > LIMITE) { mal(Object.assign(new Error("Demasiado grande"), { status: 413 })); req.destroy(); }
      else partes.push(c);
    });
    req.on("end", () => { try { ok(JSON.parse(Buffer.concat(partes).toString() || "{}")); } catch { mal(Object.assign(new Error("JSON inválido"), { status: 400 })); } });
    req.on("error", mal);
  });
}

const UUID = "[0-9a-f-]{36}";
async function manejar(req, res) {
  const { pathname } = new URL(req.url, "http://x");
  const m = req.method;
  let r;

  if (pathname === "/api/salud") { await pool.query("SELECT 1"); return json(res, 200, { ok: true }); }

  if (pathname === "/api/presentaciones") {
    if (m === "GET") {
      const { rows } = await pool.query(`SELECT ${COLS_LISTA} FROM presentaciones ORDER BY actualizado DESC`);
      return json(res, 200, rows);
    }
    if (m === "POST") {
      const b = await leerCuerpo(req);
      if (!validar(b.deck)) return json(res, 400, { error: "Presentación inválida" });
      const a = quien(b.autor);
      ({ rows: [r] } = await pool.query(
        `INSERT INTO presentaciones (titulo, deck, resumen, creado_por, editado_por) VALUES ($1,$2,$3,$4,$4) RETURNING ${COLS_LISTA}`,
        [b.deck.titulo.slice(0, 200), b.deck, resumenDe(b.deck), a]));
      return json(res, 201, r);
    }
  }

  const mt = pathname.match(new RegExp(`^/api/presentaciones/(${UUID})(/meta)?$`));
  if (mt) {
    const id = mt[1];
    if (m === "GET" && mt[2]) {
      ({ rows: [r] } = await pool.query(`SELECT ${COLS_LISTA} FROM presentaciones WHERE id=$1`, [id]));
      return r ? json(res, 200, r) : json(res, 404, { error: "No existe" });
    }
    if (m === "GET") {
      ({ rows: [r] } = await pool.query(`SELECT ${COLS_LISTA}, deck FROM presentaciones WHERE id=$1`, [id]));
      return r ? json(res, 200, r) : json(res, 404, { error: "No existe" });
    }
    if (m === "PUT") {
      const b = await leerCuerpo(req);
      if (!validar(b.deck)) return json(res, 400, { error: "Presentación inválida" });
      const args = [id, b.deck.titulo.slice(0, 200), b.deck, resumenDe(b.deck), quien(b.autor)];
      // Sin `forzar`, solo guarda si la versión que tenía el cliente sigue siendo la vigente.
      const where = b.forzar ? "id=$1" : "id=$1 AND version=$6";
      if (!b.forzar) args.push(+b.version);
      ({ rows: [r] } = await pool.query(
        `UPDATE presentaciones SET titulo=$2, deck=$3, resumen=$4, editado_por=$5, version=version+1, actualizado=now() WHERE ${where} RETURNING ${COLS_LISTA}`, args));
      if (r) return json(res, 200, r);
      ({ rows: [r] } = await pool.query(`SELECT ${COLS_LISTA} FROM presentaciones WHERE id=$1`, [id]));
      return r ? json(res, 409, { error: "Otra persona guardó cambios antes", actual: r }) : json(res, 404, { error: "No existe" });
    }
    if (m === "DELETE") {
      const { rowCount } = await pool.query("DELETE FROM presentaciones WHERE id=$1", [id]);
      return rowCount ? json(res, 200, { ok: true }) : json(res, 404, { error: "No existe" });
    }
  }
  json(res, 404, { error: "No encontrado" });
}

await iniciarDb();
http
  .createServer((req, res) =>
    manejar(req, res).catch((e) => {
      if (e.status) return json(res, e.status, { error: e.message });
      console.error(e);
      json(res, 500, { error: "Error interno" });
    }))
  .listen(PORT, () => console.log(`API escuchando en :${PORT}`));
