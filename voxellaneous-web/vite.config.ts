import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    fs: {
      allow: [
        path.resolve(__dirname, '..'),  // Adjust this path to your directory structure
      ],
    },
  },
});