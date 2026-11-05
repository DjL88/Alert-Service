# Quest coexistence and output roadmap

## Evidence checked 5 November 2026

- Retail Channel webhooks document picking status, amendments and substitution callbacks: https://developers.deliverect.com/v2.0-retail/reference/retail-channel-webhooks
- The public KDS API documents an order notification webhook: https://developers.deliverect.com/v1.1-restaurants/reference/kds_order_notification
- API scopes distinguish genericChannel, store, genericPOS and genericKDS: https://resources.developers.deliverect.com/en/articles/13628364-api-authentication-and-scope
- Order status meanings: https://resources.developers.deliverect.com/en/articles/14468814-order-and-courier-statuses
- Integrated channel directory: https://www.postman.com/deliverect/api-team/documentation/edifiys/deliverect-public-api
- VoCoVo describes notification-to-speech APIs and portal-issued tokens: https://www.vocovo.com/en-GB/solutions/fully-connected-store/integrations

These sources do not establish that a separately registered picking integration can subscribe to all Quest orders without replacing or competing with Quest. A Channel callback normally follows that channel's orders. A registrar alone does not confer access to Deliveroo/Uber Eats/Just Eat data.

## What to ask Deliverect

1. Can a partner receive a read-only, location-scoped feed of all new orders and Quest picking/amendment/courier events while Quest remains the fulfilment owner?
2. Is the appropriate contract Reporting, Retail Picking, KDS, or an internal event subscription? What scope and onboarding provision it?
3. Can a registrar-only channel activate/deactivate that subscription automatically? Are menu callbacks optional?
4. What are the exact signing, timestamps, event IDs, retry guarantees and status schemas? Can we replay missing events or obtain a current-state snapshot?
5. For a future retail KDS: can a third-party device claim an order, pick/amend/substitute items and release ownership while Quest is also logged in? What concurrency/version checks prevent two pickers editing one order?
6. Does registration/picking callback routing support a second observer, or would configuring it overwrite an existing integration?

## Safe first version

The live board observes events only. Quest remains in control; no accept, pick, refund, cancellation or substitution API calls are implemented. The original demo's controls remain fictional and are visibly labelled.

The backend separates normalised order state, registration mappings and output alert intents. Provider-specific defaults are chosen by the registrar profile. A location can have screen and VoCoVo destinations independently. Credentials remain in server secret storage.

## VoCoVo discovery call

Obtain the supported hardware/firmware list, integration entitlement, API base URLs, token scope, destination/store/group ID schema, message format (text or audio), text length/language limits, priorities, queue interruption rules, idempotency, delivery receipts, rate limits and offline behaviour. Confirm whether a provider site reference in registration can directly identify the correct store/group.

Implement a queued provider worker only against that contract. Retry safely with bounded backoff and expire obsolete announcements. Distinguish queued, provider accepted, playback confirmed (only if evidenced), failed and uncertain delivery.

## Next capabilities

- Voice + screen routing: one alert to the picking group; persistent card on the operations board.
- Threshold summaries: coalesce several arrivals into “three orders waiting”.
- Escalation: oldest waiting order to the duty manager after a configured SLA.
- Courier arrival and substitution-response alerts when the upstream feed supports them.
- Screen acknowledgement independent of accepting/picking an order.
- Retail KDS with item scanning and partial fulfilment only after confirmed shared ownership, versioned writes and conflict handling.

## LTx lessons incorporated

Source reference: user-supplied clean LTx handover, 4 November 2026. No customer data/configuration/secrets were copied.

- Match by stable account/location/link IDs, not labels or browser origin.
- Keep registration separate from evidence that a subscription actually delivers events.
- Preserve store ownership on disable; stop outputs without deleting mappings.
- Use a configured public callback origin.
- Keep registrar link and originating order channel link distinct.
- Treat generic acceptance separately from explicit picking-started evidence.
- Reuse channel artwork and resolve source numeric IDs from the channel directory.
- Persist work before acknowledging requests; keep state outside browsers/ephemeral instances.

Artwork in public/brand/channels is from Dave's LTx user-approved design pack; it is not a claim of official brand approval. Display labels omit “.nl” from Thuisbezorgd and “.com” from Takeaway. JET Go follows the previously approved Just Eat artwork convention.
