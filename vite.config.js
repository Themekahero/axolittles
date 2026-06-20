import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/  ·  https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Learn-data tests are pure (no DOM); node is the fastest environment.
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
})
