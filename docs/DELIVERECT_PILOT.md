# Deliverect connection pilot — 6 November 2026

## Target

Observe a real staging registration, automatically map a location, receive a new order and its picking transition, and see the result in the integration console. Headset delivery is a separate milestone requiring VoCoVo documentation/access.

## Configure once per customer / provider

Set `INTEGRATIONS_JSON` as a server secret containing an array of profiles. Every profile has:

| Field | Purpose |
| --- | --- |
| `id` | URL-safe integration key, e.g. `vocovo-one-stop` |
| `tenantId` | Internal retailer boundary |
| `accountId` | Explicitly authorised Deliverect account |
| `provider` | `vocovo` or `screen` |
| `environment` | `staging` or `production` |
| `adminToken` | Random tenant console credential, at least 24 characters |
| `webhookSecret` | Deliverect channel/picking signing secret |
| `reportingSecret` | Independently configured reporting signing secret |
| `clientId`, `clientSecret` | Optional OAuth credentials for reading `/allChannels` |
| `statusMap` | Optional verified override, e.g. `{"picking:STARTED":"picking"}` |

Use the same `tenantId`, account and environment for a retailer's screen and headset profiles. Use different profile IDs and independent signing secrets where available. Never reuse an admin credential across retailers. Profiles are server configuration, not caller-selected tenant ownership.

Generate tokens with `openssl rand -hex 32`. Store deployed configuration in Secret Manager. The pilot UI uses an admin bearer token retained only in memory; use a restricted pilot audience. Replace this with managed user authentication/roles before wider rollout.

The profile registry is the initial manual setup. **Individual store assignment is automatic after signed registration.** Put the provider's site/store reference in Deliverect's external location ID (`channelLocationId`). This is a configured convention, not a promise that VoCoVo accepts that exact identifier; confirm its destination format next week. A registration cannot safely discover VoCoVo credentials or an unrelated store ID by itself.

For a platform-wide provider channel, a future account-install registry can select the authorised tenant after signature validation. This pilot deliberately uses account-specific profile URLs and never creates tenants from arbitrary incoming IDs.

## Callback contract

Base: `PUBLIC_ORIGIN/webhooks/deliverect/PROFILE_ID`

| Route | Signing secret | Purpose |
| --- | --- | --- |
| `/registration` | webhookSecret | register / active / inactive lifecycle |
| `/channel-status` | webhookSecret | Generic status callback for this channel |
| `/picking` | webhookSecret | Picking events with explicit picking statuses |
| `/orders` | reportingSecret | Full cross-channel order event |
| `/status` | reportingSecret | Reporting order status changes |

POST JSON, header `X-Server-Authorization-HMAC-SHA256`: hex HMAC-SHA256 over the exact raw request bytes. Body limit 512 KB. Invalid signatures return 401; wrong account 403; missing registration returns 409 for retry; capacity/storage failures return non-2xx. Verify Deliverect's retry policy in staging; do not assume 409 is automatically retried. Status-before-order is saved in a bounded durable pending inbox (100 entries) and replayed when the order arrives. Unmatched entries remain visible; no raw customer payload is stored.

Registration request:

```json
{
  "status": "register",
  "channelLinkId": "DELIVERECT_REGISTRAR_LINK_ID",
  "locationId": "DELIVERECT_LOCATION_ID",
  "channelLocationId": "VOCOVO_STORE_REFERENCE",
  "channelLinkName": "VoCoVo Alerts — Store 5112"
}
```

`register` saves the mapping; `active` enables it; `inactive` suppresses alerts while retaining the mapping. Register again does not re-enable an inactive link. Registration is idempotent for the same profile/link and rejects moving the link to a different store. Lifecycle callbacks are applied in arrival order: Deliverect's basic registration payload has no trusted sequence. Verify the final state after enable/disable tests.

The response returns only `statusUpdateURL` and `retailEventsWebhookURL` pointing to implemented handlers. The retail callback key comes from the LTx contract; it does not prove Deliverect provisioned that subscription. No menu, substitutions, amendment or payment callbacks are advertised. Confirm Deliverect accepts a registrar-only channel without menu/order-submission features.

**Staging signing:** some Channel integrations use the channelLinkId as the signing secret. Explicitly set that known value as `webhookSecret` for the test profile (24+ characters). Never derive an authentication secret from an unauthenticated payload. A profile using this scheme supports its known test link; multiple staging links require separately provisioned profiles or a verified-secret registry. Reporting signing is separately configured, not assumed identical.

## Order and status data

New order requires `_id` (or `orderId`), `account`, `location`, numeric `channel` and `status`. The actual `channelLink` is retained separately from the registrar link. Numeric IDs are resolved by an authenticated `/allChannels` sync, never hard-coded to marketplace names. Unknown IDs remain “Channel N”.

Status events require `orderId` and `status`. Location can be resolved only from a known order within the authenticated tenant. Use `timeStamp` / `_updated` to protect against reordering. Events without source timestamps use receipt time, with additional guards preventing acceptance from undoing picking or terminal state.

Picking accepts explicit `PICKING_STARTED`, `PICKING`, `IN_PROGRESS`, `PICKING_COMPLETE` and `PICKED`. It also reads `eventData.orderId` and `eventData.status` from the LTx envelope. Confirm the actual tenant's payload and add a tested mapping for other values; generic acceptance is not proof of picking.

Unknown statuses are surfaced in diagnostics; no invented numeric Quest status mapping. `70` is pickup-ready, not delivered. `90` means POS finalised, not proof of courier delivery. Scheduled `25` does not announce until a subsequent actionable status arrives.

This pilot does not fetch customer information or save raw payloads. It retains only operational identifiers, states and event outcomes.

## Deploy

1. Select a dedicated GCP staging project and enable Cloud Run, Firestore, Secret Manager and Cloud Scheduler. Choose Firestore's region before creating it.
2. Create a runtime service account with only Firestore access and access to the relevant secret versions.
3. Build/deploy the included Dockerfile (Node 24). Set `STORAGE_DRIVER=firestore`, `PUBLIC_ORIGIN` to the actual HTTPS service origin, and inject `INTEGRATIONS_JSON` and `SCHEDULER_TOKEN` from Secret Manager.
4. The webhook routes must be publicly reachable; the app validates HMAC itself. Admin routes separately require bearer authentication. Do not put an IAM sign-in wall in front of Deliverect callbacks.
5. Set Cloud Scheduler to POST `/internal/sweep` every minute with `Authorization: Bearer <SCHEDULER_TOKEN>`. Keep the job configuration private. A missing scheduler means reminders do not run; the console displays the last sweep.
6. Open Connect Deliverect, sign in and confirm the actual URLs before registering the channel. Never return an AI Studio preview URL from production registration.
7. Read the channel directory using credentials with the required scope. Channel credentials may not grant `/allChannels`; request the correct Store/POS access rather than widening scope silently.

No deployment has been performed by committing this code. No keep-alive pings are required. Firestore retains state across Cloud Run restarts. File mode is explicitly prohibited on Cloud Run/production.

## Tomorrow's test sequence

- [ ] Configure one account/profile, credentials and staging signing scheme.
- [ ] Confirm registrar-only channel approval and separate cross-channel reporting/picking feed scope.
- [ ] Deploy and verify `/healthz`, console authentication and reminder sweep timestamp.
- [ ] Register with external provider store ID; confirm automatically created mapping.
- [ ] Activate; sync channel directory; send a real test Deliveroo order.
- [ ] Confirm correct store/channel and exactly one new-order alert.
- [ ] Start picking in Quest; confirm state changes and reminders stop.
- [ ] Cancel an order; confirm it leaves the waiting count.
- [ ] Test duplicate delivery, disabled registration, re-registration and restart.
- [ ] Verify actual event latency; a post-fulfilment reporting feed cannot power new-order alerts.
- [ ] Check VoCoVo outcome remains “blocked — API contract and credentials required”.

## Pilot capacity / operations

One transactional Firestore document per tenant makes the initial state and alert-intent write atomic. It is intentionally bounded: 500 retained order tombstones, 250 event entries, 200 alerts, 800 KB maximum. It is not the estate-wide storage architecture. Move orders/events/outbox jobs into separate documents and durable task workers before a larger pilot or external provider delivery. Do not delete tombstones casually: that can replay old new-order alerts.

A provider API accepting a request is not proof that a colleague heard it. The screen output is labelled “available”, not acknowledged or played.
