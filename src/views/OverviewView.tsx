import React from 'react';
import { useStoreAlerts } from '../context/StoreContext';
import { ChannelBadge } from '../services/channelLogos';
import {
  Clock,
  AlertTriangle,
  Radio,
  Monitor,
  Headphones,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const OverviewView: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const {
    selectedStore,
    selectedTenant,
    waitingOrdersCount,
    currentStoreOrders,
    currentStoreDestinations,
    currentMapping,
    alerts,
    deliveryAttempts,
    customChannels,
    isAudioMuted,
    toggleAudioMute,
    simulator,
  } = useStoreAlerts();

  const waitingOrders = currentStoreOrders.filter((o) => o.isWaitingToBePicked && o.status === 'NEW');
  const pickingOrders = currentStoreOrders.filter((o) => o.status === 'PICKING');
  const arrivedOrders = currentStoreOrders.filter((o) => o.riderStatus === 'ARRIVED');

  const storeAlerts = alerts.filter((a) => a.storeId === selectedStore.id);
  const storeAttempts = deliveryAttempts.filter((a) => a.storeId === selectedStore.id);
  const acceptedAttempts = storeAttempts.filter((a) => a.status === 'accepted');
  const successRate = storeAttempts.length > 0 ? Math.round((acceptedAttempts.length / storeAttempts.length) * 100) : 100;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* High Volume Warning Banner if 3+ orders waiting */}
      {waitingOrdersCount >= 3 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-700 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-extrabold text-rose-900">
                  High Volume Threshold ({waitingOrdersCount} orders waiting to be picked)
                </h4>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-200 text-rose-800 rounded">
                  Urgent Rule Active
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-rose-700 mt-1 leading-relaxed">
                Fulfillment queue threshold triggered. Headset voice broadcast sent to pickers to prioritize kitchen handover.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('live_screen')}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shrink-0 self-start sm:self-auto"
          >
            <span>Open Live KDS Screen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Metric Strip (2 columns on mobile, 5 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] sm:text-xs font-bold tracking-wide uppercase truncate">Waiting</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
              {waitingOrdersCount}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 truncate">
              {waitingOrdersCount >= 3 ? '⚠️ Load' : 'Nominal'}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Threshold: 3</span>
            <span className="font-semibold text-slate-700 truncate">Auto-alerts</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Fulfillment Active</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {pickingOrders.length}
            </span>
            <span className="text-xs text-slate-500">in pick progress</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Riders waiting outside:</span>
            <span className="font-bold text-purple-600 tabular-nums">{arrivedOrders.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Registrar State</span>
            <Radio className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 capitalize">
              {currentMapping?.registrarStatus || 'Unregistered'}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Order feed:</span>
            <span className={`font-semibold ${currentMapping?.orderFeedProvisioned ? 'text-emerald-600' : 'text-amber-600'}`}>
              {currentMapping?.orderFeedProvisioned ? 'Provisioned' : 'Awaiting link'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Alerts Dispatched</span>
            <Headphones className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {storeAlerts.length}
            </span>
            <span className="text-xs text-slate-500">events generated</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Delivery success:</span>
            <span className="font-bold text-emerald-600 tabular-nums">{successRate}%</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Headset Audio Engine</span>
            {isAudioMuted ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-500 animate-pulse" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">
              {isAudioMuted ? 'Muted' : 'Audio Active'}
            </span>
            <button
              onClick={toggleAudioMute}
              className={`px-2 py-1 text-xs font-semibold rounded-md border transition-colors ${
                isAudioMuted
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {isAudioMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            Web Audio Chimes + Web Speech TTS
          </div>
        </div>
      </div>

      {/* Quick Interactive Simulation Controls Strip */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-800 rounded-md text-amber-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold">Interactive Event Simulation Bar</h3>
            <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
              Mock Repository Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Trigger simulated Deliverect incoming orders, driver arrivals, and headset announcements for {selectedStore.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => simulator.sendNewOrder('deliveroo', 3)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#00CDBC] hover:bg-[#00B4A5] text-white rounded-lg transition-colors shadow-xs"
          >
            <span>+ Deliveroo Order</span>
          </button>
          <button
            onClick={() => simulator.sendNewOrder('uber_eats', 2)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#06C167] hover:bg-[#05A357] text-white rounded-lg transition-colors shadow-xs"
          >
            <span>+ Uber Eats Order</span>
          </button>
          <button
            onClick={() => simulator.sendDuplicateEvent()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
            title="Simulate receiving the exact same Deliverect webhook payload to prove idempotency"
          >
            <span>Duplicate Webhook</span>
          </button>
          <button
            onClick={simulator.triggerWaitingThreshold}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-xs"
            title="Fast inject orders to trigger the 3+ waiting threshold rule"
          >
            <span>Trigger 3+ Threshold</span>
          </button>
          <button
            onClick={() => onNavigate('simulator')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <span>Full Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two Column Layout: Active Queue Preview + Destination Connectivity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders in Need of Action (2 spans) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Current Store Order Queue</h3>
              <p className="text-xs text-slate-500">Live operational order states across delivery channels</p>
            </div>
            <button
              onClick={() => onNavigate('live_screen')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Full Screen KDS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {currentStoreOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No active orders for {selectedStore.name}</p>
                <p className="text-xs mt-1">Use the simulation bar above to trigger a test Deliveroo or Uber Eats order.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentStoreOrders.map((order) => {
                  const isNew = order.status === 'NEW';
                  const isPicking = order.status === 'PICKING';
                  const isReady = order.status === 'READY_FOR_PICKUP';
                  const isCancelled = order.status === 'CANCELLED';

                  return (
                    <div
                      key={order.id}
                      className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isNew
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : order.riderStatus === 'ARRIVED'
                          ? 'bg-purple-50/50 hover:bg-purple-50/80'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <ChannelBadge channelId={order.sourceChannel} customChannels={customChannels} />
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {order.displayOrderNumber}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs font-medium text-slate-700">{order.customerName}</span>

                          {/* Order Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                              isNew
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : isPicking
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : isReady
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isCancelled
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {order.status.replace(/_/g, ' ')}
                          </span>

                          {/* Rider Status Badge */}
                          {order.riderStatus === 'ARRIVED' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300 animate-pulse">
                              Rider At Store
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                          <span>
                            {order.items.length} items (
                            {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')})
                          </span>
                          <span>·</span>
                          <span className="font-mono font-medium text-slate-700">£{order.totalAmount.toFixed(2)}</span>
                          {order.riderName && (
                            <>
                              <span>·</span>
                              <span className="text-slate-600">Rider: {order.riderName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isNew && (
                          <button
                            onClick={() => simulator.startPicking(order.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                          >
                            Start Picking
                          </button>
                        )}
                        {isPicking && (
                          <button
                            onClick={() => simulator.markReadyForPickup(order.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                          >
                            Mark Ready
                          </button>
                        )}
                        {order.riderStatus !== 'ARRIVED' && !isCancelled && order.status !== 'DISPATCHED' && (
                          <button
                            onClick={() => simulator.riderArrived(order.id)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                            title="Simulate Deliverect driver arrival webhook"
                          >
                            Rider Arrived
                          </button>
                        )}
                        {order.riderStatus === 'ARRIVED' && (
                          <button
                            onClick={() => simulator.completeHandover(order.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-xs"
                          >
                            Handover Complete
                          </button>
                        )}
                        {!isCancelled && order.status !== 'DISPATCHED' && (
                          <button
                            onClick={() => simulator.cancelOrder(order.id)}
                            className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Output Destinations & Telemetry Rules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Output Destinations</h3>
              <p className="text-xs text-slate-500">Routing endpoints for {selectedStore.name}</p>
            </div>
            <button
              onClick={() => onNavigate('destinations')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Configure
            </button>
          </div>

          <div className="space-y-3">
            {currentStoreDestinations.map((dest) => {
              const isVocovo = dest.type === 'vocovo';
              return (
                <div key={dest.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isVocovo ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isVocovo ? <Headphones className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{dest.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                              dest.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : dest.status === 'simulated'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {dest.status}
                          </span>
                          <span className="text-[11px] text-slate-500">{dest.config.targetGroup}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 bg-slate-50 rounded-lg p-2 border border-slate-100">
                    {dest.statusNote || 'Configured destination.'}
                  </p>

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Last result:</span>
                    <span className="font-medium text-slate-700">
                      {dest.lastDeliveryResult?.status === 'accepted' ? '✓ Accepted by provider' : 'None yet'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Operational Policy Note */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
            <span className="font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              Architecture Principle
            </span>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              "Provider accepted" only acknowledges packet reception by the output adapter, not confirmed playback by staff. No recent orders does not mean disconnected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
