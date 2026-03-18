import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // For GitHub Pages project sites: https://<user>.github.io/<repo>/
  // Change this if you rename the repo.
  base: '/YouTubeZen/',
  server: {
    port: 5173,
    strictPort: true,
  },
})

