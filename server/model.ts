export type Profile = {
  id: string; tenantId: string; accountId: string; provider: 'vocovo' | 'screen';
  adminToken: string; webhookSecret: string; reportingSecret: string;
  clientId?: string; clientSecret?: string;
  environment: 'staging' | 'production';
  /** Map only statuses verified with the partner for this account. */
  statusMap?: Record<string, OrderPhase>;
};
export type OrderPhase = 'waiting' | 'picking' | 'ready' | 'completed' | 'cancelled' | 'scheduled' | 'unknown';
export type Mapping = { id: string; profileId: string; locationId: string; externalLocationId: string;
  channelLinkId: string; name: string; state: 'registered' | 'active' | 'inactive'; provider: string; updatedAt: string };
export type Order = { id: string; locationId: string; channelId: string; sourceChannelLinkId: string;
  displayId: string; phase: OrderPhase; sourceStatus: string; updatedAt: string;
  receivedAt: string; lastReminderAt?: string; reminders: number };
export type Event = { id: string; kind: string; at: string; orderId?: string; locationId?: string;
  result: string; profileId: string; sourceStatus?: string };
export type Alert = { id: string; locationId: string; orderId: string; message: string; createdAt: string;
  expiresAt: string; mappingId: string; provider: string; status: 'screen_available' | 'blocked' | 'suppressed'; reason?: string };
export type PendingEvent = { id: string; profileId: string; kind: string; receivedAt: string; body: Record<string, string | number> };
export type MappingRule = { id: string; name: string; enabled: boolean; channelName: string; event: string; destination: 'kds' | 'vocovo' | 'webhook'; template: string; overrides?: Record<string,string>; updatedAt: string }; 
export type Integrator = {id:string;name:string;channelName:string;channelId?:string;endpoint:string;enabled:boolean;updatedAt:string};
export type TenantLocation = {id:string;accountId:string;name:string;registeredAt:string;updatedAt:string};
export type State = { accountId?:string; locations?:TenantLocation[]; integrators?: Integrator[]; rules?: MappingRule[]; pendingEvents?: PendingEvent[]; mappings: Mapping[]; orders: Order[]; events: Event[]; alerts: Alert[];
  channels: { channelId: string | number; name: string }[]; channelsSyncedAt?: string;
  lastFeedAt?: string; lastSweepAt?: string };
export const emptyState = (): State => ({mappings: [], orders: [], events: [], alerts: [], channels: []});
