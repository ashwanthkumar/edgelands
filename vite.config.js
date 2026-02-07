import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/edgelands/',
  build: {
    outDir: 'dist',
  },
});
