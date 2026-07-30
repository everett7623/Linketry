import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'node:fs';

const adminPackage = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as { version?: string };
const linketryVersion = adminPackage.version ?? '0.0.0';
const basePath = process.env.VITE_LINKETRY_BASE_PATH === '/admin/' ? '/admin/' : '/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    {
      name: 'linketry-version-meta',
      transformIndexHtml(html) {
        return html.replace(
          '<meta charset="UTF-8" />',
          `<meta charset="UTF-8" />\n    <meta name="linketry-version" content="${linketryVersion}" />`
        );
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@linketry/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: basePath === '/admin/' ? 'dist/admin' : 'dist',
    sourcemap: true,
    // 代码分割优化
    rollupOptions: {
      output: {
        // 手动分包策略
        manualChunks: {
          // React 核心库
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          // UI 和工具库
          'vendor-utils': [
            'lucide-react',
            'qrcode',
            'clsx',
            'dayjs'
          ]
        },
        // 优化文件名
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // 压缩优化（使用默认的 esbuild，更快）
    minify: 'esbuild',
    // 性能优化
    chunkSizeWarningLimit: 1000, // 1MB 警告阈值
    reportCompressedSize: true
  },
});
