import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import http from 'node:http';

function canReachApiHealth(port: number, timeoutMs = 700): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/health/live',
        method: 'GET',
        timeout: timeoutMs,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      },
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  /**
   * Destino del proxy `/api` en `npm run dev`.
   * Si no defines `VITE_DEV_PROXY_TARGET`, se prueba primero Nest en :3000 y luego Nginx en :80.
   */
  let proxyTarget = env.VITE_DEV_PROXY_TARGET || env.PROXY_API_TARGET;
  if (!proxyTarget) {
    if (await canReachApiHealth(3000)) {
      proxyTarget = 'http://127.0.0.1:3000';
    } else if (await canReachApiHealth(80)) {
      proxyTarget = 'http://127.0.0.1';
    } else {
      proxyTarget = 'http://127.0.0.1:3000';
    }
    console.info(`[vite] Proxy /api → ${proxyTarget}`);
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('error', (err) => {
              console.error(
                `[vite proxy] No se pudo conectar con la API en ${proxyTarget}. ¿Está Nest levantado? (${String(err)})`,
              );
            });
          },
        },
        '/socket.io': {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
