import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/chat/', // 核心配置：所有资源路径会以 /chat/ 开头
  build:{
    outDir: 'chat', // 输出目录改为 chat
    assetsDir: 'assets', // 静态资源子目录（可选，默认是 assets）

  },
  plugins: [
    vue(),
    // vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0', // 允许外部访问
    proxy: {
      '/api': {
        target: 'http://106.13.163.91:10081', // 修改为实际的API服务地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
