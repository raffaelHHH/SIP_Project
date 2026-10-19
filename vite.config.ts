import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH lets the same build work on Vercel ("/") and GitHub Pages ("/<repo-name>/").
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
});
