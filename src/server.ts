import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import 'dotenv/config';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
// Base API: peut être surchargée via la variable d'environnement API_BASE_URL.
// Par défaut: en prod on utilise l'API publique, en dev on pointe sur localhost.
const API_BASE_RAW =
  process.env['API_BASE_URL'] ||
  (process.env['NODE_ENV'] === 'production'
    ? 'https://api.melodyhue.com'
    : 'http://localhost:8765');
// Normaliser (supprimer slash fin) pour éviter les doubles // dans l’URL cible
const API_BASE = API_BASE_RAW.replace(/\/+$/, '');
// Headers communs pour les requêtes upstream
const UPSTREAM_HEADERS = {
  accept: 'application/json',
  'user-agent': 'melodyhue-frontend-ssr/1.0',
} as const;
// Mode de forward: 'fetch' (par défaut) ou 'redirect'.
// Utilisez PROXY_FORWARD=redirect si votre hébergeur bloque les requêtes sortantes.
const PROXY_FORWARD = (process.env['PROXY_FORWARD'] || 'fetch').toLowerCase();

function forwardOrFetchJson(target: string, res: express.Response) {
  if (PROXY_FORWARD === 'redirect') {
    // Rediriger côté client vers l'API publique (retournera du JSON directement au client)
    res.redirect(302, target);
    return Promise.resolve();
  }
  return fetch(target, { headers: UPSTREAM_HEADERS }).then(async (upstream) => {
    const bodyText = await upstream.text();
    res.status(upstream.status);
    const ct = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('content-type', ct);
    res.setHeader('cache-control', 'no-store');
    res.send(bodyText);
  });
}

/**
 * Developer API: return raw JSON for infos/color
 * These endpoints bypass Angular rendering to output JSON directly.
 */
app.get('/developer/api/:userId/infos', async (req, res) => {
  const userId = req.params['userId'];
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }
  const target = `${API_BASE}/infos/${encodeURIComponent(userId)}`;
  try {
    await forwardOrFetchJson(target, res);
  } catch (err) {
    if (process.env['DEBUG_PROXY']) {
      console.error('[Proxy] GET /developer/api/:userId/infos ->', target, 'Error:', err);
    }
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
    await forwardOrFetchJson(target, res);
  } catch (err) {
    if (process.env['DEBUG_PROXY']) {
      console.error('[Proxy] GET /developer/api/:userId/color ->', target, 'Error:', err);
    }
    res
      .status(502)
      .json({ status: 'error', message: 'Upstream fetch failed', detail: (err as Error).message });
  }
});

/**
 * Direct proxy routes for public API when running with SSR dev server
 * This allows calling relative paths from the browser without CORS issues.
 */
app.get('/infos/:userId', async (req, res) => {
  const userId = req.params['userId'];
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }
  const target = `${API_BASE}/infos/${encodeURIComponent(userId)}`;
  try {
    await forwardOrFetchJson(target, res);
  } catch (err) {
    if (process.env['DEBUG_PROXY']) {
      console.error('[Proxy] GET /infos/:userId ->', target, 'Error:', err);
    }
    res
      .status(502)
      .json({ status: 'error', message: 'Upstream fetch failed', detail: (err as Error).message });
  }
});

app.get('/color/:userId', async (req, res) => {
  const userId = req.params['userId'];
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }
  const target = `${API_BASE}/color/${encodeURIComponent(userId)}`;
  try {
    await forwardOrFetchJson(target, res);
  } catch (err) {
    if (process.env['DEBUG_PROXY']) {
      console.error('[Proxy] GET /color/:userId ->', target, 'Error:', err);
    }
    res
      .status(502)
      .json({ status: 'error', message: 'Upstream fetch failed', detail: (err as Error).message });
  }
});

app.get('/health', async (_req, res) => {
  const target = `${API_BASE}/health`;
  try {
    await forwardOrFetchJson(target, res);
  } catch (err) {
    if (process.env['DEBUG_PROXY']) {
      console.error('[Proxy] GET /health ->', target, 'Error:', err);
    }
    res
      .status(502)
      .json({ status: 'error', message: 'Upstream fetch failed', detail: (err as Error).message });
  }
});

app.get('/users/:userId', async (req, res) => {
  const userId = req.params['userId'];
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }
  const target = `${API_BASE}/users/${encodeURIComponent(userId)}`;
  try {
    const upstream = await fetch(target, { headers: { accept: 'application/json' } });
    const bodyText = await upstream.text();
    res.status(upstream.status);
    const ct = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('content-type', ct);
    res.setHeader('cache-control', 'no-store');
    res.send(bodyText);
  } catch (err) {
    if (process.env['DEBUG_PROXY']) {
      console.error('[Proxy] GET /users/:userId ->', target, 'Error:', err);
    }
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
  const port = process.env['PORT'] || 3000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    const env = process.env['NODE_ENV'] || 'development';
    console.log(`[SSR] listening on http://localhost:${port} (env=${env})`);
    console.log(`[SSR] API_BASE = ${API_BASE}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
