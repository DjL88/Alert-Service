import 'dotenv/config';
import { loadProfiles } from './server/config.ts';
import { repository } from './server/storage.ts';
import { createApp } from './server/app.ts';

const port = Number(
  process.env.APP_PORT ||
  process.env.DEFAULT_APP_PORT ||
  (process.env.PORT && process.env.PORT !== process.env.NGINX_PORT ? process.env.PORT : 3000)
);

const rawOrigin = (
  process.env.PUBLIC_ORIGIN ||
  process.env.APP_URL ||
  `http://localhost:${port}`
).replace(/\/$/, '');

let origin = rawOrigin;
try {
  const url = new URL(rawOrigin);
  if ((url.pathname !== '/' && url.pathname !== '') || url.search || url.hash || url.username || url.password) {
    origin = url.origin;
  }
} catch {
  origin = `http://localhost:${port}`;
}

const isProd = process.env.NODE_ENV === 'production';
if (isProd && origin.startsWith('http://') && !origin.includes('localhost')) {
  console.warn('Production webhook receiver recommends HTTPS for PUBLIC_ORIGIN');
}

const profiles = loadProfiles();
if (isProd && profiles.length === 0) {
  console.warn('No integrations configured. The UI will load; configure INTEGRATIONS_JSON before connecting Deliverect.');
}
let repo;
try {
  repo = await repository();
} catch (error) {
  console.error('Store Alerts could not start: storage configuration is missing or invalid.',error);
  throw error;
}
const schedulerToken = process.env.SCHEDULER_TOKEN || '';
const app = createApp(repo, profiles, origin, schedulerToken);

if (process.env.NODE_ENV === 'production') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Deliverect Store Alerts production server listening on port ${port} with ${profiles.length} profiles`);
  });
} else {
  // Mount Vite development middlewares
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(port, '0.0.0.0', () => {
    console.log(`Deliverect Store Alerts full-stack dev server listening on http://localhost:${port} with ${profiles.length} profiles`);
  });
}
