# Constructor de presentaciones

Editor visual (React + Vite) para armar presentaciones con transiciones y animaciones, y exportarlas como **un único `.html`** que funciona sin internet.

## Uso

    npm install
    npm run dev          # http://localhost:5173
    npm run build        # dist/index.html (el editor, también en un solo archivo)

## Docker (edición en equipo)

    docker compose up -d --build     # http://localhost:8081  (cambiar con PORT=80 docker compose up -d --build)
    DB_PASSWORD=algo-seguro docker compose up -d --build   # recomendado: cambiar la clave de Postgres

Levanta 3 contenedores: `db` (Postgres 16, datos en el volumen `pgdata`), `api` (`server/`, Node) y `constructor` (nginx: sirve el editor y reenvía `/api` a la API).

- La pantalla de inicio lista las presentaciones guardadas del equipo (tarjetas). Al entrar a una se edita y **se autoguarda en Postgres**.
- Hay que escribir «Tu nombre» arriba a la derecha: queda como «editado por».
- Edición simultánea: no es en vivo. Cada guardado lleva la versión que la persona tenía; si otra guardó antes, el editor avisa y deja elegir entre cargar la versión del equipo o guardar la propia encima. Cada 8 s consulta si hay una versión más nueva y ofrece cargarla.
- Backup: `docker exec constructor-db pg_dump -U constructor constructor > backup.sql`
- Sin autenticación: pensado para una red interna.

Desarrollo local: levantá un Postgres, corré en `server/` `DATABASE_URL=postgres://usuario:clave@localhost:5432/constructor npm start` (puerto 3000) y `npm run dev` en la raíz (el proxy `/api` apunta a :3000).

## Cómo funciona

- `src/shared/`: modelo, bloques, diapositivas, transiciones, cámara y `Reproductor` (lo usan el editor y el HTML exportado).
- `src/editor/`: la interfaz del constructor.
- `src/player/` + `player.html`: se compila a `dist-player/player.html` (React + CSS, 1 archivo). Al exportar, el editor le inyecta los datos de la presentación (imágenes y tipografías en base64).
- Un HTML exportado también se puede **abrir de nuevo en el editor** (Archivo → Abrir): lleva los datos adentro.

## Teclas

Editor: Ctrl+Z/Y deshacer, Ctrl+C/V/D copiar/pegar/duplicar, flechas mover (Mayús ×10), Supr borrar, pegar imágenes con Ctrl+V.
Presentación: ← → mover · N guion · G índice · O vista general (modo espacio) · F pantalla completa.
