import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/', // ou '/viacorp/' se for uma subpasta no GitHub Pages
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // ✅ usa o manifest.json externo da pasta public
      includeAssets: [
        'favicon.svg',
        'icons/icon-192x192.png',
        'icons/icon-512x512.png'
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js']
      }
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
