# Local development routing

Run `npm run dev` to start the Express API and Vite middleware in **one process**. Express handles `/api/*`, `/webhooks/*`, `/healthz` and `/readyz`; Vite serves the React interface and its development assets.

Do **not** configure Vite to proxy `/api` or `/webhooks` to port 8080 in this mode. There is no second API server: the proxy can hijack requests and produce misleading 500/connection errors in AI Studio.

The dashboard's **Preview without a token** button uses local sample data and never sends API requests. Real orders and administrative operations require server-side credentials.

For smoke verification, start the app and check:

1. `GET /healthz` returns `{"status":"ok"}`.
2. `GET /api/console` without a bearer token returns HTTP 401, not a Vite proxy failure.
3. The browser renders the welcome screen and the demo preview without any token.
4. A valid configured tenant token loads the real console; a bogus token remains rejected.
5. `npm run lint`, `npm test` and `npm run build` complete before merging changes.
