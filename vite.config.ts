import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ai-town/',
  plugins: [react()],
  server: {
    allowedHosts: ['ai-town-your-app-name.fly.dev', 'localhost', '127.0.0.1'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          convex: ['convex', '@clerk/clerk-react'],
          ui: ['react-modal', 'react-toastify'],
          chart: ['uplot'],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'convex/react',
      '@clerk/clerk-react',
      'react-toastify',
      'react-modal',
      'uplot',
    ],
  },
});
