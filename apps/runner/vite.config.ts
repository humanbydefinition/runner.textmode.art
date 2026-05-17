import path from 'path';
import { defineConfig } from 'vite';

const workspaceRoot = path.resolve(__dirname, '../..');

export default defineConfig({
    envDir: workspaceRoot,
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@textmode/runner-protocol': path.resolve(workspaceRoot, './packages/runner-protocol/src/index.ts'),
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
