import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    base: '/wizard-soundings/',
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                main: path.resolve(import.meta.dirname, 'index.html'),
                stats: path.resolve(import.meta.dirname, 'examples/stats/index.html'),
            },
        },
    },
});
