import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'teacher-photo-api-dev',
        configureServer(server) {
          server.middlewares.use('/api/teacher-photo', (req, res) => {
            const configFilePath = path.resolve(__dirname, 'teacher-config.json');
            if (req.method === 'GET') {
              let config = { imageUrl: null, scale: 100, offsetY: 0 };
              try {
                if (fs.existsSync(configFilePath)) {
                  config = { offsetY: 0, ...JSON.parse(fs.readFileSync(configFilePath, 'utf-8')) };
                }
              } catch {}
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, ...config }));
            } else if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', () => {
                try {
                  const data = JSON.parse(body);
                  const config = {
                    imageUrl: data.imageUrl || null,
                    scale: typeof data.scale === 'number' ? data.scale : 100,
                    offsetY: typeof data.offsetY === 'number' ? data.offsetY : 0
                  };
                  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, ...config }));
                } catch {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ success: false, error: 'Failed to save' }));
                }
              });
            } else {
              res.statusCode = 405;
              res.end('Method Not Allowed');
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
