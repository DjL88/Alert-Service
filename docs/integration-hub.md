# Integration hub — implementation contract

## Principles
- One authenticated Deliverect source integration per configured account/environment. A Deliverect channel identity must be confirmed using the registration callback and verified channel ID; never trust name alone as an authorization key.
- **Integrator** is a super-admin managed destination definition (VoCoVo, generic HTTPS, local KDS). Each has a name, verified channel identities, event subscriptions, endpoint configuration, payload template, authentication secret reference, retry policy and enable/disable switch.
- **Tenant** binds a permitted integrator to selected registered locations. Tenant admin can view all tenant locations, status and delivery results, but cannot edit destination URLs or secrets.
- **Store** can read only its own KDS and acknowledgement operations. Store credentials cannot read all tenant orders.
- One incoming event can fan out to KDS and multiple configured destinations. Deduplicate by provider event key and track each destination delivery separately.
- Raw incoming payload is retained briefly in an encrypted, access-controlled store for diagnostics, with sensitive fields redacted in previews. The normalised field catalog and field-path overrides are versioned, and unknown fields are never silently executed.

## Registration
1. Super admin creates an integrator and selects expected Deliverect channel name and ID when available.
2. App creates an immutable registration callback URL and verifies Deliverect HMAC, account, channel link, location and allowed integration identity.
3. Record tenant/location/channel-link mapping and activation state. Reject conflicting registrations; require explicit rebind.
4. Registration responses advertise only callbacks implemented and verified for that integration. Deliverect provisioning is still an upstream prerequisite.
5. Integrator changes are versioned/audited. Never allow arbitrary URL selection in inbound event data.

## Rules
- Match: event type, canonical channel ID/name, location, order status and optional predicates.
- Normalize: orderID, orderDisplayID, itemCount, channelName, channelID, locationID, status, courierArrivedAtPickup, occurredAt.
- Transform: restricted JSON template with typed placeholders; no JavaScript, expressions, network calls or user-supplied code.
- Deliver: queue durable jobs after committing event, per-destination idempotency key, bounded retries with backoff, delivery log and manual retry for authorised super admins.
- Outbound HTTP: HTTPS only; DNS/IP and redirect protections against SSRF, request timeouts, allowlisted hostnames, secrets from secret manager, no credentials in UI or logs.
- Previews are side-effect-free. Enabled rules do not deliver until destination is validated and activated by super admin.

## Access
| Role | Integrators | Locations | KDS | Deliveries |
| --- | --- | --- | --- | --- |
| Super admin | CRUD, secrets, activation | all authorised tenants | audit | all |
| Tenant admin | read only | all own tenant | all own tenant | own tenant read |
| Store user | none | assigned store only | assigned store | no credentials |

Backend authorisation is mandatory on every route; hiding controls is not access control. Store tokens are scoped by tenant AND location. Rotate and revoke credentials, audit changes.

## Deliverect busy mode and store availability
Represent **busy mode**, **temporary open/closed**, **scheduled trading hours**, and **channel availability** as separate concepts. Each event records provider timestamp, received timestamp, source, store, channel, old/new value and freshness. Missing events are **unknown**, not assumed open.
Support configured mappings for verified Deliverect callbacks; if a provider only exposes state through a read endpoint, poll within API limits with a freshness marker. Do not infer busy mode from order volume or undocumented statuses. Report duration and state transitions only from confirmed events.

## Android direction
The React KDS can be wrapped with Capacitor for an APK distributed to owned hardware, but reliable background alerting requires a native foreground service, Android notification/audio handling, boot recovery, network reconnect, device provisioning and kiosk policies. No Play Store distribution is required. Do not assume wrapping a browser page guarantees audio in the background.

## Current implementation status
- Existing source webhooks, registration and tenant-scoped console are pilot foundations.
- Mapping CRUD, field-path overrides and JSON preview exist in PR #4, but **no automatic outbound dispatcher**.
- Current access tokens are tenant-wide admin tokens; **not suitable for store-only KDS**.
- VoCoVo request schema, auth and targeting remain unverified.
- Busy-mode and opening/closing event ingestion is not implemented.
- These are requirements, not claims of completed production functionality.
