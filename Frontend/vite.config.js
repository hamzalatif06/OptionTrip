import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gaId = env.VITE_GA_MEASUREMENT_ID || '';

  return {
  plugins: [
    react(),
    // Inject GA measurement ID into the HTML placeholder at build time
    {
      name: 'inject-ga-id',
      transformIndexHtml(html) {
        return html.replace('__VITE_GA_ID__', gaId);
      },
    },
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  css: {
    preprocessorOptions: {
      // Ensure relative paths in CSS are resolved correctly
    }
  }
  }; // end return
})
