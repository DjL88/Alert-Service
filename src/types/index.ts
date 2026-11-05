/**
 * Core Domain Models for Store Alerts
 * Deliverect x VoCoVo Middleware Platform
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  brandColor: string;
}

export interface Store {
  id: string;
  tenantId: string;
  name: string;
  locationCode: string;
  address: string;
  timezone: string;
  status: 'active' | 'suspended' | 'pending_registration';
  capacityStatus: 'open' | 'busy_10' | 'busy_20' | 'busy_30' | 'closed';
  coordinates: {
    lat: number;
    lng: number;
    xPercent: number; // for SVG interactive map positioning (0-100)
    yPercent: number;
  };
  avgPickTimeMinutes: number;
  createdAt: string;
}

export interface RegistrationMapping {
  id: string;
  storeId: string;
  tenantId: string;
  deliverectLocationId: string;
  deliverectChannelLinkId: string; // Registrar channel-link identifier
  registrarStatus: 'registered' | 'pending' | 'revoked' | 'unregistered';
  orderFeedProvisioned: boolean; // Order-event access is tracked separately!
  originatingChannelLinkIds: string[]; // Aggregator channel-links (Deliveroo, Uber, etc.)
  lastSyncAt: string;
  autoAcceptOrders: boolean;
}

export type ChannelId = 'deliveroo' | 'uber_eats' | 'just_eat' | 'direct_web' | string;

export interface ChannelConfig {
  id: ChannelId;
  name: string;
  brandColor: string;
  textColor: string;
  badgeBg: string;
  badgeBorder: string;
  isCustom?: boolean;
  logoSvg?: string;
}

export type DestinationType = 'vocovo' | 'live_screen' | 'webhook';

export interface DestinationCapabilities {
  spokenAnnouncements: boolean;
  persistentCards: boolean;
  updatingCards: boolean;
  groupTargeting: boolean;
  deliveryReceipts: boolean;
  healthChecks: boolean;
}

export interface Destination {
  id: string;
  storeId: string;
  tenantId: string;
  type: DestinationType;
  name: string;
  status: 'active' | 'simulated' | 'not_configured' | 'error';
  statusNote?: string;
  capabilities: DestinationCapabilities;
  config: {
    targetGroup?: string; // e.g. "Bakery Floor", "Packers", "General Kitchen"
    endpointUrl?: string;
    authType?: 'bearer' | 'basic' | 'mock';
    retryLimit: number;
    cooldownSeconds: number;
  };
  lastSuccessfulRequestAt?: string;
  lastDeliveryResult?: {
    status: 'accepted' | 'failed' | 'uncertain';
    message: string;
    timestamp: string;
    latencyMs: number;
  };
}

export type AlertTrigger =
  | 'new_order'
  | 'rider_arrived'
  | 'waiting_threshold'
  | 'unpicked_reminder'
  | 'order_cancelled';

export interface AlertRule {
  id: string;
  storeId: string;
  tenantId: string;
  name: string;
  trigger: AlertTrigger;
  enabled: boolean;
  thresholdValue?: number; // e.g. 3 for "3 orders waiting"
  reminderDelayMinutes?: number; // e.g. 5 minutes
  maxReminders?: number; // e.g. 2
  cooldownSeconds: number;
  quietHours?: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "07:00"
  };
  destinationIds: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  template: string;
}

export type OrderStatus = 'NEW' | 'PICKING' | 'READY_FOR_PICKUP' | 'DISPATCHED' | 'CANCELLED';
export type RiderStatus = 'NONE' | 'ASSIGNED' | 'NEARBY' | 'ARRIVED' | 'COLLECTED';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  notes?: string;
}

export interface OrderState {
  id: string; // Internal unique ID
  storeId: string;
  tenantId: string;
  sourceChannel: ChannelId;
  channelOrderId: string; // Upstream Deliverect or channel order ID
  displayOrderNumber: string; // Human-friendly ticket number, e.g. "#DEL-402"
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  riderStatus: RiderStatus;
  riderName?: string;
  riderEstimatedArrival?: string;
  placedAt: string;
  pickingStartedAt?: string;
  riderArrivedAt?: string;
  completedAt?: string;
  isWaitingToBePicked: boolean;
  reminderCount: number;
  lastReminderSentAt?: string;
  cancellationReason?: string;
  idempotencyHash: string;
}

export interface NormalizedEvent {
  id: string;
  source: 'deliverect' | 'simulator';
  sourceEventId: string;
  eventType:
    | 'order.created'
    | 'order.status_updated'
    | 'order.cancelled'
    | 'driver.status_updated'
    | 'store.registered';
  deliverectLocationId: string;
  internalStoreId?: string;
  internalTenantId?: string;
  channel: ChannelId;
  receivedAt: string;
  processingResult: 'processed' | 'duplicate_ignored' | 'rejected';
  summary: string;
  alertsCreatedCount: number;
  payload: Record<string, any>;
}

export interface Alert {
  id: string;
  storeId: string;
  tenantId: string;
  type: 'NEW_ORDER' | 'PICK_THRESHOLD_EXCEEDED' | 'RIDER_ARRIVED' | 'PICKING_REMINDER' | 'ORDER_CANCELLED' | 'TEST';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  message: string;
  relatedOrderIds: string[];
  createdAt: string;
  expiresAt: string;
  deduplicationKey: string;
  destinationIds: string[];
}

export interface DeliveryAttempt {
  id: string;
  alertId: string;
  storeId: string;
  destinationId: string;
  destinationName: string;
  destinationType: DestinationType;
  status: 'accepted' | 'failed' | 'uncertain';
  message: string;
  latencyMs: number;
  timestamp: string;
  idempotencyKey: string;
  isSimulated: boolean;
  playbackConfirmedByStaff: boolean; // Explicitly separate from provider accepted!
}
