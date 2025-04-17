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
     /* 其他build生产打包配置省略 */
     commonjsOptions: {
        include: /node_modules|lib/  //这里记得把lib目录加进来，否则生产打包会报错！！
    }
  },
  plugins: [
    vue(),
    // vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.js', '.vue', '.json', '.ts']  //使用路径别名时想要省略的后缀名，可以自己增减
  },
  optimizeDeps: {
    include: ['@/../lib/vform/designer.umd.js']  //此处路径必须跟main.js中import路径完全一致！
  },
  server: {
    host: '0.0.0.0', // 允许外部访问
    proxy: {
      '/api/people-system': {
        target: 'http://106.13.75.110:8083/people-system', // 修改为实际的API服务地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/people-system/, ''),
      },
      '/api': {
        target: 'http://106.13.163.91:10081', // 修改为实际的API服务地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
