import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5006,
    proxy: {
      '/llms.txt': 'http://localhost:3006',
      '/context': 'http://localhost:3006',
      '/skills': 'http://localhost:3006',
      '/api': 'http://localhost:3006',
      '/.well-known': 'http://localhost:3006'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
