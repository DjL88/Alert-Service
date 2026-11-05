import React, { useState } from 'react';
import { useStoreAlerts } from '../context/StoreContext';
import { Destination } from '../types';
import {
  Headphones,
  Monitor,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  RotateCcw,
  Check,
  ShieldAlert,
  Clock,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export const DestinationsView: React.FC = () => {
  const {
    destinations,
    currentStoreDestinations,
    selectedStore,
    testDestination,
    deliveryAttempts,
    simulator,
  } = useStoreAlerts();

  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTest = async (destId: string) => {
    setTestingId(destId);
    await testDestination(destId);
    setTimeout(() => setTestingId(null), 800);
  };

  const storeAttempts = deliveryAttempts.filter((a) => a.storeId === selectedStore.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Output Destinations & Capabilities</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure output providers for {selectedStore.name}. Providers declare supported capabilities and delivery semantics.
          </p>
        </div>
      </div>

      {/* Critical Architecture Callout */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
            Delivery Receipt Semantics (VoCoVo & Screens)
          </h4>
          <p className="text-xs text-blue-800 leading-relaxed">
            <strong>"Provider accepted" must never be labelled "heard by staff".</strong> An HTTP 200 or socket ACK confirms that the provider gateway accepted the audio transmission packet. Official VoCoVo adapter specifications and credentials will be plugged in once verified in Phase 4.
          </p>
        </div>
      </div>

      {/* Destination Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {currentStoreDestinations.map((dest) => {
          const isVocovo = dest.type === 'vocovo';
          const isScreen = dest.type === 'live_screen';

          return (
            <div
              key={dest.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-xl shrink-0 ${
                        isVocovo ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isVocovo ? <Headphones className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{dest.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-slate-500 uppercase">
                          Type: {dest.type}
                        </span>
                        <span>·</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            dest.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : dest.status === 'simulated'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {dest.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTest(dest.id)}
                    disabled={testingId === dest.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{testingId === dest.id ? 'Sending...' : 'Test Alert'}</span>
                  </button>
                </div>

                {/* Status Note */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800">Connection Status:</div>
                  <p className="text-[11px] leading-relaxed">{dest.statusNote || 'Operating nominally.'}</p>
                </div>

                {/* Capabilities Matrix */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Declared Provider Capabilities
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      {dest.capabilities.spokenAnnouncements ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                      <span className={dest.capabilities.spokenAnnouncements ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                        Spoken Announcements
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {dest.capabilities.persistentCards ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                      <span className={dest.capabilities.persistentCards ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                        Persistent Cards
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {dest.capabilities.updatingCards ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                      <span className={dest.capabilities.updatingCards ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                        Updating / Resolving
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {dest.capabilities.groupTargeting ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                      <span className={dest.capabilities.groupTargeting ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                        Group Targeting
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {dest.capabilities.deliveryReceipts ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                      <span className={dest.capabilities.deliveryReceipts ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                        Delivery Receipts
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {dest.capabilities.healthChecks ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                      <span className={dest.capabilities.healthChecks ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                        Prober Health Checks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Configuration Specs */}
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Group:</span>
                    <span className="font-semibold text-slate-800">{dest.config.targetGroup || 'Default'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Retry Limit:</span>
                    <span className="font-mono">{dest.config.retryLimit} attempts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cooldown:</span>
                    <span className="font-mono">{dest.config.cooldownSeconds}s</span>
                  </div>
                </div>
              </div>

              {/* Footer / Last Delivery Result */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Last Delivery Outcome:</span>
                <span className="font-semibold text-slate-800">
                  {dest.lastDeliveryResult?.message || 'Awaiting first test'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery Attempts Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Delivery Attempts & Audit Trail</h3>
            <p className="text-xs text-slate-500">Logged dispatch attempts and acknowledgment receipts</p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {storeAttempts.length} Total Records
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {storeAttempts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No delivery attempts recorded yet. Click "Test Alert" above to dispatch.
            </div>
          ) : (
            storeAttempts.slice(0, 8).map((attempt) => (
              <div
                key={attempt.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/70"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">
                      {new Date(attempt.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-bold text-slate-900">{attempt.destinationName}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        attempt.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {attempt.status}
                    </span>
                    {attempt.isSimulated && (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        Simulated
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 font-medium">{attempt.message}</p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Key: {attempt.idempotencyKey} · Latency: {attempt.latencyMs}ms · Playback confirmed: {attempt.playbackConfirmedByStaff ? 'Yes' : 'No'}
                  </div>
                </div>

                {attempt.status === 'failed' && (
                  <button
                    onClick={() => simulator.retryDelivery(attempt.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Send</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
