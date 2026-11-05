import React, { useState } from 'react';
import { useStoreAlerts } from '../context/StoreContext';
import { AlertRule } from '../types';
import {
  Bell,
  Sliders,
  Clock,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RotateCcw,
  Shield,
  Layers,
} from 'lucide-react';

export const RulesView: React.FC = () => {
  const { currentStoreRules, updateAlertRule, selectedStore, destinations } = useStoreAlerts();
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Store Alert Rules & Thresholds</h2>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic trigger rules, queue thresholds, cooldown timers, and headset broadcast templates for {selectedStore.name}.
          </p>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="space-y-4">
        {currentStoreRules.map((rule) => {
          const isThreshold = rule.trigger === 'waiting_threshold';
          const isReminder = rule.trigger === 'unpicked_reminder';

          return (
            <div
              key={rule.id}
              className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
                rule.enabled ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{rule.name}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        rule.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : rule.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rule.priority} Priority
                    </span>
                    <span className="font-mono text-xs text-slate-400">Trigger: {rule.trigger}</span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Spoken Template: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[11px]">"{rule.template}"</code>
                  </p>
                </div>

                {/* Enable Switch */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => updateAlertRule(rule.id, { enabled: !rule.enabled })}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      rule.enabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {rule.enabled ? 'Rule Active' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Threshold / Reminder Controls */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {isThreshold && (
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Waiting Orders Threshold:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={rule.thresholdValue || 3}
                        onChange={(e) =>
                          updateAlertRule(rule.id, { thresholdValue: Number(e.target.value) })
                        }
                        className="w-28 accent-slate-900 cursor-pointer"
                      />
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {rule.thresholdValue || 3} orders
                      </span>
                    </div>
                  </div>
                )}

                {isReminder && (
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Unpicked Re-check Delay:
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">
                        {rule.reminderDelayMinutes || 5} mins
                      </span>
                      <span className="text-[11px] text-slate-400">
                        (Suppressed if picking started)
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Cooldown Interval:</label>
                  <span className="font-mono font-bold text-slate-800">{rule.cooldownSeconds}s</span>
                  <span className="text-[11px] text-slate-400 ml-1">anti-chatter filter</span>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Destinations:</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {rule.destinationIds.map((did) => {
                      const dest = destinations.find((d) => d.id === did);
                      return (
                        <span
                          key={did}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {dest ? dest.name.split(' ')[0] : did}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Determinism Policy */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-slate-700" />
          Deterministic Alerting Policy
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">
          All alerts use deterministic formatting templates with zero generative AI. When a delayed reminder triggers, the system re-reads the order state directly from storage: if picking has started, the order was cancelled, or the store was suspended, the reminder is suppressed immediately.
        </p>
      </div>
    </div>
  );
};
