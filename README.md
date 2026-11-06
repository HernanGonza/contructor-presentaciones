# Constructor de presentaciones

Editor visual (React + Vite) para armar presentaciones con transiciones y animaciones, y exportarlas como **un único `.html`** que funciona sin internet.

## Uso

    npm install
    npm run dev          # http://localhost:5173
    npm run build        # dist/index.html (el editor, también en un solo archivo)

## Docker

    docker compose up -d --build     # http://localhost:8081  (cambiar con PORT=80 docker compose up -d --build)

Es solo nginx sirviendo archivos estáticos: no hay backend ni base de datos. Los proyectos se autoguardan en el navegador de cada persona.

## Cómo funciona

- `src/shared/`: modelo, bloques, diapositivas, transiciones, cámara y `Reproductor` (lo usan el editor y el HTML exportado).
- `src/editor/`: la interfaz del constructor.
- `src/player/` + `player.html`: se compila a `dist-player/player.html` (React + CSS, 1 archivo). Al exportar, el editor le inyecta los datos de la presentación (imágenes y tipografías en base64).
- Un HTML exportado también se puede **abrir de nuevo en el editor** (Archivo → Abrir): lleva los datos adentro.

## Teclas

Editor: Ctrl+Z/Y deshacer, Ctrl+C/V/D copiar/pegar/duplicar, flechas mover (Mayús ×10), Supr borrar, pegar imágenes con Ctrl+V.
Presentación: ← → mover · N guion · G índice · O vista general (modo espacio) · F pantalla completa.
