import React, { useState } from 'react';
import { useStoreAlerts } from '../context/StoreContext';
import { Store } from '../types';
import { ChannelBadge, ChannelLogo } from '../services/channelLogos';
import {
  Building2,
  MapPin,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Plus,
  Radio,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  Play,
} from 'lucide-react';

export const TenantCompanyView: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const {
    tenants,
    stores,
    selectedTenantId,
    setSelectedTenantId,
    selectedTenant,
    setSelectedStoreId,
    orders,
    setStoreCapacity,
    customChannels,
    simulator,
  } = useStoreAlerts();

  const [activeStoreDetailId, setActiveStoreDetailId] = useState<string | null>(null);

  // All stores for current company
  const companyStores = stores.filter((s) => s.tenantId === selectedTenantId);
  const companyOrders = orders.filter((o) => o.tenantId === selectedTenantId);
  const companyWaitingOrders = companyOrders.filter((o) => o.isWaitingToBePicked && o.status === 'NEW');
  const companyPickingOrders = companyOrders.filter((o) => o.status === 'PICKING');
  const companyRidersArrived = companyOrders.filter((o) => o.riderStatus === 'ARRIVED');

  const activeStoreDetail =
    companyStores.find((s) => s.id === activeStoreDetailId) || companyStores[0];

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      {/* Top Header & Tenant Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Company Network Operations & Store Map
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated multi-store order volume, store busy management, and delivery coverage for {selectedTenant.name}.
          </p>
        </div>

        {/* Company Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTenantId(t.id);
                const firstStore = stores.find((s) => s.tenantId === t.id);
                if (firstStore) {
                  setSelectedStoreId(firstStore.id);
                  setActiveStoreDetailId(firstStore.id);
                }
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                selectedTenantId === t.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Company Orders</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {companyOrders.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across {companyStores.length} locations</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Waiting</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black tabular-nums ${
                companyWaitingOrders.length >= 4 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {companyWaitingOrders.length}
            </span>
            <span className="text-[11px] text-slate-500">to be picked</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Pending staff assignment</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Picking</span>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {companyPickingOrders.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Staff fulfillment active</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Couriers Arrived</span>
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 tabular-nums">
            {companyRidersArrived.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Waiting at collection bays</p>
        </div>
      </div>

      {/* Main Interactive Map & Store Status Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Interactive Map */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Regional Store Distribution & Fulfillment Heat Map</span>
              </h3>
              <p className="text-xs text-slate-500">
                Click any store node on the map to inspect live orders and adjust busy capacity.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 self-start sm:self-auto">
              London Metro Grid
            </span>
          </div>

          {/* SVG Map Container */}
          <div className="relative bg-slate-900 overflow-hidden w-full aspect-16/10 sm:aspect-16/9 flex items-center justify-center">
            <svg
              viewBox="0 0 800 450"
              className="w-full h-full select-none"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)' }}
            >
              {/* Background Grid Lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                </pattern>
                <linearGradient id="thames" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#2563eb" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              <rect width="800" height="450" fill="url(#grid)" />

              {/* Stylized River Thames curve */}
              <path
                d="M 20 280 C 180 290, 240 220, 360 250 C 480 280, 560 360, 680 320 C 740 300, 780 310, 800 320"
                fill="none"
                stroke="url(#thames)"
                strokeWidth="28"
                strokeLinecap="round"
                className="opacity-70"
              />

              {/* Major arterial road network */}
              <path
                d="M 380 40 L 410 420 M 120 220 L 700 200 M 280 80 L 520 380"
                fill="none"
                stroke="#334155"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="opacity-50"
              />

              {/* Connectors between company stores */}
              {companyStores.length >= 2 && (
                <line
                  x1={(companyStores[0].coordinates.xPercent / 100) * 800}
                  y1={(companyStores[0].coordinates.yPercent / 100) * 450}
                  x2={(companyStores[1].coordinates.xPercent / 100) * 800}
                  y2={(companyStores[1].coordinates.yPercent / 100) * 450}
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  className="opacity-40 animate-pulse"
                />
              )}

              {/* Store Nodes */}
              {companyStores.map((store) => {
                const cx = (store.coordinates.xPercent / 100) * 800;
                const cy = (store.coordinates.yPercent / 100) * 450;
                const isSelected = store.id === (activeStoreDetailId || companyStores[0]?.id);
                const storeWaiting = orders.filter(
                  (o) => o.storeId === store.id && o.isWaitingToBePicked && o.status === 'NEW'
                ).length;
                const isBusy = store.capacityStatus !== 'open';

                const nodeColor =
                  storeWaiting >= 3
                    ? '#f43f5e' // Rose
                    : isBusy
                    ? '#f59e0b' // Amber
                    : '#00D084'; // Deliverect Green

                return (
                  <g
                    key={store.id}
                    onClick={() => {
                      setActiveStoreDetailId(store.id);
                      setSelectedStoreId(store.id);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing delivery radar ring */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 42 : 32}
                      fill={nodeColor}
                      fillOpacity={isSelected ? 0.2 : 0.1}
                      className="transition-all duration-300"
                    />

                    {/* Outer border ring */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 26 : 20}
                      fill="#0f172a"
                      stroke={nodeColor}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all duration-300 group-hover:scale-110"
                    />

                    {/* Order count badge */}
                    <text
                      x={cx}
                      y={cy + 5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={isSelected ? '14' : '12'}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {storeWaiting}
                    </text>

                    {/* Store Name Callout */}
                    <g transform={`translate(${cx}, ${cy - (isSelected ? 38 : 30)})`}>
                      <rect
                        x="-70"
                        y="-12"
                        width="140"
                        height="24"
                        rx="6"
                        fill="#0f172a"
                        stroke="#334155"
                        strokeWidth="1"
                        className="shadow-lg"
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="sans-serif"
                      >
                        {store.name.split(' ')[0]} ({store.locationCode})
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Map Legend (Overlay) */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-xs p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00D084]" />
                <span>Normal Queue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Busy Mode</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Threshold ($\ge 3$)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Store Operational Telemetry & Capacity Settings */}
        {activeStoreDetail && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{activeStoreDetail.name}</h3>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {activeStoreDetail.locationCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeStoreDetail.address}</span>
                </p>
              </div>
            </div>

            {/* Capacity Controls (Directly matching Deliverect Quest guide Page 26) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Deliverect Store Capacity Status
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setStoreCapacity(activeStoreDetail.id, 'open')}
                  className={`py-2 px-3 rounded-lg font-bold border transition-all ${
                    activeStoreDetail.capacityStatus === 'open'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1 ring-emerald-400'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  ✓ Open Normal
                </button>
                <button
                  onClick={() => setStoreCapacity(activeStoreDetail.id, 'busy_10')}
                  className={`py-2 px-3 rounded-lg font-bold border transition-all ${
                    activeStoreDetail.capacityStatus === 'busy_10'
                      ? 'bg-amber-50 text-amber-800 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Busy (+10m)
                </button>
                <button
                  onClick={() => setStoreCapacity(activeStoreDetail.id, 'busy_20')}
                  className={`py-2 px-3 rounded-lg font-bold border transition-all ${
                    activeStoreDetail.capacityStatus === 'busy_20'
                      ? 'bg-amber-50 text-amber-800 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Busy (+20m)
                </button>
                <button
                  onClick={() => setStoreCapacity(activeStoreDetail.id, 'closed')}
                  className={`py-2 px-3 rounded-lg font-bold border transition-all ${
                    activeStoreDetail.capacityStatus === 'closed'
                      ? 'bg-rose-50 text-rose-800 border-rose-400 ring-1 ring-rose-400'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Close Store
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Setting as busy adds prep time to new aggregator orders as described in Quest guide p.26.
              </p>
            </div>

            {/* Store Quick Stats */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Waiting to be picked:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {
                    orders.filter(
                      (o) => o.storeId === activeStoreDetail.id && o.isWaitingToBePicked && o.status === 'NEW'
                    ).length
                  }{' '}
                  orders
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Average fulfillment time:</span>
                <span className="font-mono font-bold text-slate-800">
                  {activeStoreDetail.avgPickTimeMinutes} mins
                </span>
              </div>
            </div>

            {/* Fast Injection into this store */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-700 block">
                Simulate Order to {activeStoreDetail.name}:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => simulator.sendNewOrder('deliveroo', 2, activeStoreDetail.id)}
                  className="py-1.5 px-2 bg-[#00CDBC]/10 hover:bg-[#00CDBC]/20 text-[#008F83] border border-[#00CDBC]/30 rounded-lg text-xs font-bold transition-colors"
                >
                  + Deliveroo
                </button>
                <button
                  onClick={() => simulator.sendNewOrder('uber_eats', 2, activeStoreDetail.id)}
                  className="py-1.5 px-2 bg-[#06C167]/10 hover:bg-[#06C167]/20 text-[#048244] border border-[#06C167]/30 rounded-lg text-xs font-bold transition-colors"
                >
                  + Uber Eats
                </button>
              </div>
            </div>

            {/* Jump to Live Screen */}
            <button
              onClick={() => {
                setSelectedStoreId(activeStoreDetail.id);
                onNavigate('live_screen');
              }}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>Open Store Live Screen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
