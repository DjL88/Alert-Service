# Store Alerts

Provider-agnostic retail notifications. Deliverect registrations automatically map stores to output profiles; signed order and picking events update a server-backed operations board. The original AI Studio simulator remains available, clearly labelled as demo data.

## Run locally

Requires Node 24.

```sh
npm ci
cp .env.example .env
npm run server
# In another terminal:
npm run dev
```

Set `INTEGRATIONS_JSON` in `.env` before starting the server. Open **Connect Deliverect**, enter the configured tenant admin token, and copy the displayed callback URLs. Tokens are held in browser memory only. Do not enter production provider credentials in the demo settings pages.

```sh
npm test
npm run lint
npm run build
```

## What works

- Signed registration, automatic location → external destination mapping, activate/deactivate, retained ownership on disable.
- Separate provider profiles for VoCoVo and screens; multiple outputs per physical store.
- Raw-body HMAC validation, account checks, tenant-scoped admin reads and transactions.
- New order/status/picking intake, duplicate handling, monotonic picking progress, cancellation suppression.
- Persistent read-only operations board; authenticated channel directory sync with LTx brand artwork.
- Durable reminder state, serviced by an authenticated scheduler endpoint, up to three five-minute reminders.
- Local file storage for development; Firestore transactions for deployed pilots.

## Deliberate pilot limits

This is a connection-test pilot, not an estate-wide production rollout. VoCoVo messages are **blocked**, never claimed delivered. No picking/acceptance/amendment writes are sent to Deliverect. The demo KDS controls affect fictional data only.

The pilot uses a bounded tenant aggregate: 500 retained orders, 250 event records and 200 alert records, with an 800 KB Firestore guard. Terminal order tombstones are preserved. Reaching capacity fails intake visibly/retryably; export/archive before continued use. Sharded event/outbox storage and provider workers are next, before scaling.

Setup, endpoint contracts, deployment and tomorrow's checklist: [Deliverect pilot guide](docs/DELIVERECT_PILOT.md).

Quest coexistence research and future KDS design: [Picking and provider roadmap](docs/PICKING_AND_PROVIDERS.md).
