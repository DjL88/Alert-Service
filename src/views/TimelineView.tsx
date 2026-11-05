import React, { useState } from 'react';
import { useStoreAlerts } from '../context/StoreContext';
import { NormalizedEvent } from '../types';
import { ChannelBadge } from '../services/channelLogos';
import {
  Clock,
  Code,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Headphones,
  Eye,
  Filter,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const TimelineView: React.FC = () => {
  const { events, alerts, deliveryAttempts, customChannels, selectedStore } = useStoreAlerts();
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedPayloadEvent, setSelectedPayloadEvent] = useState<NormalizedEvent | null>(null);

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true;
    if (filterType === 'duplicates') return e.processingResult === 'duplicate_ignored';
    return e.eventType === filterType;
  });

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Event Intake & Timeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit stream: Raw inbound Deliverect webhooks $\to$ idempotency validation $\to$ output dispatch.
          </p>
        </div>

        {/* Filter Selector */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setFilterType('order.created')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              filterType === 'order.created'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Orders Created
          </button>
          <button
            onClick={() => setFilterType('driver.status_updated')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              filterType === 'driver.status_updated'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Driver Updates
          </button>
          <button
            onClick={() => setFilterType('duplicates')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              filterType === 'duplicates'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Duplicates Ignored
          </button>
        </div>
      </div>

      {/* Events Stream Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No events matching filter</p>
            <p className="text-xs mt-1">Use the simulator to trigger Deliverect events.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEvents.map((evt) => {
              const isDuplicate = evt.processingResult === 'duplicate_ignored';
              const isRegistered = evt.eventType === 'store.registered';
              const isDriver = evt.eventType === 'driver.status_updated';

              return (
                <div
                  key={evt.id}
                  className={`p-4 transition-colors hover:bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDuplicate ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">
                        {new Date(evt.receivedAt).toLocaleTimeString()}
                      </span>

                      {/* Source Channel Badge */}
                      {evt.channel && (
                        <ChannelBadge channelId={evt.channel} customChannels={customChannels} />
                      )}

                      {/* Event Type Badge */}
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                        {evt.eventType}
                      </span>

                      {/* Outcome Badge */}
                      <span
                        className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                          isDuplicate
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : evt.processingResult === 'processed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isDuplicate ? 'Duplicate Ignored (Safe)' : 'Processed'}
                      </span>

                      {evt.alertsCreatedCount > 0 && (
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                          <Headphones className="w-3 h-3" />
                          <span>{evt.alertsCreatedCount} Alert Dispatched</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-slate-900">{evt.summary}</p>

                    <div className="text-[11px] text-slate-500 font-mono flex flex-wrap items-center gap-3">
                      <span>Source ID: {evt.sourceEventId}</span>
                      <span>·</span>
                      <span>Deliverect Location: {evt.deliverectLocationId}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedPayloadEvent(evt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors shadow-2xs"
                    >
                      <Code className="w-3.5 h-3.5 text-slate-500" />
                      <span>Inspect Payload</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payload Modal / Drawer */}
      {selectedPayloadEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 text-slate-100 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-cyan-400" />
                  <span>Deliverect Webhook Payload: {selectedPayloadEvent.sourceEventId}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  EventType: {selectedPayloadEvent.eventType} · Received: {selectedPayloadEvent.receivedAt}
                </p>
              </div>
              <button
                onClick={() => setSelectedPayloadEvent(null)}
                className="text-slate-400 hover:text-white px-2 py-1 text-xs rounded hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-cyan-300 overflow-x-auto max-h-96 border border-slate-800">
                <pre>{JSON.stringify(selectedPayloadEvent.payload, null, 2)}</pre>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-lg text-xs space-y-1 text-slate-300">
                <span className="font-bold text-white">Event Normalization Summary:</span>
                <p className="text-slate-300">{selectedPayloadEvent.summary}</p>
                <div className="pt-1 text-[11px] text-slate-400 font-mono">
                  Result: {selectedPayloadEvent.processingResult} | Location ID: {selectedPayloadEvent.deliverectLocationId}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
