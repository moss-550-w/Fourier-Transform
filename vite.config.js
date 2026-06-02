import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 纯静态站点;base 留默认,部署到子路径时再按需调整
export default defineConfig({
  plugins: [react()],
})
