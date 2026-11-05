import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tenant,
  Store,
  RegistrationMapping,
  Destination,
  AlertRule,
  OrderState,
  NormalizedEvent,
  Alert,
  DeliveryAttempt,
  ChannelConfig,
  ChannelId,
  OrderStatus,
  RiderStatus,
} from '../types';
import { audioService } from '../services/audioService';
import { DEFAULT_CHANNELS } from '../services/channelLogos';

interface StoreContextType {
  tenants: Tenant[];
  stores: Store[];
  selectedTenantId: string;
  selectedStoreId: string;
  selectedTenant: Tenant;
  selectedStore: Store;
  setSelectedTenantId: (id: string) => void;
  setSelectedStoreId: (id: string) => void;
  setStoreCapacity: (storeId: string, status: Store['capacityStatus']) => void;

  registrationMappings: RegistrationMapping[];
  currentMapping?: RegistrationMapping;
  updateRegistrationMapping: (mappingId: string, updates: Partial<RegistrationMapping>) => void;

  destinations: Destination[];
  currentStoreDestinations: Destination[];
  updateDestination: (destinationId: string, updates: Partial<Destination>) => void;
  testDestination: (destinationId: string) => Promise<void>;

  alertRules: AlertRule[];
  currentStoreRules: AlertRule[];
  updateAlertRule: (ruleId: string, updates: Partial<AlertRule>) => void;

  orders: OrderState[];
  currentStoreOrders: OrderState[];
  waitingOrdersCount: number;

  events: NormalizedEvent[];
  alerts: Alert[];
  deliveryAttempts: DeliveryAttempt[];

  channels: Record<string, ChannelConfig>;
  updateChannelConfig: (channelId: string, updates: Partial<ChannelConfig>) => void;
  customChannels: Record<string, ChannelConfig>;
  addCustomChannel: (channel: ChannelConfig) => void;

  isAudioMuted: boolean;
  toggleAudioMute: () => void;
  audioQueueState: {
    queueLength: number;
    currentMessage?: string;
  };

  // Simulator actions
  simulator: {
    registerAndActivateStore: () => void;
    sendNewOrder: (channel?: ChannelId, itemsCount?: number, targetStoreId?: string) => void;
    sendDuplicateEvent: (targetOrderId?: string) => void;
    startPicking: (orderId: string) => void;
    markReadyForPickup: (orderId: string) => void;
    riderArrived: (orderId: string) => void;
    completeHandover: (orderId: string) => void;
    cancelOrder: (orderId: string, reason?: string) => void;
    triggerWaitingThreshold: () => void;
    simulateProviderFailure: (destinationId: string) => void;
    retryDelivery: (attemptId: string) => void;
    resetDemoData: () => void;
  };
}

// Initial Fictional Retailers
const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant_artisan',
    name: 'Artisan Deli & Bakery Co.',
    slug: 'artisan-bakery',
    brandColor: '#B45309', // Warm amber-brass
  },
  {
    id: 'tenant_metro',
    name: 'Metro Fresh Express',
    slug: 'metro-fresh',
    brandColor: '#0F766E', // Modern teal-emerald
  },
];

// Initial Stores (2 per retailer)
const INITIAL_STORES: Store[] = [
  {
    id: 'store_soho',
    tenantId: 'tenant_artisan',
    name: 'Soho Flagship Store',
    locationCode: 'DEL-8812',
    address: '42 Dean Street, Soho, London W1D 4PX',
    timezone: 'Europe/London',
    status: 'active',
    capacityStatus: 'open',
    coordinates: {
      lat: 51.5133,
      lng: -0.1332,
      xPercent: 38,
      yPercent: 48,
    },
    avgPickTimeMinutes: 4.5,
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'store_covent',
    tenantId: 'tenant_artisan',
    name: 'Covent Garden Branch',
    locationCode: 'DEL-8813',
    address: '18 Henrietta St, Covent Garden, London WC2E 8QH',
    timezone: 'Europe/London',
    status: 'active',
    capacityStatus: 'open',
    coordinates: {
      lat: 51.5117,
      lng: -0.1233,
      xPercent: 52,
      yPercent: 54,
    },
    avgPickTimeMinutes: 5.1,
    createdAt: '2026-02-10T10:30:00Z',
  },
  {
    id: 'store_shoreditch',
    tenantId: 'tenant_metro',
    name: 'Shoreditch Superstore',
    locationCode: 'DEL-9401',
    address: '112 Commercial St, Shoreditch, London E1 6LZ',
    timezone: 'Europe/London',
    status: 'active',
    capacityStatus: 'busy_10',
    coordinates: {
      lat: 51.5233,
      lng: -0.0769,
      xPercent: 74,
      yPercent: 38,
    },
    avgPickTimeMinutes: 6.8,
    createdAt: '2026-01-20T11:00:00Z',
  },
  {
    id: 'store_kingsx',
    tenantId: 'tenant_metro',
    name: 'King’s Cross Station Express',
    locationCode: 'DEL-9402',
    address: 'Unit 4B The Concourse, King’s Cross, London N1 9AL',
    timezone: 'Europe/London',
    status: 'active',
    capacityStatus: 'open',
    coordinates: {
      lat: 51.5309,
      lng: -0.1238,
      xPercent: 46,
      yPercent: 24,
    },
    avgPickTimeMinutes: 3.8,
    createdAt: '2026-03-01T08:00:00Z',
  },
];

// Initial Registration Mappings (Separates Registrar Link from Originating Aggregator links!)
const INITIAL_MAPPINGS: RegistrationMapping[] = [
  {
    id: 'map_soho',
    storeId: 'store_soho',
    tenantId: 'tenant_artisan',
    deliverectLocationId: 'LOC-DEL-8812',
    deliverectChannelLinkId: 'REG_LINK_DELIV_8812',
    registrarStatus: 'registered',
    orderFeedProvisioned: true,
    originatingChannelLinkIds: ['CHAN_DELIVEROO_SOHO_01', 'CHAN_UBEREATS_SOHO_02', 'CHAN_JUSTEAT_SOHO_03'],
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    autoAcceptOrders: true,
  },
  {
    id: 'map_covent',
    storeId: 'store_covent',
    tenantId: 'tenant_artisan',
    deliverectLocationId: 'LOC-DEL-8813',
    deliverectChannelLinkId: 'REG_LINK_DELIV_8813',
    registrarStatus: 'registered',
    orderFeedProvisioned: true,
    originatingChannelLinkIds: ['CHAN_DELIVEROO_COV_01', 'CHAN_UBEREATS_COV_02'],
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    autoAcceptOrders: true,
  },
  {
    id: 'map_shoreditch',
    storeId: 'store_shoreditch',
    tenantId: 'tenant_metro',
    deliverectLocationId: 'LOC-DEL-9401',
    deliverectChannelLinkId: 'REG_LINK_DELIV_9401',
    registrarStatus: 'registered',
    orderFeedProvisioned: true,
    originatingChannelLinkIds: ['CHAN_DELIVEROO_SHORE_01', 'CHAN_UBEREATS_SHORE_02', 'CHAN_JUSTEAT_SHORE_03'],
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    autoAcceptOrders: true,
  },
  {
    id: 'map_kingsx',
    storeId: 'store_kingsx',
    tenantId: 'tenant_metro',
    deliverectLocationId: 'LOC-DEL-9402',
    deliverectChannelLinkId: 'REG_LINK_DELIV_9402',
    registrarStatus: 'pending',
    orderFeedProvisioned: false, // Order feed not yet enabled!
    originatingChannelLinkIds: [],
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    autoAcceptOrders: false,
  },
];

// Initial Output Destinations (Live Screen + VoCoVo Headsets)
const INITIAL_DESTINATIONS: Destination[] = [
  // Soho destinations
  {
    id: 'dest_soho_screen',
    storeId: 'store_soho',
    tenantId: 'tenant_artisan',
    type: 'live_screen',
    name: 'Kitchen Live Display (Wall Screen)',
    status: 'active',
    statusNote: 'Connected via real-time reactive state socket',
    capabilities: {
      spokenAnnouncements: false,
      persistentCards: true,
      updatingCards: true,
      groupTargeting: false,
      deliveryReceipts: true,
      healthChecks: true,
    },
    config: {
      targetGroup: 'Kitchen KDS',
      retryLimit: 3,
      cooldownSeconds: 0,
    },
    lastSuccessfulRequestAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    lastDeliveryResult: {
      status: 'accepted',
      message: 'Card snapshot rendered on client display',
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      latencyMs: 14,
    },
  },
  {
    id: 'dest_soho_vocovo',
    storeId: 'store_soho',
    tenantId: 'tenant_artisan',
    type: 'vocovo',
    name: 'VoCoVo Staff Headsets (Channel 1 - Counter & Packing)',
    status: 'simulated',
    statusNote: 'Not configured with production credentials. Operating in certified simulation mode.',
    capabilities: {
      spokenAnnouncements: true,
      persistentCards: false,
      updatingCards: false,
      groupTargeting: true,
      deliveryReceipts: true,
      healthChecks: false,
    },
    config: {
      targetGroup: 'Bakery & Pick Team',
      endpointUrl: 'https://api.vocovo.com/v1/broadcast (Simulated)',
      authType: 'mock',
      retryLimit: 3,
      cooldownSeconds: 15,
    },
    lastSuccessfulRequestAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    lastDeliveryResult: {
      status: 'accepted',
      message: 'Provider accepted audio transmission packet (Staff playback unconfirmed)',
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      latencyMs: 142,
    },
  },
  // Shoreditch destinations
  {
    id: 'dest_shoreditch_screen',
    storeId: 'store_shoreditch',
    tenantId: 'tenant_metro',
    type: 'live_screen',
    name: 'Packing Station Screen #1',
    status: 'active',
    statusNote: 'Display active',
    capabilities: {
      spokenAnnouncements: false,
      persistentCards: true,
      updatingCards: true,
      groupTargeting: false,
      deliveryReceipts: true,
      healthChecks: true,
    },
    config: {
      targetGroup: 'Main Floor',
      retryLimit: 2,
      cooldownSeconds: 0,
    },
  },
  {
    id: 'dest_shoreditch_vocovo',
    storeId: 'store_shoreditch',
    tenantId: 'tenant_metro',
    type: 'vocovo',
    name: 'VoCoVo Headsets (Floor Supervisors)',
    status: 'simulated',
    statusNote: 'Not configured. Operating in browser TTS simulation mode.',
    capabilities: {
      spokenAnnouncements: true,
      persistentCards: false,
      updatingCards: false,
      groupTargeting: true,
      deliveryReceipts: true,
      healthChecks: false,
    },
    config: {
      targetGroup: 'Supervisors Group',
      authType: 'mock',
      retryLimit: 3,
      cooldownSeconds: 15,
    },
  },
];

// Initial Rules
const INITIAL_RULES: AlertRule[] = [
  {
    id: 'rule_soho_new',
    storeId: 'store_soho',
    tenantId: 'tenant_artisan',
    name: 'New Order Headset Announcement',
    trigger: 'new_order',
    enabled: true,
    cooldownSeconds: 5,
    destinationIds: ['dest_soho_screen', 'dest_soho_vocovo'],
    priority: 'high',
    template: 'New {channelName} order {orderNumber} with {itemCount} items',
  },
  {
    id: 'rule_soho_threshold',
    storeId: 'store_soho',
    tenantId: 'tenant_artisan',
    name: 'High Volume Queue Threshold (3+ Waiting)',
    trigger: 'waiting_threshold',
    enabled: true,
    thresholdValue: 3,
    cooldownSeconds: 60,
    destinationIds: ['dest_soho_vocovo', 'dest_soho_screen'],
    priority: 'urgent',
    template: 'Attention team: {count} delivery orders waiting to be picked',
  },
  {
    id: 'rule_soho_rider',
    storeId: 'store_soho',
    tenantId: 'tenant_artisan',
    name: 'Rider Arrived at Store Alert',
    trigger: 'rider_arrived',
    enabled: true,
    cooldownSeconds: 10,
    destinationIds: ['dest_soho_vocovo', 'dest_soho_screen'],
    priority: 'urgent',
    template: '{channelName} driver has arrived for order {orderNumber}',
  },
  {
    id: 'rule_soho_reminder',
    storeId: 'store_soho',
    tenantId: 'tenant_artisan',
    name: 'Unpicked Order 5-Min Reminder',
    trigger: 'unpicked_reminder',
    enabled: true,
    reminderDelayMinutes: 5,
    maxReminders: 2,
    cooldownSeconds: 120,
    destinationIds: ['dest_soho_vocovo'],
    priority: 'high',
    template: 'Reminder: Order {orderNumber} has been waiting {minutes} minutes without picking',
  },
  {
    id: 'rule_soho_cancel',
    storeId: 'store_soho',
    tenantId: 'tenant_artisan',
    name: 'Order Cancellation Notice',
    trigger: 'order_cancelled',
    enabled: true,
    cooldownSeconds: 0,
    destinationIds: ['dest_soho_vocovo', 'dest_soho_screen'],
    priority: 'high',
    template: 'Order {orderNumber} was cancelled by {channelName}. Stop picking.',
  },
];

// Initial Seed Orders for Soho Flagship
const INITIAL_ORDERS: OrderState[] = [
  {
    id: 'ord_int_101',
    storeId: 'store_soho',
    tenantId: 'tenant_artisan',
    sourceChannel: 'deliveroo',
    channelOrderId: 'DELIV-ROO-99120',
    displayOrderNumber: '#DEL-304',
    customerName: 'Marcus Bennett',
    items: [
      { id: 'i1', name: 'Sourdough Country Loaf', quantity: 2, price: 5.5 },
      { id: 'i2', name: 'Almond Croissant', quantity: 3, price: 4.2 },
      { id: 'i3', name: 'Artisan Espresso Beans (250g)', quantity: 1, price: 11.0 },
    ],
    totalAmount: 34.6,
    status: 'NEW',
    riderStatus: 'ASSIGNED',
    riderName: 'Carlos M. (Bicycle)',
    riderEstimatedArrival: '12 mins',
    placedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    isWaitingToBePicked: true,
    reminderCount: 0,
    idempotencyHash: 'hash_del_304_v1',
  },
  {
    id: 'ord_int_102',
    storeId: 'store_soho',
    tenantId: 'tenant_artisan',
    sourceChannel: 'uber_eats',
    channelOrderId: 'UBER-EAT-44810',
    displayOrderNumber: '#UBR-892',
    customerName: 'Sarah Jenkins',
    items: [
      { id: 'i4', name: 'Focaccia Sandwiches Box (4pk)', quantity: 1, price: 26.0 },
      { id: 'i5', name: 'Fresh Orange Juice (1L)', quantity: 2, price: 6.0 },
    ],
    totalAmount: 38.0,
    status: 'PICKING',
    riderStatus: 'NEARBY',
    riderName: 'Liam K. (Scooter)',
    riderEstimatedArrival: '4 mins',
    placedAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    pickingStartedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    isWaitingToBePicked: false,
    reminderCount: 0,
    idempotencyHash: 'hash_ubr_892_v1',
  },
  {
    id: 'ord_int_103',
    storeId: 'store_soho',
    tenantId: 'tenant_artisan',
    sourceChannel: 'just_eat',
    channelOrderId: 'JEAT-UK-77312',
    displayOrderNumber: '#JE-118',
    customerName: 'David Chen',
    items: [
      { id: 'i6', name: 'Cinnamon Buns Platter', quantity: 1, price: 18.5 },
      { id: 'i7', name: 'Earl Grey Tea Tin', quantity: 1, price: 8.5 },
    ],
    totalAmount: 27.0,
    status: 'READY_FOR_PICKUP',
    riderStatus: 'ARRIVED',
    riderName: 'Elena R. (Waiting at Counter)',
    placedAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    pickingStartedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    riderArrivedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    isWaitingToBePicked: false,
    reminderCount: 0,
    idempotencyHash: 'hash_je_118_v1',
  },
];

const INITIAL_EVENTS: NormalizedEvent[] = [
  {
    id: 'evt_init_01',
    source: 'deliverect',
    sourceEventId: 'deliv_evt_99120_created',
    eventType: 'order.created',
    deliverectLocationId: 'LOC-DEL-8812',
    internalStoreId: 'store_soho',
    internalTenantId: 'tenant_artisan',
    channel: 'deliveroo',
    receivedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    processingResult: 'processed',
    summary: 'New Deliveroo order #DEL-304 received from Deliverect intake',
    alertsCreatedCount: 1,
    payload: {
      locationId: 'LOC-DEL-8812',
      channel: 'deliveroo',
      orderId: 'DELIV-ROO-99120',
      itemsCount: 3,
      amount: 34.6,
    },
  },
  {
    id: 'evt_init_02',
    source: 'deliverect',
    sourceEventId: 'deliv_evt_44810_status',
    eventType: 'order.status_updated',
    deliverectLocationId: 'LOC-DEL-8812',
    internalStoreId: 'store_soho',
    internalTenantId: 'tenant_artisan',
    channel: 'uber_eats',
    receivedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    processingResult: 'processed',
    summary: 'Uber Eats order #UBR-892 status changed to PICKING',
    alertsCreatedCount: 0,
    payload: {
      locationId: 'LOC-DEL-8812',
      orderId: 'UBER-EAT-44810',
      status: 'PICKING',
    },
  },
  {
    id: 'evt_init_03',
    source: 'deliverect',
    sourceEventId: 'deliv_evt_77312_driver',
    eventType: 'driver.status_updated',
    deliverectLocationId: 'LOC-DEL-8812',
    internalStoreId: 'store_soho',
    internalTenantId: 'tenant_artisan',
    channel: 'just_eat',
    receivedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    processingResult: 'processed',
    summary: 'Just Eat driver arrived at store for order #JE-118',
    alertsCreatedCount: 1,
    payload: {
      locationId: 'LOC-DEL-8812',
      orderId: 'JEAT-UK-77312',
      driverStatus: 'ARRIVED',
    },
  },
];

const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alt_init_01',
    storeId: 'store_soho',
    tenantId: 'tenant_artisan',
    type: 'NEW_ORDER',
    priority: 'high',
    message: 'New Deliveroo order #DEL-304 with 3 items',
    relatedOrderIds: ['ord_int_101'],
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    deduplicationKey: 'dedup_order_DELIV-ROO-99120',
    destinationIds: ['dest_soho_screen', 'dest_soho_vocovo'],
  },
  {
    id: 'alt_init_02',
    storeId: 'store_soho',
    tenantId: 'tenant_artisan',
    type: 'RIDER_ARRIVED',
    priority: 'urgent',
    message: 'Just Eat driver has arrived for order #JE-118',
    relatedOrderIds: ['ord_int_103'],
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
    deduplicationKey: 'dedup_rider_JEAT-UK-77312',
    destinationIds: ['dest_soho_screen', 'dest_soho_vocovo'],
  },
];

const INITIAL_ATTEMPTS: DeliveryAttempt[] = [
  {
    id: 'att_init_01',
    alertId: 'alt_init_01',
    storeId: 'store_soho',
    destinationId: 'dest_soho_vocovo',
    destinationName: 'VoCoVo Staff Headsets (Channel 1 - Counter & Packing)',
    destinationType: 'vocovo',
    status: 'accepted',
    message: 'VoCoVo API accepted audio transmission packet',
    latencyMs: 135,
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    idempotencyKey: 'idemp_alt_init_01_vocovo',
    isSimulated: true,
    playbackConfirmedByStaff: false, // Never conflate provider acceptance with staff hearing!
  },
  {
    id: 'att_init_02',
    alertId: 'alt_init_01',
    storeId: 'store_soho',
    destinationId: 'dest_soho_screen',
    destinationName: 'Kitchen Live Display (Wall Screen)',
    destinationType: 'live_screen',
    status: 'accepted',
    message: 'Card added to New Orders bucket',
    latencyMs: 12,
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    idempotencyKey: 'idemp_alt_init_01_screen',
    isSimulated: false,
    playbackConfirmedByStaff: false,
  },
];

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [stores, setStores] = useState<Store[]>(INITIAL_STORES);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('tenant_artisan');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('store_soho');

  const [registrationMappings, setRegistrationMappings] = useState<RegistrationMapping[]>(INITIAL_MAPPINGS);
  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(INITIAL_RULES);
  const [orders, setOrders] = useState<OrderState[]>(INITIAL_ORDERS);
  const [events, setEvents] = useState<NormalizedEvent[]>(INITIAL_EVENTS);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [deliveryAttempts, setDeliveryAttempts] = useState<DeliveryAttempt[]>(INITIAL_ATTEMPTS);
  const [channels, setChannels] = useState<Record<string, ChannelConfig>>(() => DEFAULT_CHANNELS);
  const [customChannels, setCustomChannels] = useState<Record<string, ChannelConfig>>({});
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => audioService.getMuted());
  const [audioQueueState, setAudioQueueState] = useState<{ queueLength: number; currentMessage?: string }>({
    queueLength: 0,
  });

  // Track sequential audio queue state from audioService
  useEffect(() => {
    return audioService.subscribe(() => {
      const qState = audioService.getQueueState();
      setAudioQueueState({
        queueLength: qState.queueLength,
        currentMessage: qState.currentItem?.message,
      });
    });
  }, []);

  const setStoreCapacity = useCallback((storeId: string, status: Store['capacityStatus']) => {
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, capacityStatus: status } : s))
    );
  }, []);

  const updateChannelConfig = useCallback((channelId: string, updates: Partial<ChannelConfig>) => {
    setChannels((prev) => {
      const current = prev[channelId] || DEFAULT_CHANNELS[channelId];
      if (!current) return prev;
      return {
        ...prev,
        [channelId]: { ...current, ...updates },
      };
    });
    setCustomChannels((prev) => {
      if (prev[channelId]) {
        return {
          ...prev,
          [channelId]: { ...prev[channelId], ...updates },
        };
      }
      return prev;
    });
  }, []);

  // Keep selected store in sync when tenant changes
  useEffect(() => {
    const storeBelongsToTenant = stores.some((s) => s.id === selectedStoreId && s.tenantId === selectedTenantId);
    if (!storeBelongsToTenant) {
      const firstStore = stores.find((s) => s.tenantId === selectedTenantId);
      if (firstStore) {
        setSelectedStoreId(firstStore.id);
      }
    }
  }, [selectedTenantId, selectedStoreId, stores]);

  const selectedTenant = useMemo(
    () => tenants.find((t) => t.id === selectedTenantId) || tenants[0],
    [tenants, selectedTenantId]
  );

  const selectedStore = useMemo(
    () => stores.find((s) => s.id === selectedStoreId) || stores[0],
    [stores, selectedStoreId]
  );

  const currentMapping = useMemo(
    () => registrationMappings.find((m) => m.storeId === selectedStoreId),
    [registrationMappings, selectedStoreId]
  );

  const currentStoreDestinations = useMemo(
    () => destinations.filter((d) => d.storeId === selectedStoreId),
    [destinations, selectedStoreId]
  );

  const currentStoreRules = useMemo(
    () => alertRules.filter((r) => r.storeId === selectedStoreId),
    [alertRules, selectedStoreId]
  );

  const currentStoreOrders = useMemo(
    () => orders.filter((o) => o.storeId === selectedStoreId),
    [orders, selectedStoreId]
  );

  const waitingOrdersCount = useMemo(
    () => currentStoreOrders.filter((o) => o.isWaitingToBePicked && o.status === 'NEW').length,
    [currentStoreOrders]
  );

  const toggleAudioMute = useCallback(() => {
    const newMuted = audioService.toggleMuted();
    setIsAudioMuted(newMuted);
  }, []);

  const updateRegistrationMapping = useCallback((mappingId: string, updates: Partial<RegistrationMapping>) => {
    setRegistrationMappings((prev) =>
      prev.map((m) => (m.id === mappingId ? { ...m, ...updates, lastSyncAt: new Date().toISOString() } : m))
    );
  }, []);

  const updateDestination = useCallback((destinationId: string, updates: Partial<Destination>) => {
    setDestinations((prev) =>
      prev.map((d) => (d.id === destinationId ? { ...d, ...updates } : d))
    );
  }, []);

  const updateAlertRule = useCallback((ruleId: string, updates: Partial<AlertRule>) => {
    setAlertRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, ...updates } : r))
    );
  }, []);

  const addCustomChannel = useCallback((channel: ChannelConfig) => {
    setCustomChannels((prev) => ({ ...prev, [channel.id]: channel }));
  }, []);

  /**
   * Internal alert creation and dispatch helper
   */
  const dispatchAlert = useCallback(
    (
      storeId: string,
      type: Alert['type'],
      priority: Alert['priority'],
      message: string,
      relatedOrderIds: string[],
      deduplicationKey: string
    ) => {
      const storeDestinations = destinations.filter((d) => d.storeId === storeId);
      const activeDestIds = storeDestinations.map((d) => d.id);

      const newAlert: Alert = {
        id: `alt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        storeId,
        tenantId: selectedTenantId,
        type,
        priority,
        message,
        relatedOrderIds,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        deduplicationKey,
        destinationIds: activeDestIds,
      };

      setAlerts((prev) => [newAlert, ...prev]);

      // Play audio chime and spoken alert in browser to simulate VoCoVo headset broadcast
      audioService.speak(message, priority);

      // Record delivery attempts for each destination
      const attempts: DeliveryAttempt[] = storeDestinations.map((dest) => {
        const isSim = dest.type === 'vocovo';
        return {
          id: `att_${Date.now()}_${dest.id.slice(-4)}`,
          alertId: newAlert.id,
          storeId,
          destinationId: dest.id,
          destinationName: dest.name,
          destinationType: dest.type,
          status: 'accepted',
          message:
            dest.type === 'vocovo'
              ? 'Provider accepted audio transmission packet (Playback unconfirmed)'
              : 'Card updated on live screen',
          latencyMs: dest.type === 'vocovo' ? Math.floor(90 + Math.random() * 80) : 15,
          timestamp: new Date().toISOString(),
          idempotencyKey: `idemp_${newAlert.id}_${dest.id}`,
          isSimulated: isSim,
          playbackConfirmedByStaff: false,
        };
      });

      setDeliveryAttempts((prev) => [...attempts, ...prev]);
    },
    [destinations, selectedTenantId]
  );

  /**
   * Send test alert to a specific destination
   */
  const testDestination = useCallback(
    async (destinationId: string) => {
      const dest = destinations.find((d) => d.id === destinationId);
      if (!dest) return;

      const testMsg = `Test announcement from Store Alerts to ${dest.name}`;
      audioService.speak(testMsg, 'normal');

      const attempt: DeliveryAttempt = {
        id: `att_test_${Date.now()}`,
        alertId: 'alt_test_manual',
        storeId: dest.storeId,
        destinationId: dest.id,
        destinationName: dest.name,
        destinationType: dest.type,
        status: 'accepted',
        message: 'Manual diagnostic test transmission accepted by provider',
        latencyMs: dest.type === 'vocovo' ? 110 : 8,
        timestamp: new Date().toISOString(),
        idempotencyKey: `test_${Date.now()}`,
        isSimulated: dest.type === 'vocovo',
        playbackConfirmedByStaff: false,
      };

      setDeliveryAttempts((prev) => [attempt, ...prev]);
      updateDestination(destinationId, {
        lastSuccessfulRequestAt: new Date().toISOString(),
        lastDeliveryResult: {
          status: 'accepted',
          message: 'Diagnostic test verified transmission',
          timestamp: new Date().toISOString(),
          latencyMs: attempt.latencyMs,
        },
      });
    },
    [destinations, updateDestination]
  );

  // ----------------------------------------------------
  // SIMULATOR ACTIONS
  // ----------------------------------------------------

  const registerAndActivateStore = useCallback(() => {
    if (currentMapping) {
      updateRegistrationMapping(currentMapping.id, {
        registrarStatus: 'registered',
        orderFeedProvisioned: true,
      });

      const evt: NormalizedEvent = {
        id: `evt_reg_${Date.now()}`,
        source: 'deliverect',
        sourceEventId: `reg_webhook_${Date.now()}`,
        eventType: 'store.registered',
        deliverectLocationId: currentMapping.deliverectLocationId,
        internalStoreId: selectedStoreId,
        internalTenantId: selectedTenantId,
        channel: 'deliveroo',
        receivedAt: new Date().toISOString(),
        processingResult: 'processed',
        summary: `Store ${selectedStore.name} registered with Deliverect location ${currentMapping.deliverectLocationId}`,
        alertsCreatedCount: 0,
        payload: {
          locationId: currentMapping.deliverectLocationId,
          channelLinkId: currentMapping.deliverectChannelLinkId,
          status: 'ACTIVATED',
        },
      };

      setEvents((prev) => [evt, ...prev]);
    }
  }, [currentMapping, selectedStoreId, selectedTenantId, selectedStore.name, updateRegistrationMapping]);

  const sendNewOrder = useCallback(
    (channel: ChannelId = 'deliveroo', itemsCount: number = 3, targetStoreId?: string) => {
      const activeStoreId = targetStoreId || selectedStoreId;
      const targetStore = stores.find((s) => s.id === activeStoreId) || selectedStore;
      const targetMapping = registrationMappings.find((m) => m.storeId === activeStoreId);
      const orderNumSeq = Math.floor(100 + Math.random() * 900);
      const channelPrefix = channel === 'deliveroo' ? 'DEL' : channel === 'uber_eats' ? 'UBR' : channel === 'just_eat' ? 'JE' : channel === 'doordash' ? 'DD' : channel === 'wolt' ? 'WLT' : 'DIR';
      const displayOrderNumber = `#${channelPrefix}-${orderNumSeq}`;
      const channelOrderId = `${channel.toUpperCase()}-${Date.now()}`;
      const customerNames = ['Emma Watson', 'James Sterling', 'Zoe Thorne', 'Oliver Bennett', 'Sophia Rossi', 'Liam Walker', 'Noah Davies'];
      const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];

      const sampleItems = [
        { name: 'Sourdough Country Loaf', price: 5.5 },
        { name: 'Chocolate Pain au Chocolat', price: 3.8 },
        { name: 'Cinnamon Swirl Bun', price: 4.2 },
        { name: 'Fresh Avocado Sourdough Toast', price: 8.5 },
        { name: 'Matcha Iced Latte', price: 4.8 },
        { name: 'Artisan Espresso Beans (250g)', price: 11.0 },
      ];

      const chosenItems = sampleItems.slice(0, Math.min(itemsCount, sampleItems.length)).map((it, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        name: it.name,
        quantity: Math.floor(1 + Math.random() * 2),
        price: it.price,
      }));

      const totalAmount = chosenItems.reduce((acc, it) => acc + (it.price || 0) * it.quantity, 0);

      const newOrder: OrderState = {
        id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        storeId: activeStoreId,
        tenantId: targetStore.tenantId,
        sourceChannel: channel,
        channelOrderId,
        displayOrderNumber,
        customerName,
        items: chosenItems,
        totalAmount: Number(totalAmount.toFixed(2)),
        status: 'NEW',
        riderStatus: 'ASSIGNED',
        riderName: 'Assigned Courier (In Transit)',
        riderEstimatedArrival: '15 mins',
        placedAt: new Date().toISOString(),
        isWaitingToBePicked: true,
        reminderCount: 0,
        idempotencyHash: `hash_${channelOrderId}`,
      };

      setOrders((prev) => [newOrder, ...prev]);

      // Record normalized intake event
      const event: NormalizedEvent = {
        id: `evt_in_${Date.now()}`,
        source: 'deliverect',
        sourceEventId: `deliv_${channelOrderId}`,
        eventType: 'order.created',
        deliverectLocationId: targetMapping?.deliverectLocationId || 'LOC-UNKNOWN',
        internalStoreId: activeStoreId,
        internalTenantId: targetStore.tenantId,
        channel,
        receivedAt: new Date().toISOString(),
        processingResult: 'processed',
        summary: `New ${channel.replace('_', ' ')} order ${displayOrderNumber} received for ${targetStore.name}`,
        alertsCreatedCount: 1,
        payload: {
          locationId: targetMapping?.deliverectLocationId,
          channel,
          orderId: channelOrderId,
          displayNumber: displayOrderNumber,
          customer: customerName,
          itemsCount: chosenItems.length,
          total: totalAmount,
        },
      };

      setEvents((prev) => [event, ...prev]);

      // Trigger Alert
      const channelConfig = customChannels[channel] || DEFAULT_CHANNELS[channel] || { name: channel };
      const alertMsg = `New ${channelConfig.name} order ${displayOrderNumber} with ${chosenItems.length} items for ${targetStore.name}`;
      dispatchAlert(activeStoreId, 'NEW_ORDER', 'high', alertMsg, [newOrder.id], `dedup_order_${channelOrderId}`);

      // Check if threshold rule (3+ orders waiting) is now exceeded!
      const currentWaiting = orders.filter((o) => o.storeId === activeStoreId && o.isWaitingToBePicked && o.status === 'NEW').length + 1;
      if (currentWaiting >= 3) {
        setTimeout(() => {
          const thresholdMsg = `Attention team: ${currentWaiting} delivery orders waiting to be picked in ${targetStore.name}`;
          dispatchAlert(activeStoreId, 'PICK_THRESHOLD_EXCEEDED', 'urgent', thresholdMsg, [], `threshold_${Date.now()}`);
        }, 1200);
      }
    },
    [selectedStoreId, selectedStore, stores, registrationMappings, customChannels, dispatchAlert, orders]
  );

  const sendDuplicateEvent = useCallback(
    (targetOrderId?: string) => {
      // Find an order to duplicate
      const order = targetOrderId
        ? orders.find((o) => o.id === targetOrderId)
        : orders.find((o) => o.storeId === selectedStoreId) || orders[0];

      if (!order) return;

      // Simulate sending the exact same source event again
      const duplicateEvt: NormalizedEvent = {
        id: `evt_dup_${Date.now()}`,
        source: 'deliverect',
        sourceEventId: `deliv_${order.channelOrderId}`, // Same source event ID!
        eventType: 'order.created',
        deliverectLocationId: currentMapping?.deliverectLocationId || 'LOC-UNKNOWN',
        internalStoreId: selectedStoreId,
        internalTenantId: selectedTenantId,
        channel: order.sourceChannel,
        receivedAt: new Date().toISOString(),
        processingResult: 'duplicate_ignored', // Key requirement: Idempotency!
        summary: `Duplicate event for order ${order.displayOrderNumber} detected and safely ignored (No duplicate order or alert created)`,
        alertsCreatedCount: 0,
        payload: {
          note: 'Idempotency key matched existing orderState. Event discarded without re-alerting.',
          channelOrderId: order.channelOrderId,
          sourceEventId: `deliv_${order.channelOrderId}`,
        },
      };

      setEvents((prev) => [duplicateEvt, ...prev]);
    },
    [orders, selectedStoreId, currentMapping, selectedTenantId]
  );

  const startPicking = useCallback(
    (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'PICKING',
                pickingStartedAt: new Date().toISOString(),
                isWaitingToBePicked: false, // Critical requirement: Removed from waiting queue!
              }
            : o
        )
      );

      const evt: NormalizedEvent = {
        id: `evt_pick_${Date.now()}`,
        source: 'simulator',
        sourceEventId: `sim_pick_${order.channelOrderId}`,
        eventType: 'order.status_updated',
        deliverectLocationId: currentMapping?.deliverectLocationId || 'LOC-UNKNOWN',
        internalStoreId: selectedStoreId,
        internalTenantId: selectedTenantId,
        channel: order.sourceChannel,
        receivedAt: new Date().toISOString(),
        processingResult: 'processed',
        summary: `Picking started for ${order.displayOrderNumber} (Removed from waiting queue, reminder suppressed)`,
        alertsCreatedCount: 0,
        payload: {
          orderId: order.channelOrderId,
          status: 'PICKING',
        },
      };

      setEvents((prev) => [evt, ...prev]);
    },
    [orders, currentMapping, selectedStoreId, selectedTenantId]
  );

  const markReadyForPickup = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'READY_FOR_PICKUP',
              }
            : o
        )
      );
    },
    []
  );

  const riderArrived = useCallback(
    (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                riderStatus: 'ARRIVED',
                riderArrivedAt: new Date().toISOString(),
              }
            : o
        )
      );

      const evt: NormalizedEvent = {
        id: `evt_rider_${Date.now()}`,
        source: 'deliverect',
        sourceEventId: `deliv_rider_${order.channelOrderId}`,
        eventType: 'driver.status_updated',
        deliverectLocationId: currentMapping?.deliverectLocationId || 'LOC-UNKNOWN',
        internalStoreId: selectedStoreId,
        internalTenantId: selectedTenantId,
        channel: order.sourceChannel,
        receivedAt: new Date().toISOString(),
        processingResult: 'processed',
        summary: `Driver arrived for order ${order.displayOrderNumber}`,
        alertsCreatedCount: 1,
        payload: {
          orderId: order.channelOrderId,
          driverStatus: 'ARRIVED',
        },
      };

      setEvents((prev) => [evt, ...prev]);

      const channelConfig = customChannels[order.sourceChannel] || DEFAULT_CHANNELS[order.sourceChannel] || { name: order.sourceChannel };
      const alertMsg = `${channelConfig.name} driver has arrived for order ${order.displayOrderNumber}`;
      dispatchAlert(selectedStoreId, 'RIDER_ARRIVED', 'urgent', alertMsg, [order.id], `rider_arr_${order.channelOrderId}`);
    },
    [orders, currentMapping, selectedStoreId, selectedTenantId, customChannels, dispatchAlert]
  );

  const completeHandover = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'DISPATCHED',
              riderStatus: 'COLLECTED',
              completedAt: new Date().toISOString(),
              isWaitingToBePicked: false,
            }
          : o
      )
    );
  }, []);

  const cancelOrder = useCallback(
    (orderId: string, reason: string = 'Customer cancelled before fulfillment') => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'CANCELLED',
                cancellationReason: reason,
                isWaitingToBePicked: false,
              }
            : o
        )
      );

      const evt: NormalizedEvent = {
        id: `evt_cancel_${Date.now()}`,
        source: 'deliverect',
        sourceEventId: `deliv_cancel_${order.channelOrderId}`,
        eventType: 'order.cancelled',
        deliverectLocationId: currentMapping?.deliverectLocationId || 'LOC-UNKNOWN',
        internalStoreId: selectedStoreId,
        internalTenantId: selectedTenantId,
        channel: order.sourceChannel,
        receivedAt: new Date().toISOString(),
        processingResult: 'processed',
        summary: `Order ${order.displayOrderNumber} was cancelled by ${order.sourceChannel}`,
        alertsCreatedCount: 1,
        payload: {
          orderId: order.channelOrderId,
          reason,
        },
      };

      setEvents((prev) => [evt, ...prev]);

      const channelConfig = customChannels[order.sourceChannel] || DEFAULT_CHANNELS[order.sourceChannel] || { name: order.sourceChannel };
      const alertMsg = `Order ${order.displayOrderNumber} cancelled by ${channelConfig.name}. Stop picking.`;
      dispatchAlert(selectedStoreId, 'ORDER_CANCELLED', 'high', alertMsg, [order.id], `cancel_${order.channelOrderId}`);
    },
    [orders, currentMapping, selectedStoreId, selectedTenantId, customChannels, dispatchAlert]
  );

  const triggerWaitingThreshold = useCallback(() => {
    // Add 2 fast orders to immediately push queue over the threshold
    sendNewOrder('deliveroo', 2);
    setTimeout(() => {
      sendNewOrder('uber_eats', 4);
    }, 400);
  }, [sendNewOrder]);

  const simulateProviderFailure = useCallback(
    (destinationId: string) => {
      const dest = destinations.find((d) => d.id === destinationId);
      if (!dest) return;

      const failedAttempt: DeliveryAttempt = {
        id: `att_fail_${Date.now()}`,
        alertId: 'alt_fail_sim',
        storeId: dest.storeId,
        destinationId: dest.id,
        destinationName: dest.name,
        destinationType: dest.type,
        status: 'failed',
        message: 'Socket timeout 504: Gateway unreachable during announcement packet send',
        latencyMs: 3200,
        timestamp: new Date().toISOString(),
        idempotencyKey: `fail_${Date.now()}`,
        isSimulated: true,
        playbackConfirmedByStaff: false,
      };

      setDeliveryAttempts((prev) => [failedAttempt, ...prev]);
      updateDestination(destinationId, {
        lastDeliveryResult: {
          status: 'failed',
          message: 'Delivery timeout: Gateway unreachable during announcement dispatch',
          timestamp: new Date().toISOString(),
          latencyMs: 3200,
        },
      });
    },
    [destinations, updateDestination]
  );

  const retryDelivery = useCallback(
    (attemptId: string) => {
      const attempt = deliveryAttempts.find((a) => a.id === attemptId);
      if (!attempt) return;

      const newAttempt: DeliveryAttempt = {
        id: `att_retry_${Date.now()}`,
        alertId: attempt.alertId,
        storeId: attempt.storeId,
        destinationId: attempt.destinationId,
        destinationName: attempt.destinationName,
        destinationType: attempt.destinationType,
        status: 'accepted',
        message: 'Manual retry succeeded: Packet acknowledged by output adapter',
        latencyMs: 140,
        timestamp: new Date().toISOString(),
        idempotencyKey: `retry_${attempt.idempotencyKey}`,
        isSimulated: attempt.isSimulated,
        playbackConfirmedByStaff: false,
      };

      setDeliveryAttempts((prev) => [newAttempt, ...prev]);
    },
    [deliveryAttempts]
  );

  const resetDemoData = useCallback(() => {
    setOrders(INITIAL_ORDERS);
    setEvents(INITIAL_EVENTS);
    setAlerts(INITIAL_ALERTS);
    setDeliveryAttempts(INITIAL_ATTEMPTS);
    setRegistrationMappings(INITIAL_MAPPINGS);
    setDestinations(INITIAL_DESTINATIONS);
    setAlertRules(INITIAL_RULES);
  }, []);

  const value = {
    tenants,
    stores,
    selectedTenantId,
    selectedStoreId,
    selectedTenant,
    selectedStore,
    setSelectedTenantId,
    setSelectedStoreId,
    setStoreCapacity,
    registrationMappings,
    currentMapping,
    updateRegistrationMapping,
    destinations,
    currentStoreDestinations,
    updateDestination,
    testDestination,
    alertRules,
    currentStoreRules,
    updateAlertRule,
    orders,
    currentStoreOrders,
    waitingOrdersCount,
    events,
    alerts,
    deliveryAttempts,
    channels,
    updateChannelConfig,
    customChannels,
    addCustomChannel,
    isAudioMuted,
    toggleAudioMute,
    audioQueueState,
    simulator: {
      registerAndActivateStore,
      sendNewOrder,
      sendDuplicateEvent,
      startPicking,
      markReadyForPickup,
      riderArrived,
      completeHandover,
      cancelOrder,
      triggerWaitingThreshold,
      simulateProviderFailure,
      retryDelivery,
      resetDemoData,
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStoreAlerts = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreAlerts must be used within a StoreProvider');
  }
  return context;
};
