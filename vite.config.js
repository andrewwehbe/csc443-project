import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages serves this repo at https://andrewwehbe.github.io/csc443-project/,
  // so every file path must start with /csc443-project/. Change it if the repo is renamed.
  base: '/csc443-project/',
  plugins: [react(), tailwindcss()],
});
