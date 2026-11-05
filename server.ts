import 'dotenv/config';
import { loadProfiles } from './server/config.ts';
import { repository } from './server/storage.ts';
import { createApp } from './server/app.ts';

const port = Number(process.env.PORT || 3000);
const rawOrigin = (process.env.PUBLIC_ORIGIN || `http://localhost:${port}`).replace(/\/$/, '');
const url = new URL(rawOrigin);
if ((url.pathname !== '/' && url.pathname !== '') || url.search || url.hash || url.username || url.password) {
  throw new Error('PUBLIC_ORIGIN must be an origin');
}
const isProd = process.env.NODE_ENV === 'production' && !process.env.K_SERVICE?.startsWith('ais-dev');
if (isProd && url.protocol !== 'https:') {
  throw new Error('Production requires HTTPS PUBLIC_ORIGIN');
}
const origin = rawOrigin;

const profiles = loadProfiles();
const repo = await repository();
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
