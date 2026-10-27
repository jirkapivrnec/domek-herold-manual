import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' – relativní cesty, aby šlo později nasadit i na GitHub Pages do podsložky
export default defineConfig({
  base: './',
  plugins: [react()],
})
