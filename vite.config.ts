import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Nạp biến môi trường từ .env
  // Fix: Use a type assertion for process to avoid TS error in certain environments where @types/node is not globally recognized
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Đảm bảo process.env.API_KEY có giá trị từ .env hoặc môi trường hệ thống
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ''),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    server: {
      port: 3000,
      host: true
    }
  };
});