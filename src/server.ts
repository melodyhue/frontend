import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const API_BASE = process.env['API_BASE_URL'] || 'https://api.melodyhue.com';

/**
 * JSON endpoints (proxy) for developer overlays
 * These routes return raw JSON exactly as provided by the upstream API.
 */
app.get('/developer/api/:userId/infos', async (req, res) => {
  const userId = req.params['userId'];
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }
  const target = `${API_BASE}/infos/${encodeURIComponent(userId)}`;
  try {
    const upstream = await fetch(target, { headers: { accept: 'application/json' } });
    const bodyText = await upstream.text();
    res.status(upstream.status);
    const ct = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('content-type', ct);
    // Prevent caching to ensure real-time data
    res.setHeader('cache-control', 'no-store');
    res.send(bodyText);
  } catch (err) {
    res
      .status(502)
      .json({ status: 'error', message: 'Upstream fetch failed', detail: (err as Error).message });
  }
});

app.get('/developer/api/:userId/color', async (req, res) => {
  const userId = req.params['userId'];
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }
  const target = `${API_BASE}/color/${encodeURIComponent(userId)}`;
  try {
    const upstream = await fetch(target, { headers: { accept: 'application/json' } });
    const bodyText = await upstream.text();
    res.status(upstream.status);
    const ct = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('content-type', ct);
    // Prevent caching to ensure real-time data
    res.setHeader('cache-control', 'no-store');
    res.send(bodyText);
  } catch (err) {
    res
      .status(502)
      .json({ status: 'error', message: 'Upstream fetch failed', detail: (err as Error).message });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
