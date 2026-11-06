// Autoguardado en IndexedDB (aguanta imágenes pesadas, a diferencia de localStorage).
const abrir = () =>
  new Promise((ok, mal) => {
    const r = indexedDB.open("constructor-presentaciones", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error);
  });

export async function guardarLocal(clave, valor) {
  try {
    const db = await abrir();
    await new Promise((ok, mal) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(valor, clave);
      tx.oncomplete = ok;
      tx.onerror = () => mal(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

export async function cargarLocal(clave) {
  try {
    const db = await abrir();
    const v = await new Promise((ok, mal) => {
      const r = db.transaction("kv").objectStore("kv").get(clave);
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error);
    });
    db.close();
    return v ?? null;
  } catch {
    return null;
  }
}
