import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev-proxy FIFO queue for Gnani traffic.
 *
 * Gnani rejects any second concurrent request with
 * `429 RATE_LIMITED: Only 1 active request is allowed at a time.`
 * so the dev server must not forward a second /api/gnani request while the
 * previous one is still open. Requests are chained onto `tail` and released
 * only once the proxied response has finished (or the client went away).
 */
function gnaniProxyQueuePlugin() {
  return {
    name: 'gnani-proxy-queue',
    configureServer(server) {
      let tail = Promise.resolve();
      let queueLength = 0;

      // Registered before Vite installs its proxy middleware, so this runs first.
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/gnani')) return next();

        queueLength += 1;
        console.log(`[Gnani] queue length: ${queueLength}`);

        const forwardWhenFree = () =>
          new Promise((resolve) => {
            const release = () => resolve();
            queueLength -= 1;
            // Release the next queued request as soon as this one settles.
            res.once('finish', release);
            res.once('close', release);
            next();
          });

        tail = tail.then(forwardWhenFree, forwardWhenFree);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5001';

  return {
    plugins: [react(), gnaniProxyQueuePlugin()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor';
            if (/\/node_modules\/(leaflet|react-leaflet)\//.test(id)) return 'map-vendor';
            if (id.includes('/node_modules/lucide-react/')) return 'icon-vendor';
            return undefined;
          },
        },
      },
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        // Clear separation: All /api calls are forwarded to the standalone backend server
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
