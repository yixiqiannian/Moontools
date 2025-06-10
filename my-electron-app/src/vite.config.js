// ele/my-electron-app/src/vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist',       // 输出到 src/dist
    emptyOutDir: true     // 打包前清空
  }
})
