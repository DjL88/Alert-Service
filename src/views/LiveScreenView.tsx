import React, { useState, useEffect } from 'react';
import { useStoreAlerts } from '../context/StoreContext';
import { ChannelBadge, ChannelLogo } from '../services/channelLogos';
import { OrderState } from '../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Package,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const LiveScreenView: React.FC = () => {
  const {
    selectedStore,
    currentStoreOrders,
    waitingOrdersCount,
    customChannels,
    isAudioMuted,
    toggleAudioMute,
    simulator,
  } = useStoreAlerts();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [mobileActiveBucket, setMobileActiveBucket] = useState<'all' | 'new' | 'picking' | 'ready' | 'recent'>('all');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Organize orders into 4 operational buckets
  const newOrders = currentStoreOrders.filter((o) => o.status === 'NEW' && o.isWaitingToBePicked);
  const pickingOrders = currentStoreOrders.filter((o) => o.status === 'PICKING');
  const readyOrders = currentStoreOrders.filter(
    (o) =>
      o.status === 'READY_FOR_PICKUP' ||
      (o.riderStatus === 'ARRIVED' && o.status !== 'DISPATCHED' && o.status !== 'CANCELLED')
  );
  const recentOrders = currentStoreOrders.filter(
    (o) => o.status === 'DISPATCHED' || o.status === 'CANCELLED'
  );

  const getElapsedMinutes = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    return Math.max(0, diff);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* KDS Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                {selectedStore.name}
              </h2>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {selectedStore.locationCode}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              Deliverect Live Queue · VoCoVo Smart Headsets Bridge
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Waiting Threshold Indicator */}
          <div
            className={`px-2.5 py-1 sm:py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-bold ${
              waitingOrdersCount >= 3
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-bounce'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <span className="text-[11px]">Waiting:</span>
            <span className="font-black text-xs sm:text-sm tabular-nums">{waitingOrdersCount}</span>
            {waitingOrdersCount >= 3 && <span className="text-[10px]">⚠️ Backlog!</span>}
          </div>

          {/* Audio Chime Mute Toggle */}
          <button
            onClick={toggleAudioMute}
            className={`flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              isAudioMuted
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
            <span className="text-[11px]">{isAudioMuted ? 'Muted' : 'Voice On'}</span>
          </button>

          {/* Digital Clock */}
          <div className="font-mono text-xs sm:text-sm font-bold text-slate-800 bg-slate-100 px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-200 tabular-nums">
            {currentTime || '00:00:00'}
          </div>
        </div>
      </div>

      {/* Quest-Style Segmented Tab Bar for Mobile Screen Switching (Matches Quest Guide p.6, 9, 25) */}
      <div className="flex md:hidden items-center gap-1 bg-slate-200/90 p-1 rounded-xl text-xs overflow-x-auto w-full max-w-full">
        <button
          onClick={() => setMobileActiveBucket('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
            mobileActiveBucket === 'all'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Buckets
        </button>
        <button
          onClick={() => setMobileActiveBucket('new')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
            mobileActiveBucket === 'new'
              ? 'bg-[#00D084] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>New</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white">
            {newOrders.length}
          </span>
        </button>
        <button
          onClick={() => setMobileActiveBucket('picking')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
            mobileActiveBucket === 'picking'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>In Progress</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white">
            {pickingOrders.length}
          </span>
        </button>
        <button
          onClick={() => setMobileActiveBucket('ready')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
            mobileActiveBucket === 'ready'
              ? 'bg-purple-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Ready</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white">
            {readyOrders.length}
          </span>
        </button>
        <button
          onClick={() => setMobileActiveBucket('recent')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
            mobileActiveBucket === 'recent'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Done ({recentOrders.length})
        </button>
      </div>

      {/* Quick Test Toolbar (Wrapped for mobile) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 p-2 sm:p-2.5 rounded-xl border border-slate-200 text-xs w-full max-w-full">
        <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px] sm:text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Inject Test Webhook:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => simulator.sendNewOrder('deliveroo', 2)}
            className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-md font-bold text-[11px] text-[#008F83] transition-colors"
          >
            + Deliveroo
          </button>
          <button
            onClick={() => simulator.sendNewOrder('uber_eats', 3)}
            className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-md font-bold text-[11px] text-[#048244] transition-colors"
          >
            + Uber Eats
          </button>
          <button
            onClick={() => simulator.sendNewOrder('just_eat', 1)}
            className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-md font-bold text-[11px] text-[#C75D00] transition-colors"
          >
            + Just Eat
          </button>
          <button
            onClick={simulator.triggerWaitingThreshold}
            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-[11px] transition-colors"
          >
            3+ Threshold
          </button>
        </div>
      </div>

      {/* 4 Buckets Grid (With mobile filter support) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start w-full max-w-full">
        {/* Bucket 1: NEW / WAITING TO PICK */}
        {(mobileActiveBucket === 'all' || mobileActiveBucket === 'new') && (
          <div className="bg-white border-2 border-amber-300 rounded-2xl overflow-hidden shadow-xs flex flex-col min-h-[380px] w-full min-w-0">
            <div className="bg-amber-100/70 px-4 py-3 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  1. New / Waiting to Pick
                </h3>
              </div>
              <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded text-amber-900 border border-amber-300 tabular-nums">
                {newOrders.length}
              </span>
            </div>

            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
              {newOrders.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-center">
                  <CheckCircle2 className="w-7 h-7 mb-1.5 opacity-40 text-emerald-500" />
                  <p className="text-xs font-semibold">Queue clear</p>
                  <p className="text-[11px] mt-0.5">No unpicked orders waiting</p>
                </div>
              ) : (
                newOrders.map((order) => {
                  const elapsedMins = getElapsedMinutes(order.placedAt);
                  const isOverdue = elapsedMins >= 5;

                  return (
                    <div
                      key={order.id}
                      className={`rounded-xl p-3 border transition-all ${
                        isOverdue
                          ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                          : 'bg-amber-50/50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <ChannelBadge channelId={order.sourceChannel} customChannels={customChannels} />
                        <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-700">
                          <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-600' : 'text-amber-600'}`} />
                          <span className={isOverdue ? 'text-rose-700 font-black' : ''}>
                            {elapsedMins}m ago
                          </span>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between mb-2">
                        <span className="font-mono text-base font-extrabold text-slate-900">
                          {order.displayOrderNumber}
                        </span>
                        <span className="text-xs font-medium text-slate-600 truncate ml-2">
                          {order.customerName}
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="bg-white/80 rounded-lg p-2 text-xs space-y-1 border border-slate-200/80 mb-3">
                        {order.items.map((it) => (
                          <div key={it.id} className="flex justify-between text-slate-800">
                            <span className="font-semibold truncate mr-2">
                              {it.quantity}x {it.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => simulator.startPicking(order.id)}
                        className="w-full py-2 px-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <span>Start Picking</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Bucket 2: IN PROGRESS / PICKING */}
        {(mobileActiveBucket === 'all' || mobileActiveBucket === 'picking') && (
          <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xs flex flex-col min-h-[380px] w-full min-w-0">
            <div className="bg-blue-100/70 px-4 py-3 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  2. In Progress / Picking
                </h3>
              </div>
              <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded text-blue-900 border border-blue-300 tabular-nums">
                {pickingOrders.length}
              </span>
            </div>

            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
              {pickingOrders.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-center">
                  <Package className="w-7 h-7 mb-1.5 opacity-40 text-blue-500" />
                  <p className="text-xs font-semibold">No active pickers</p>
                  <p className="text-[11px] mt-0.5">Click "Start Picking" on any new order</p>
                </div>
              ) : (
                pickingOrders.map((order) => {
                  const pickElapsed = order.pickingStartedAt ? getElapsedMinutes(order.pickingStartedAt) : 0;
                  return (
                    <div
                      key={order.id}
                      className="bg-blue-50/40 rounded-xl p-3 border border-blue-200"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <ChannelBadge channelId={order.sourceChannel} customChannels={customChannels} />
                        <span className="font-mono text-xs font-semibold text-blue-700">
                          Pick: {pickElapsed}m
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between mb-2">
                        <span className="font-mono text-base font-extrabold text-slate-900">
                          {order.displayOrderNumber}
                        </span>
                        <span className="text-xs font-medium text-slate-600 truncate ml-2">
                          {order.customerName}
                        </span>
                      </div>

                      <div className="bg-white/80 rounded-lg p-2 text-xs space-y-1 border border-slate-200/80 mb-3">
                        {order.items.map((it) => (
                          <div key={it.id} className="flex justify-between text-slate-800">
                            <span className="truncate mr-2">{it.quantity}x {it.name}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => simulator.markReadyForPickup(order.id)}
                          className="py-1.5 px-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                        >
                          Mark Ready
                        </button>
                        <button
                          onClick={() => simulator.riderArrived(order.id)}
                          className="py-1.5 px-2 text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                        >
                          Rider Here
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Bucket 3: RIDER ARRIVED / READY */}
        {(mobileActiveBucket === 'all' || mobileActiveBucket === 'ready') && (
          <div className="bg-white border-2 border-purple-300 rounded-2xl overflow-hidden shadow-xs flex flex-col min-h-[380px] w-full min-w-0">
            <div className="bg-purple-100/70 px-4 py-3 border-b border-purple-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                  3. Rider Arrived / Ready
                </h3>
              </div>
              <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded text-purple-900 border border-purple-300 tabular-nums">
                {readyOrders.length}
              </span>
            </div>

            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
              {readyOrders.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-center">
                  <User className="w-7 h-7 mb-1.5 opacity-40 text-purple-500" />
                  <p className="text-xs font-semibold">No couriers waiting</p>
                  <p className="text-[11px] mt-0.5">Rider arrivals will trigger voice chimes here</p>
                </div>
              ) : (
                readyOrders.map((order) => {
                  const isRiderHere = order.riderStatus === 'ARRIVED';
                  return (
                    <div
                      key={order.id}
                      className={`rounded-xl p-3 border transition-all ${
                        isRiderHere
                          ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200'
                          : 'bg-emerald-50/50 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <ChannelBadge channelId={order.sourceChannel} customChannels={customChannels} />
                        {isRiderHere && (
                          <span className="px-2 py-0.5 bg-purple-200 text-purple-900 text-[10px] font-black uppercase rounded animate-pulse">
                            At Store Bay
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between mb-2">
                        <span className="font-mono text-base font-extrabold text-slate-900">
                          {order.displayOrderNumber}
                        </span>
                        <span className="text-xs font-medium text-slate-700 truncate ml-2">
                          {order.customerName}
                        </span>
                      </div>

                      {order.riderName && (
                        <div className="text-xs font-semibold text-purple-900 bg-purple-100/60 rounded px-2 py-1 mb-2 truncate">
                          Courier: {order.riderName}
                        </div>
                      )}

                      <div className="bg-white/80 rounded-lg p-2 text-xs space-y-1 border border-slate-200/80 mb-3">
                        {order.items.map((it) => (
                          <div key={it.id} className="flex justify-between text-slate-800">
                            <span className="truncate mr-2">{it.quantity}x {it.name}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => simulator.completeHandover(order.id)}
                        className="w-full py-2 px-3 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors shadow-xs"
                      >
                        Complete Handover
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Bucket 4: RECENT DISPATCHED / CANCELLED */}
        {(mobileActiveBucket === 'all' || mobileActiveBucket === 'recent') && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col min-h-[380px] w-full min-w-0">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                4. Recent Dispatched / Done
              </h3>
              <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded text-slate-600 border border-slate-200 tabular-nums">
                {recentOrders.length}
              </span>
            </div>

            <div className="p-3 space-y-2 flex-1 overflow-y-auto">
              {recentOrders.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-center">
                  <p className="text-xs font-semibold">No recent history</p>
                </div>
              ) : (
                recentOrders.slice(0, 6).map((order) => {
                  const isCancelled = order.status === 'CANCELLED';
                  return (
                    <div
                      key={order.id}
                      className={`rounded-lg p-2.5 border text-xs ${
                        isCancelled ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ChannelLogo channelId={order.sourceChannel} customChannels={customChannels} size="sm" />
                          <span className="font-mono font-bold text-slate-800 truncate">
                            {order.displayOrderNumber}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                            isCancelled ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex justify-between">
                        <span className="truncate mr-2">{order.customerName}</span>
                        <span className="font-mono shrink-0">£{order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Screen Operating Principle Notice */}
      <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-200 w-full">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Deliverect Retail Alert Board:</strong> Viewing or dismissing cards does not modify core POS tickets.
          </span>
        </div>
        <span className="text-[11px] text-slate-400 self-start sm:self-auto">
          Deliverect Quest Companion v7.56
        </span>
      </div>
    </div>
  );
};
