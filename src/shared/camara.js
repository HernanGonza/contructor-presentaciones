import { useCallback, useEffect, useRef } from "react";

// Pose de cámara: {cx, cy} = punto del mundo en el centro de pantalla, z = px de pantalla por unidad del mundo, rot = grados.

export function poseDeDiapositiva(slide, W, H, vw, vh) {
  const e = slide.espacio;
  return { cx: e.x, cy: e.y, z: Math.min(vw / W, vh / H) / e.escala, rot: e.rot };
}

export function poseGeneral(slides, W, H, vw, vh) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  slides.forEach((s) => {
    const e = s.espacio;
    const r = (e.rot * Math.PI) / 180;
    const c = Math.cos(r), sn = Math.sin(r);
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => {
      const lx = (a * W * e.escala) / 2, ly = (b * H * e.escala) / 2;
      const px = e.x + lx * c - ly * sn, py = e.y + lx * sn + ly * c;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    });
  });
  const bw = Math.max(x1 - x0, 1), bh = Math.max(y1 - y0, 1);
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, z: Math.min(vw / (bw * 1.12), vh / (bh * 1.12)), rot: 0 };
}

const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function useCamara(stageRef, worldRef) {
  const cam = useRef(null);
  const raf = useRef(0);

  const pintar = useCallback((c) => {
    const st = stageRef.current, w = worldRef.current;
    if (!st || !w) return;
    w.style.transform = `translate(${st.clientWidth / 2}px, ${st.clientHeight / 2}px) rotate(${-c.rot}deg) scale(${c.z}) translate(${-c.cx}px, ${-c.cy}px)`;
  }, [stageRef, worldRef]);

  const fijar = useCallback((c) => {
    cancelAnimationFrame(raf.current);
    cam.current = c;
    pintar(c);
  }, [pintar]);

  // Vuelo: interpola posición y giro, y el zoom en escala logarítmica con un "arco" (se aleja a mitad de camino).
  const volar = useCallback((dest, ms, arco = 0.7) => {
    const st = stageRef.current;
    const a = cam.current;
    if (!a || !st || ms <= 0) return fijar(dest);
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    const dist = Math.hypot(dest.cx - a.cx, dest.cy - a.cy);
    const visible = st.clientWidth / Math.min(a.z, dest.z);
    const bomba = Math.min(Math.log(1 + dist / visible) * 1.4, 2.2) * arco;
    const paso = (ahora) => {
      const t = Math.min(1, (ahora - t0) / ms);
      const e = suave(t);
      const lz = Math.log(a.z) + (Math.log(dest.z) - Math.log(a.z)) * e - bomba * Math.sin(Math.PI * e);
      const c = {
        cx: a.cx + (dest.cx - a.cx) * e,
        cy: a.cy + (dest.cy - a.cy) * e,
        rot: a.rot + (dest.rot - a.rot) * e,
        z: Math.exp(lz),
      };
      cam.current = c;
      pintar(c);
      if (t < 1) raf.current = requestAnimationFrame(paso);
    };
    raf.current = requestAnimationFrame(paso);
  }, [stageRef, fijar, pintar]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return { fijar, volar };
}
