import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_KEY = process.env.EXPO_PUBLIC_API_KEY || 'j5VkzT5A8ikNICicxkTENKC4RAjFZPra0loFFVwYyOQcAyVRxCiRJQzjhE9XPxTl';
const API_BASE_URL = 'https://bxbet.asia/api';
const IMAGE_BASE_URL = 'https://bxbet.asia';
const GAME_LAUNCHER_BASE_URL = 'https://bxbet.asia';

export default defineConfig({
  plugins: [react()],
  define: {
    __API_KEY__: JSON.stringify(API_KEY),
    __API_BASE_URL__: JSON.stringify(API_BASE_URL),
    __IMAGE_BASE_URL__: JSON.stringify(IMAGE_BASE_URL),
    __GAME_LAUNCHER_BASE_URL__: JSON.stringify(GAME_LAUNCHER_BASE_URL),
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  }
})
