import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    envDir: __dirname,
    base: process.env.VITE_BASE_PATH || '/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5181,
        cors: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    },
    build: {
        outDir: 'dist',
    },
});
