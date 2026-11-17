import { defineConfig } from 'vite';

// Sitio 100% estático y local: rutas relativas para poder publicarse tal cual
// (GitHub Pages) sin backend. No hay proxy, no hay API, no hay telemetría.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
    // Sin polyfill de modulepreload: el bundle no debe contener ninguna llamada
    // a `fetch` (los navegadores modernos soportan modulepreload de forma nativa).
    modulePreload: { polyfill: false },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Por defecto solo se acepta el host local (protección contra host-header attacks).
    // Para revisar la demo desde otro equipo se pueden habilitar hosts extra:
    //   CALZACV_HOSTS=mi-host.example npm run dev
    allowedHosts: process.env.CALZACV_HOSTS
      ? process.env.CALZACV_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
      : [],
  },
});
