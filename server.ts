import express from 'express';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// CORS headers for all API requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PuckVision Pro NAS Proxy' });
});

// Ugreen NAS Stream Proxy with Range request support for smooth video seeking & no CORS taint
app.get('/api/nas-stream', (req, res) => {
  const targetUrl = req.query.url as string;
  const authHeader = (req.query.auth as string) || req.headers.authorization;

  if (!targetUrl) {
    res.status(400).send('Missing url query parameter');
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (err) {
    res.status(400).send('Invalid URL format');
    return;
  }

  const isHttps = parsedUrl.protocol === 'https:';
  const client = isHttps ? https : http;

  const requestHeaders: Record<string, string> = {
    'User-Agent': 'PuckVision-Pro/1.0 (Hockey Video Review)',
  };

  if (req.headers.range) {
    requestHeaders['Range'] = req.headers.range;
  }

  if (authHeader) {
    requestHeaders['Authorization'] = authHeader;
  }

  const proxyReq = client.request(
    parsedUrl,
    {
      method: req.method,
      headers: requestHeaders,
      rejectUnauthorized: false, // Allows local NAS self-signed SSL certs
    },
    (proxyRes) => {
      // Forward status code (e.g., 200 OK or 206 Partial Content)
      res.status(proxyRes.statusCode || 200);

      // Forward relevant headers
      const forwardedHeaders = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'last-modified',
        'etag',
      ];

      forwardedHeaders.forEach((header) => {
        const val = proxyRes.headers[header];
        if (val) {
          res.setHeader(header, val);
        }
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error('NAS Stream Proxy Error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Failed to reach Ugreen NAS endpoint',
        details: err.message,
        hint: 'Ensure your Ugreen NAS is powered on, WebDAV / HTTP sharing is active, and the IP/port is accessible.',
      });
    }
  });

  req.on('close', () => {
    proxyReq.destroy();
  });

  proxyReq.end();
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PuckVision Pro server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
