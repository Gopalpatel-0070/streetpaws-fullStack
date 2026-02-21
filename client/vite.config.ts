import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDev = mode === 'development';
    
    return {
      server: {
        port: 3001,
        host: '0.0.0.0',
        hmr: isDev ? {
          host: 'localhost',
          port: 3001,
          protocol: 'ws',
        } : undefined,
        middlewareMode: false,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.API_BASE_URL': JSON.stringify(
          isDev 
            ? 'http://localhost:5000/api'
            : (env.VITE_API_BASE_URL || 'https://streetpaws-backend.vercel.app/api')
        )
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'terser',
        target: 'ES2020',
        cssCodeSplit: true
      }
    };
});
