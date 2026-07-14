import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Games/',
  publicDir: 'assets',
  build: {
    target: 'ES2020',
  },
})
