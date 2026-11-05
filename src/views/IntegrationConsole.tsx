import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  RefreshCw,
  Lock,
  Copy,
  Monitor,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  Check,
  Trash2,
  Clock,
  Radio,
  Volume2,
  Zap,
} from 'lucide-react';
import { channelIdentity } from '../../shared/channels';
import type { State, Alert } from '../../server/model';
import { audioService } from '../services/audioService';

type ConsoleData = {
  state: State;
  storage: string;
  profiles: {
    id: string;
    provider: string;
    accountId: string;
    environment: string;
    credentialsConfigured: boolean;
    urls: Record<string, string>;
  }[];
  capabilities: Record<string, string>;
};

export function IntegrationConsole() {
  const [token, setToken] = useState('');
  const [draft, setDraft] = useState('');
  const authRef = useRef(token);
  authRef.current = token;

  const [data, setData] = useState<ConsoleData | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [location, setLocation] = useState('');
  const [copied, setCopied] = useState('');
  const [lastLoaded, setLastLoaded] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showTests, setShowTests] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [loading, setLoading] = useState(false);

  // Track seen alert IDs to trigger voice announcements for new server alerts
  const seenAlertIdsRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async (auth = token) => {
    if (!auth) return;
    setLoading(true);
    try {
      const r = await fetch('/api/console', {
        headers: { Authorization: `Bearer ${auth}` },
        cache: 'no-store',
      });
      const body = await r.json().catch(() => null);
      if (!r.ok) {
        if (r.status === 401) throw new Error('Access denied. Check your access token.');
        throw new Error(body?.error || `Unable to load data (HTTP ${r.status}).`);
      }
      if (!body?.state || !Array.isArray(body.state.orders)) throw new Error('The server returned an unexpected response.');
      if (authRef.current !== auth) return;

      // Check for new server alerts and announce via audio queue
      if (body.state?.alerts) {
        const newAlerts = body.state.alerts.filter(
          (a: Alert) =>
            !seenAlertIdsRef.current.has(a.id) &&
            a.status !== 'suppressed' &&
            Date.parse(a.expiresAt) > Date.now()
        );
        newAlerts.forEach((a: Alert) => {
          seenAlertIdsRef.current.add(a.id);
          // Play polite railway chime and voice announcement
          audioService.speak(a.message, 'high');
        });
        // Seed initial seen alerts so we don't replay old history on first load
        if (seenAlertIdsRef.current.size === 0) {
          body.state.alerts.forEach((a: Alert) => seenAlertIdsRef.current.add(a.id));
        }
      }

      setData(body);
      setError('');
      setLastLoaded(new Date().toLocaleTimeString());
    } catch (e: any) {
      if (authRef.current === auth) setError(e instanceof TypeError ? 'Cannot connect to the server. Check that the app is running and try again.' : e.message);
    } finally {
      if (authRef.current === auth) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void refresh();
    if (!autoRefresh) return;
    const timer = setInterval(() => void refresh(), 8000);
    return () => clearInterval(timer);
  }, [token, autoRefresh, refresh]);

  async function syncChannels(id: string) {
    setBusy(true);
    setError('');
    setSuccessMsg('');
    try {
      const r = await fetch(`/api/profiles/${id}/channels/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      setSuccessMsg(`Successfully synced ${b.count} channels from Deliverect API`);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function triggerTestWebhook(kind: string, payload: any, profileId?: string) {
    if (!data?.profiles?.length) return;
    const targetProfile = profileId || data.profiles[0].id;
    setTestBusy(true);
    setError('');
    setSuccessMsg('');
    try {
      const r = await fetch('/api/test/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profileId: targetProfile,
          kind,
          payload,
        }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || 'Test webhook failed');
      setSuccessMsg(`Webhook '${kind}' processed successfully: ${JSON.stringify(b.result || b.mapping?.state || 'OK')}`);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTestBusy(false);
    }
  }

  async function triggerSweep() {
    setTestBusy(true);
    setError('');
    setSuccessMsg('');
    try {
      const r = await fetch('/api/test/sweep', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      setSuccessMsg('5-minute reminder sweep executed successfully');
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTestBusy(false);
    }
  }

  async function resetServerState() {
    if (!confirm('Are you sure you want to reset server state for this tenant?')) return;
    setTestBusy(true);
    setError('');
    setSuccessMsg('');
    try {
      const r = await fetch('/api/test/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      seenAlertIdsRef.current.clear();
      setSuccessMsg('Server state reset to initial clean state');
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTestBusy(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(''), 2500);
    } catch {
      setError('Copy unavailable. Select the displayed URL to copy it.');
    }
  }

  const panel = 'bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs';

  if (!token) {
    return (
      <section className="max-w-lg mx-auto py-10 sm:py-16">
        <div className={panel}>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">Connect to Store Alerts</h1>
          <p className="text-sm text-slate-600 mb-6">Enter the access token provided by your administrator.</p>
          <form onSubmit={(event) => { event.preventDefault(); setError(''); setToken(draft.trim()); setDraft(''); }} className="space-y-4">
            <div>
              <label htmlFor="admin-token" className="block text-sm font-medium text-slate-700 mb-2">Access token</label>
              <input id="admin-token" type="password" autoComplete="off" required value={draft} onChange={(event) => setDraft(event.target.value)}
                placeholder="Enter access token" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800">Connect</button>
          </form>
          <p className="mt-5 text-xs text-slate-500">No access token? Configure an integration on the server first.</p>
        </div>
      </section>
    );
  }

  const mappings = data?.state.mappings || [];
  const locations = [...new Set(mappings.map((m) => m.locationId))];
  const allOrders = data?.state.orders || [];
  const orders = allOrders.filter(
    (o) => (!location || o.locationId === location) && !['completed', 'cancelled'].includes(o.phase)
  );
  const waitingOrders = allOrders.filter((o) => o.phase === 'waiting');
  const activeAlerts = (data?.state.alerts || []).filter(
    (a) => a.status !== 'suppressed' && Date.parse(a.expiresAt) > Date.now()
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Console Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Alerts</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Connected
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {loading && !data ? 'Loading…' : `Updated ${lastLoaded || 'just now'}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <span>{autoRefresh ? 'Live updates' : 'Updates paused'}</span>
          </button>

          <button
            onClick={() => void refresh()}
            className="border border-slate-300 hover:bg-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors bg-white shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setToken('');
              setData(null);
              setError('');
              seenAlertIdsRef.current.clear();
            }}
            className="border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors bg-white shadow-2xs"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div role="alert" className="bg-rose-50 text-rose-800 border border-rose-200 p-4 rounded-xl text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error} — displayed data may be stale.</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-3 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className={panel}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Connected stores</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{mappings.length}</p>

        </div>
        <div className={panel}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Waiting orders</p>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">{waitingOrders.length}</p>

        </div>
        <div className={panel}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active alerts</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{activeAlerts.length}</p>

        </div>
        <div className={panel}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Channels</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{data?.state.channels.length || 0}</p>

        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <button className="text-sm text-slate-600 underline underline-offset-2" onClick={() => setShowTests(v => !v)}>{showTests ? 'Hide test tools' : 'Show test tools'}</button>
        <button className="text-sm text-slate-600 underline underline-offset-2" onClick={() => setShowTechnical(v => !v)}>{showTechnical ? 'Hide connection details' : 'Connection details'}</button>
      </div>
      {/* Test tools are intentionally hidden until needed */}
      {showTests && <section className={`${panel} border-emerald-200 bg-gradient-to-br from-white to-emerald-50/20`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-base sm:text-lg text-slate-900">
              Test events
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Test actions change the connected pilot data.
          </span>
        </div>

        <p className="text-xs text-slate-600 mb-4">
          Use these controls to test registration, orders and picking before connecting a live retailer.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Action 1: Register Location */}
          <button
            disabled={testBusy}
            onClick={() =>
              triggerTestWebhook('registration', {
                status: 'register',
                channelLinkId: 'REG-DEL-8812',
                locationId: 'DEL-8812',
                channelLocationId: 'VOCOVO-SOHO-01',
                channelLinkName: 'VoCoVo Alerts — Soho Flagship',
              })
            }
            className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-left text-xs font-bold text-slate-800 disabled:opacity-50 transition-all hover:border-emerald-500 hover:shadow-2xs"
          >
            <div className="text-[10px] text-slate-400 uppercase">Step 1</div>
            <div className="mt-1 font-semibold text-slate-900">1. Register Soho</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Map to VOCOVO-SOHO</div>
          </button>

          {/* Action 2: Activate Location */}
          <button
            disabled={testBusy}
            onClick={() =>
              triggerTestWebhook('registration', {
                status: 'active',
                channelLinkId: 'REG-DEL-8812',
                locationId: 'DEL-8812',
                channelLocationId: 'VOCOVO-SOHO-01',
              })
            }
            className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-left text-xs font-bold text-slate-800 disabled:opacity-50 transition-all hover:border-emerald-500 hover:shadow-2xs"
          >
            <div className="text-[10px] text-slate-400 uppercase">Step 2</div>
            <div className="mt-1 font-semibold text-slate-900">2. Activate Link</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Enable outputs</div>
          </button>

          {/* Action 3: Inject Deliveroo Order */}
          <button
            disabled={testBusy}
            onClick={() => {
              const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
              triggerTestWebhook('orders', {
                _id: orderId,
                account: data?.profiles[0]?.accountId || 'deliv-acc-artisan-88',
                location: 'DEL-8812',
                channel: 2, // Deliveroo
                channelLink: 'deliveroo-soho-link',
                channelOrderDisplayId: `#DEL-${Math.floor(100 + Math.random() * 900)}`,
                status: 20, // Waiting
                _updated: new Date().toISOString(),
              });
            }}
            className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-emerald-50 text-left text-xs font-bold text-slate-800 disabled:opacity-50 transition-all hover:border-emerald-500 hover:shadow-2xs"
          >
            <div className="text-[10px] text-emerald-600 uppercase font-black">Step 3</div>
            <div className="mt-1 font-semibold text-emerald-950">3. New Deliveroo</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Alerts + Audio Voice</div>
          </button>

          {/* Action 4: Inject Uber Eats Order */}
          <button
            disabled={testBusy}
            onClick={() => {
              const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
              triggerTestWebhook('orders', {
                _id: orderId,
                account: data?.profiles[0]?.accountId || 'deliv-acc-artisan-88',
                location: 'DEL-8812',
                channel: 3, // Uber Eats
                channelLink: 'uber-soho-link',
                channelOrderDisplayId: `#UE-${Math.floor(100 + Math.random() * 900)}`,
                status: 20,
                _updated: new Date().toISOString(),
              });
            }}
            className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-emerald-50 text-left text-xs font-bold text-slate-800 disabled:opacity-50 transition-all hover:border-emerald-500 hover:shadow-2xs"
          >
            <div className="text-[10px] text-emerald-600 uppercase font-black">Step 4</div>
            <div className="mt-1 font-semibold text-emerald-950">4. New Uber Eats</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Alerts + Audio Voice</div>
          </button>

          {/* Action 5: Start Picking in Quest */}
          <button
            disabled={testBusy || waitingOrders.length === 0}
            onClick={() => {
              const target = waitingOrders[0];
              if (!target) return;
              triggerTestWebhook('picking', {
                orderId: target.id,
                pickingStatus: 'PICKING_STARTED',
                location: target.locationId,
                timeStamp: new Date().toISOString(),
              });
            }}
            className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-left text-xs font-bold text-slate-800 disabled:opacity-40 transition-all hover:border-amber-500 hover:shadow-2xs"
          >
            <div className="text-[10px] text-amber-600 uppercase font-black">Step 5</div>
            <div className="mt-1 font-semibold text-slate-900">5. Start Picking</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cancels reminders</div>
          </button>

          {/* Action 6: Complete Picking / Ready */}
          <button
            disabled={testBusy || allOrders.length === 0}
            onClick={() => {
              const target = allOrders.find((o) => o.phase === 'picking') || allOrders[0];
              if (!target) return;
              triggerTestWebhook('picking', {
                orderId: target.id,
                pickingStatus: 'PICKING_COMPLETE',
                location: target.locationId,
                timeStamp: new Date().toISOString(),
              });
            }}
            className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-left text-xs font-bold text-slate-800 disabled:opacity-40 transition-all hover:border-blue-500 hover:shadow-2xs"
          >
            <div className="text-[10px] text-blue-600 uppercase font-black">Step 6</div>
            <div className="mt-1 font-semibold text-slate-900">6. Ready Pickup</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Status 70</div>
          </button>
        </div>

        {/* Secondary Test Controls */}
        <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              disabled={testBusy}
              onClick={() => void triggerSweep()}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Simulate 5-min Reminder Sweep</span>
            </button>

            <button
              disabled={testBusy || waitingOrders.length === 0}
              onClick={() => {
                const target = waitingOrders[0];
                if (!target) return;
                triggerTestWebhook('status', {
                  orderId: target.id,
                  status: 110, // Cancelled
                  timeStamp: new Date().toISOString(),
                });
              }}
              className="px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 font-bold text-rose-800 flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Cancel Waiting Order (110)</span>
            </button>
          </div>

          <button
            disabled={testBusy}
            onClick={() => void resetServerState()}
            className="text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Server Pilot State</span>
          </button>
        </div>
      </section>}

      {/* Profiles & Registered Webhook Endpoints */}
      {showTechnical && <>
      <div className="grid lg:grid-cols-2 gap-4">
        {data?.profiles.map((p) => (
          <section className={panel} key={p.id}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex gap-2.5 items-center">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  {p.provider === 'vocovo' ? <Headphones className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-900">{p.id}</h2>
                  <p className="text-[11px] text-slate-500">{p.provider.toUpperCase()} · {p.accountId}</p>
                </div>
              </div>
              <span className="text-xs rounded-full px-2.5 py-0.5 bg-amber-50 text-amber-800 font-bold border border-amber-200">
                {p.environment}
              </span>
            </div>

            <p className="text-xs text-slate-500 my-2.5 leading-relaxed">
              Stores are linked automatically when Deliverect registers them.
            </p>

            <div className="space-y-2 mt-3">
              {Object.entries(p.urls).map(([name, url]) => (
                <div key={name}>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {name} Webhook URL
                  </label>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs break-all flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-700">
                      {url}
                    </code>
                    <button
                      aria-label={`Copy ${name} URL`}
                      onClick={() => void copy(url)}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                      title="Copy webhook URL"
                    >
                      {copied === url ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                disabled={busy || !p.credentialsConfigured}
                onClick={() => void syncChannels(p.id)}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl px-4 py-2 text-xs font-bold transition-colors"
              >
                {busy ? 'Syncing...' : 'Sync channels'}
              </button>
              {!p.credentialsConfigured && (
                <span className="text-[11px] text-amber-800 font-semibold">
                  Add Deliverect credentials on the server
                </span>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Contract & Quest Coexistence Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs sm:text-sm text-amber-950 flex gap-3 shadow-2xs">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Integration limits</p>
          <p className="leading-relaxed">
            Deliverect may need to enable additional event access. This service does not change orders in Quest. VoCoVo delivery is not active until its integration is configured.
          </p>
        </div>
      </div>

      {/* Store connections */}
      <section className={panel}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-bold text-base sm:text-lg text-slate-900">
            Automatically Registered Destinations
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {mappings.length} configured
          </span>
        </div>

        {!mappings.length ? (
          <p className="text-xs text-slate-500 py-3">
            Waiting for the first signed registration webhook. 
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-2.5">Store / Location Code</th>
                  <th className="p-2.5">Profile</th>
                  <th className="p-2.5">External Destination ID</th>
                  <th className="p-2.5">Registration State</th>
                  <th className="p-2.5">Alert Output Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mappings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="p-2.5">
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{m.locationId}</div>
                    </td>
                    <td className="p-2.5 font-mono text-slate-600">{m.profileId}</td>
                    <td className="p-2.5 font-mono font-bold text-slate-800">{m.externalLocationId}</td>
                    <td className="p-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.state === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.state === 'registered'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.state.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2.5">
                      {m.provider === 'screen' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Screen Output Available
                        </span>
                      ) : (
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> VoCoVo API Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      </>}
      {/* Orders */}
      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900">Live Operations Board</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Read-only alongside Quest · Last event: {data?.state.lastFeedAt || 'Not observed'} · Sweep: {data?.state.lastSweepAt || 'Not observed'}
            </p>
          </div>

          <select
            aria-label="Filter live store"
            className="border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-700 bg-white"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">All registered stores ({locations.length})</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                Location: {l}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {orders.map((o) => {
            const c = channelIdentity(o.channelId, data?.state.channels || []);
            const isWaiting = o.phase === 'waiting';
            return (
              <article
                key={o.id}
                className={`border rounded-2xl p-4 transition-all shadow-2xs ${
                  isWaiting ? 'bg-rose-50/40 border-rose-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {c.icon && <img src={c.icon} alt="" className="w-6 h-6 object-contain" />}
                    <strong className="text-xs font-bold text-slate-800">{c.name}</strong>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      o.phase === 'waiting'
                        ? 'bg-rose-100 text-rose-800'
                        : o.phase === 'picking'
                        ? 'bg-amber-100 text-amber-800'
                        : o.phase === 'ready'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {o.phase}
                  </span>
                </div>

                <p className="text-xl font-black text-slate-900 mt-2 font-mono">{o.displayId}</p>

                <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
                  <span>Status: <strong className="font-semibold text-slate-800">{o.sourceStatus}</strong></span>
                  <span className="font-mono text-[11px] text-slate-500">{o.locationId}</span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Read-only order status
                  </span>
                  {o.reminders > 0 && (
                    <span className="text-amber-700 font-bold">
                      {o.reminders} reminder{o.reminders > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {!orders.length && (
          <p className="text-xs text-slate-500 py-6 text-center">
            No active orders yet.
          </p>
        )}
      </section>

      {/* Channel Directory & Artwork */}
      <section className={panel}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900">Channels</h2>
            <p className="text-xs text-slate-500">
              Channels returned by Deliverect.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {data?.state.channels.length || 0} channels
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {data?.state.channels.map((c) => {
            const identity = channelIdentity(c.channelId, data.state.channels);
            return (
              <span
                key={c.channelId}
                className="flex items-center gap-2 border border-slate-200 rounded-full px-3 py-1 text-xs bg-slate-50 text-slate-800 font-semibold"
              >
                {identity.icon && <img src={identity.icon} alt="" className="w-4 h-4 object-contain" />}
                <span>{identity.name}</span>
                <span className="text-slate-400 font-mono text-[10px]">#{c.channelId}</span>
              </span>
            );
          })}
        </div>
      </section>

      {/* Recent Events & Audit Trail */}
      <section className={panel}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900">Recent activity</h2>
            <p className="text-xs text-slate-500">
              Received updates ({data?.state.pendingEvents?.length || 0} awaiting orders)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-2.5">Received At</th>
                <th className="p-2.5">Kind</th>
                <th className="p-2.5">Order / Store Location</th>
                <th className="p-2.5">Source Status</th>
                <th className="p-2.5">Processing Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.state.events || []).slice(-20).reverse().map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(e.at).toLocaleTimeString()}
                  </td>
                  <td className="p-2.5 font-bold text-slate-900">{e.kind}</td>
                  <td className="p-2.5 font-mono text-[11px] text-slate-600">
                    {e.orderId || e.locationId}
                  </td>
                  <td className="p-2.5 font-mono text-[11px] text-slate-700">{e.sourceStatus || '—'}</td>
                  <td className="p-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        e.result === 'processed' || e.result === 'registered' || e.result === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : e.result === 'duplicate'
                          ? 'bg-amber-100 text-amber-800'
                          : e.result === 'awaiting_order'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {e.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Alert Outcomes Log */}
      <section className={panel}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-bold text-base sm:text-lg text-slate-900">Alert history</h2>
          <span className="text-xs text-slate-500">
            
          </span>
        </div>

        <div className="space-y-2">
          {(data?.state.alerts || []).slice(-10).reverse().map((a) => (
            <div
              key={a.id}
              className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 truncate">{a.message}</p>
                  <p className="text-[11px] text-slate-500">{a.reason || 'Screen available; awaiting playback receipt'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[11px] text-slate-500 uppercase">{a.provider}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    a.status === 'screen_available'
                      ? 'bg-emerald-100 text-emerald-800'
                      : a.status === 'blocked'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {a.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
