# Store Alerts — Deliverect x VoCoVo Middleware & Operations Console

A high-reliability store alerting platform that acts as the middleware bridge between order aggregation sources (starting with Deliverect) and real-time operational destinations (VoCoVo staff headsets, live kitchen display screens, and notification webhooks). Built specifically to solve order queue blindness, delayed staff reaction times, and driver arrival bottlenecks with deterministic alerts and verifiable delivery tracking.

> [!IMPORTANT]
> **Confirmed Design & Technical Decisions (Phase 1 Alignment)**:
> - **Headset Audio Preview**: Interactive Web Audio API chime generator + Web Speech API synthesized voice alerts ("*New Deliveroo order #304*", "*Uber Eats driver arrived at pickup bay*") with an instant mute toggle and audible reminder cadence.
> - **Channel Ecosystem & Logo Importer**: Pre-configured SVG badges and brand themes for Deliveroo (Teal), Uber Eats (Green), Just Eat / Takeaway (Orange), and Direct Web (Blue), plus an interactive Custom Channel Manager allowing managers to upload custom SVG/PNG logos, channel codes, and color accents.
> - **Visual Theme & Operational Ergonomics**: High-visibility light kitchen display style with high-contrast text, clear status buckets (*New / Unpicked*, *In Progress / Picking*, *Rider Arrived / Ready*, *Dispatched / Done*), and zero-pill typographic discipline.
> - **Strict Architectural Boundaries**: Pure deterministic message templates (no LLM in the operational loop), separated source/destination adapters, clear distinction between "Provider accepted" and "Heard by staff", and mock repository interfaces ready for Phase 2 Cloud Run / Firestore persistence.

---

## 1. Overview & Core Concept

### What It Does
"Store Alerts" serves as a unified operational message hub between retail delivery aggregators (Deliverect) and in-store staff execution endpoints (VoCoVo smart headsets, kitchen display screens, and external alert systems). It ingests location registrations, receives incoming orders and rider updates, normalizes lifecycle statuses into uniform store queues, evaluates configurable alert threshold rules (such as "*3 orders waiting to be picked*"), and dispatches targeted alerts with guaranteed deduplication and delivery audit trails.

### Target Audience & Persona
- **Store Managers & Shift Supervisors**: Need real-time visibility into incoming orders across delivery aggregators, active headset routing, and missed/failed alert logs.
- **Kitchen & Fulfillment Staff**: Wear VoCoVo wireless headsets and watch the in-store Live Screen to immediately know when a high-priority order arrives, when 3+ orders are piling up, or when a rider is waiting outside.
- **Enterprise Operations & IT Admins**: Manage multiple retail brands ("Artisan Bakery Co." and "Metro Express Mart") and individual store branches, mapping external Deliverect channel-link IDs to internal stores and routing policies.

### Key Value Delivered
- Eliminates tablet clutter by unifying Deliveroo, Uber Eats, and Just Eat orders into a single live screen and headset alert pipeline.
- Prevents delivery SLA penalties by alerting staff instantly when orders sit unpicked or when riders arrive at the store.
- Guarantees idempotent event processing so webhook retries and duplicate events never trigger duplicate headset chimes or ghost tickets.

---

## 2. User Experience & Visual Design

### The 7 Core Navigation Views
1. **Overview Dashboard**: High-level operational pulse across all stores. Shows waiting order counts, active destination health, registration mappings status, delivery failure rates, and quick action simulators.
2. **Stores & Registration Mappings**: Multi-tenant directory of retail brands and stores. Configures Deliverect location IDs, registrar channel links, active destination bindings, and operational status.
3. **Live Store Screen (KDS Mode)**: Full-viewport, high-visibility operations board designed for wall-mounted kitchen monitors. Organizes orders into clear visual buckets (*New Orders*, *Picking in Progress*, *Rider Arrived / Awaiting Handover*, and *Recent Dispatches*), featuring real-time timers, urgent threshold banners, and audio chime controls.
4. **Event Simulator**: Interactive interactive vertical slice allowing operators to inject simulated Deliverect events:
   - Register & activate a store
   - Send new Deliveroo / Uber Eats / Just Eat order
   - Simulate duplicate webhook (proves idempotency)
   - Trigger "Picking Started" (moves order and suppresses reminders)
   - Trigger "Driver Arrived at Store" (audible headset alert)
   - Trigger "Order Cancelled" (removes from queue and invalidates alerts)
   - Simulate VoCoVo provider timeout / simulated delivery retry
5. **Event Timeline**: Chronological audit trail showing raw inbound payloads $\to$ normalization $\to$ rule evaluation $\to$ destination dispatch outcomes.
6. **Destinations Console**: Status of all output providers (Live Screen [Active], VoCoVo Headsets [Configured / Simulated], Webhook Adapter). Displays capabilities, endpoint health, last delivery result, and interactive test alert buttons.
7. **Alert Rules Engine**: Threshold configurations per store (e.g. "*Trigger voice alert when $\ge 3$ orders are waiting*", "*Rider arrived chime*", "*5-minute unpicked reminder with max 2 repeats*", quiet hours, and channel-specific priority overrides).

### Visual Identity & Kitchen Ergonomics
- **Display Typography**: `Plus Jakarta Sans` for clean, confident display hierarchy and operational readability.
- **Monospace Telemetry**: `JetBrains Mono` with `tabular-nums` for timestamps, order numbers, elapsed pick timers, and payload JSON inspectors.
- **Color Discipline (Light KDS Mode)**:
  - Canvas: Clean neutral zinc-50 (`#FAFAFA`) and cool white cards (`#FFFFFF`) with subtle 1px borders (`#E4E4E7`).
  - Channel Identity Colors: Deliveroo Cyan (`#00CDBC`), Uber Eats Emerald (`#06C167`), Just Eat Orange (`#FF8000`), Direct Web Royal (`#2563EB`).
  - Status Accents: Rose (`#E11D48`) for urgent waiting thresholds, Amber (`#D97706`) for approaching pick SLA, Emerald (`#059669`) for active fulfillment, Violet (`#7C3AED`) for rider arrived.
- **Audio Synthesis**: High-fidelity Web Audio synthetic 2-tone chimes (880Hz $\to$ 1320Hz bell) preceding clean browser Speech Synthesis with rate and pitch tuned for industrial headset intelligibility.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale & Alternatives Considered |
| :--- | :--- | :--- |
| **Alert Composer** | **Deterministic String & Audio Templates** | **Strictly no LLM**. Operational alerts require sub-50ms latency, zero hallucination risk, and predictable syntax (e.g. `"New Deliveroo order #{orderNumber} with {itemCount} items"`). |
| **Provider Acceptance Semantics** | **Separation of "Provider Accepted" vs "Heard by Staff"** | VoCoVo API acceptance only confirms the network packet reached the base station, not that staff listened or were on-channel. Explicit labeling prevents false compliance assumptions. |
| **Deliverect Channel Separation** | **Registrar Link vs Originating Channel Link** | Separate the Deliverect registrar channel-link ID (used for store location mapping) from the originating aggregator channel ID (Deliveroo/Uber Eats). Prevents conflating location registration with order data entitlements. |
| **State Storage (Stage 1)** | **In-Memory Store Pattern with Reactive Subscriptions** | Provides immediate, synchronous UI responsiveness, time-travel simulation, and zero external dependency friction while keeping clean interfaces that plug directly into Firestore in Stage 2. |
| **Delivery Deduplication** | **Content-Hash & Source Event ID Idempotency Key** | Prevents duplicate delivery webhooks from creating second orders or re-triggering headset voice announcements. |

---

## 4. Technical Architecture & Data Strategy

### System Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                   INBOUND EVENT INTAKE (DELIVERECT)                    │
│  - Webhook Receiver & Signature Validator (Simulated/Contract)         │
│  - Event Deduplicator (SourceEventId + LocationId Idempotency Cache)   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 EVENT NORMALIZER & STORE MAPPER                        │
│  - Maps External Location ID ───► Internal Tenant / Store ID           │
│  - Normalizes Channel: Deliveroo | Uber Eats | Just Eat | Custom       │
│  - Maps Lifecycle: PLACED | CONFIRMED | PICKING | RIDER_ARRIVED | DONE │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                STORE ORDER STATE & ALERT RULE ENGINE                   │
│  - Maintains Waiting Queue & Elapsed Pick Timers                       │
│  - Evaluates Threshold Rules (e.g., "Queue Count >= 3", "Rider Inside")│
│  - Manages Delayed Reminders (Suppressed if picking started/cancelled) │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
            ┌──────────────────────┴──────────────────────┐
            ▼                                             ▼
┌───────────────────────────────┐             ┌─────────────────────────┐
│     LIVE SCREEN ADAPTER       │             │     VOCOVO ADAPTER      │
│  - Bucket Organization        │             │  - TTS Audio Synthesizer│
│  - Real-time Snapshot Sync    │             │  - Web Audio Chime Bell │
│  - Color-Coded Brand Badges   │             │  - Status: SIMULATED    │
│  - Zero Acceptance Overrides  │             │  - Audit Logs & Retries │
└───────────────────────────────┘             └─────────────────────────┘
```

### Core TypeScript Data Entities
- **Tenant & Store**: `Tenant { id, name, slug }`, `Store { id, tenantId, name, locationCode, address, timezone, status }`.
- **RegistrationMapping**: `RegistrationMapping { id, storeId, deliverectLocationId, deliverectChannelLinkId, registrarStatus, orderFeedProvisioned, lastSyncAt }`.
- **Destination**: `Destination { id, storeId, type: 'vocovo' | 'live_screen' | 'webhook', name, config, status, lastDeliveryResult, capabilities }`.
- **OrderState**: `OrderState { id, storeId, sourceChannel, channelOrderId, displayOrderNumber, customerName, items, status, placedAt, pickingStartedAt, riderArrivedAt, completedAt, isWaitingToBePicked }`.
- **Alert & DeliveryAttempt**: `Alert { id, storeId, type, priority, message, orderId, deduplicationKey, createdAt, expiresAt }`, `DeliveryAttempt { id, alertId, destinationId, status: 'accepted' | 'failed' | 'uncertain', error, responseLatencyMs, timestamp }`.
- **AlertRule**: `AlertRule { id, storeId, trigger: 'new_order' | 'rider_arrived' | 'waiting_threshold' | 'reminder', thresholdValue, cooldownSeconds, quietHours, destinations }`.

### Pre-loaded Multi-Tenant Demonstration Dataset
- **Retailer 1: "Artisan Deli & Bakery Co."**
  - Store 1: *Soho Flagship (Location #DEL-8812)* — Configured with Live Kitchen Screen and VoCoVo Headsets (Bakery & Counter headsets).
  - Store 2: *Covent Garden Branch (Location #DEL-8813)* — Configured with Live Screen.
- **Retailer 2: "Metro Fresh Express"**
  - Store 1: *Shoreditch Superstore (Location #DEL-9401)* — Configured with VoCoVo Headsets (Floor & Picker groups).
  - Store 2: *King's Cross Station (Location #DEL-9402)* — High-speed pick branch.

---

## 5. Step-by-Step Implementation Sequence

1. **Core Type Definitions & Domain Contracts**: Implement pure TypeScript models for Tenant, Store, Event, OrderState, Destination, Alert, Rule, and DeliveryAttempt.
2. **Deterministic Alert & Audio Engine**: Build the browser Web Audio synthesizer (multi-harmonic chime) and Web Speech API announcer with mute toggle and volume control.
3. **Simulated Event Source & Normalizer**: Ingest simulated Deliverect order payloads, map channel links to internal store records, and normalize statuses.
4. **Order State Manager & Rule Engine**: Maintain store queues, compute waiting order metrics, trigger threshold alerts (e.g. 3+ orders), handle cancellations, and re-check order status before reminder alerts.
5. **Channel Logo & Asset Library**: Pre-built vector logos for Deliveroo, Uber Eats, Just Eat, and Direct Web, plus an interactive Custom Channel Logo modal allowing image/SVG imports.
6. **7 High-Visibility Views**:
   - *Overview Dashboard*
   - *Stores & Registration Mappings*
   - *Live Store Screen (KDS)*
   - *Event Simulator (Step-by-step interactive vertical slice)*
   - *Event Timeline & Raw Log Inspector*
   - *Destinations Console (VoCoVo simulated status & test chimes)*
   - *Alert Rules Configuration*
7. **Verification**: Run `compile_applet` and `lint_applet` to ensure zero compilation or type errors.
