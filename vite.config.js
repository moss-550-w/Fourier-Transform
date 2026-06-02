import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 部署到 GitHub Pages 的项目仓库,站点服务于子路径,故须设置 base。
// 仓库名:Fourier-Transform.github.io → https://moss-550-w.github.io/Fourier-Transform.github.io/
export default defineConfig({
  base: '/Fourier-Transform.github.io/',
  plugins: [react()],
})
