import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import terminal from 'vite-plugin-terminal' // 1. プラグインをインポート

export default defineConfig({
  plugins: [
    basicSsl(),
    terminal({
      console: 'inherit' // 2. ブラウザの console.log を自動でPCのターミナルに横流しする設定
    })
  ],
  server: {
    host: true,
    https: true,
  },
})