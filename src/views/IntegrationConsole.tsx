import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AlertCircle, Check, Copy, RefreshCw, Settings2} from 'lucide-react';
import {channelIdentity} from '../../shared/channels';
import type {State} from '../../server/model';

type Profile = {
  id:string;
  provider:string;
  accountId:string;
  environment:string;
  credentialsConfigured:boolean;
  urls:Record<string,string>;
};
type ConsoleData = {state:State; profiles:Profile[]; storage:string};
type View = 'orders'|'stores'|'channels'|'activity';

const card = 'rounded-xl border border-slate-200 bg-white';
const formatTime = (value?:string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
};
const phaseName:Record<string,string> = {
  waiting:'Waiting',picking:'Picking',ready:'Ready',completed:'Completed',
  cancelled:'Cancelled',scheduled:'Scheduled',unknown:'Unknown'
};
const eventName:Record<string,string> = {
  registration:'Store connected',orders:'Order received',status:'Order updated',
  picking:'Picking updated','channel-status':'Connection updated'
};
const alertName:Record<string,string> = {
  screen_available:'Available on screen',blocked:'Not sent',suppressed:'Stopped'
};

export function IntegrationConsole() {
  const [token,setToken] = useState('');
  const demo=token==='__demo_preview__';
  const [input,setInput] = useState('');
  const [data,setData] = useState<ConsoleData|null>(null);
  const [view,setView] = useState<View>('orders');
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [loading,setLoading] = useState(false);
  const [busy,setBusy] = useState('');
  const [store,setStore] = useState('');
  const [settingsOpen,setSettingsOpen] = useState(false);
  const [copied,setCopied] = useState('');
  const [autoRefresh,setAutoRefresh] = useState(true);
  const requestId = useRef(0);
  const activeToken = useRef(token);
  activeToken.current = token;

  const refresh = useCallback(async (auth:string, quiet=false) => {
    if (!auth || auth==='__demo_preview__') return;
    const id = ++requestId.current;
    if (!quiet) setLoading(true);
    try {
      const response = await fetch('/api/console',{headers:{Authorization:'Bearer '+auth},cache:'no-store'});
      const body = await response.json().catch(()=>null);
      if (!response.ok) {
        if (response.status===401) throw new Error('Access denied. Check your access token.');
        const reference = body?.reference ? ' Reference: '+body.reference : '';
        throw new Error((body?.error || 'Unable to load store data.')+reference);
      }
      if (!body?.state || !Array.isArray(body.state.orders) || !Array.isArray(body.state.mappings)) {
        throw new Error('The server returned an unexpected response.');
      }
      if (id!==requestId.current || auth!==activeToken.current) return;
      setData(body);
      setError('');
    } catch (e) {
      if (id!==requestId.current || auth!==activeToken.current) return;
      setError(e instanceof TypeError ? 'Cannot reach the server. Check the published app and try again.' : (e as Error).message);
    } finally {
      if (id===requestId.current) setLoading(false);
    }
  },[]);

  useEffect(()=>{
    if (!token || demo) return;
    void refresh(token);
    if (!autoRefresh) return;
    const interval=setInterval(()=>{if (!document.hidden) void refresh(token,true);},15000);
    return ()=>clearInterval(interval);
  },[token,autoRefresh,refresh,demo]);

  async function syncChannels(profile:Profile) {
    if(demo)return;
    setBusy(profile.id);
    setMessage('');
    setError('');
    try {
      const response=await fetch('/api/profiles/'+encodeURIComponent(profile.id)+'/channels/sync',{
        method:'POST',headers:{Authorization:'Bearer '+token}
      });
      const body=await response.json().catch(()=>null);
      if (!response.ok) throw new Error(body?.error || 'Could not update channels.');
      setMessage('Channels updated.');
      await refresh(token);
    } catch(e) {setError((e as Error).message);}
    finally {setBusy('');}
  }

  async function copy(value:string) {
    try {await navigator.clipboard.writeText(value);setCopied(value);}
    catch {setError('Copy failed. You can select the address to copy it.');}
  }

  function signOut() {
    requestId.current++;
    setToken('');
    setInput('');
    setData(null);
    setError('');
    setMessage('');
    setSettingsOpen(false);
  }

  if (!token) return (
    <div className="mx-auto max-w-md pt-10">
      <div className={card+' p-7'}>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to Store Alerts</h1>
        <p className="mt-2 text-sm text-slate-600">Enter your access token to see connected stores and orders.</p>
        <form className="mt-7 space-y-4" onSubmit={e=>{e.preventDefault();setError('');setToken(input.trim());setInput('');}}>
          <label className="block text-sm font-medium" htmlFor="access-token">Access token</label>
          <input id="access-token" type="password" autoComplete="off" required value={input}
            onChange={e=>setInput(e.target.value)} placeholder="Enter access token"
            className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"/>
          <button type="submit" className="w-full rounded-lg bg-[#063d30] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0b5340]">Continue</button>
        </form>
        <div className="mt-5 border-t border-slate-200 pt-5"><button type="button" onClick={()=>{setToken('__demo_preview__');setError('');setData({storage:'Sample data — no backend connection',profiles:[],state:{mappings:[{id:'demo-m1',profileId:'demo',locationId:'store-1',externalLocationId:'store-1',channelLinkId:'demo-1',name:'High Street',state:'active',provider:'screen',updatedAt:new Date().toISOString()},{id:'demo-m2',profileId:'demo',locationId:'store-2',externalLocationId:'store-2',channelLinkId:'demo-2',name:'Station Road',state:'active',provider:'screen',updatedAt:new Date().toISOString()}],orders:[{id:'demo-o1',locationId:'store-1',channelId:'1',sourceChannelLinkId:'demo-1',displayId:'10042',phase:'waiting',sourceStatus:'1',updatedAt:new Date().toISOString(),receivedAt:new Date().toISOString(),reminders:0},{id:'demo-o2',locationId:'store-2',channelId:'2',sourceChannelLinkId:'demo-2',displayId:'10043',phase:'picking',sourceStatus:'PICKING_STARTED',updatedAt:new Date().toISOString(),receivedAt:new Date().toISOString(),reminders:0}],alerts:[],events:[],channels:[{channelId:'1',name:'Demo channel'}]}});}} className="w-full rounded-lg border border-emerald-700 px-4 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">Preview dashboard without a token</button><p className="mt-2 text-xs text-slate-500">Sample data only. Real stores and integrations remain private.</p></div>
      </div>
    </div>
  );

  const state=data?.state;
  const orders=state?.orders || [];
  const mappings=state?.mappings || [];
  const channels=state?.channels || [];
  const alerts=state?.alerts || [];
  const events=state?.events || [];
  const stores=[...new Set([...mappings.map(m=>m.locationId),...orders.map(o=>o.locationId)])];
  const visibleOrders=orders.filter(o=>(!store||o.locationId===store)&&!['completed','cancelled'].includes(o.phase))
    .sort((a,b)=>Date.parse(b.receivedAt)-Date.parse(a.receivedAt));
  const waiting=orders.filter(o=>o.phase==='waiting').length;
  const activeAlerts=alerts.filter(a=>a.status!=='suppressed'&&Date.parse(a.expiresAt)>Date.now()).length;
  const tabs:{id:View;label:string}[]=[
    {id:'orders',label:'Orders'},{id:'stores',label:'Stores'},
    {id:'channels',label:'Channels'},{id:'activity',label:'Activity'}
  ];

  return (
    <div className="space-y-6">
      {demo&&<div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><span><strong>Demo preview</strong> · Sample stores and orders. No Deliverect connection or live alerts.</span><button className="font-semibold underline" onClick={signOut}>Exit preview</button></div>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Your stores and order alerts in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={demo} aria-label="Refresh" title="Refresh" onClick={()=>void refresh(token)}
            className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50">
            <RefreshCw size={17} className={loading?'animate-spin':''}/>
          </button>
          <button disabled={demo} onClick={()=>setSettingsOpen(v=>!v)} aria-label="Settings" title="Settings"
            className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50">
            <Settings2 size={17}/>
          </button>
        </div>
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        <AlertCircle size={18} className="shrink-0 mt-0.5"/><div><p>{error}</p>
          <button className="mt-2 font-semibold underline" onClick={()=>void refresh(token)}>Try again</button>
          <button className="ml-4 underline" onClick={signOut}>Change access token</button>
        </div>
      </div>}
      {message && <p role="status" className="flex items-center gap-2 text-sm text-emerald-800"><Check size={16}/>{message}</p>}

      {settingsOpen && <section className={card+' p-5 space-y-5'}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Settings</h2>
          <button onClick={signOut} className="text-sm text-slate-600 underline">Sign out</button>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)} className="accent-emerald-700"/>
          Update automatically
        </label>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Deliverect connections</h3>
          {(data?.profiles||[]).map(profile=><div key={profile.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-medium">{profile.provider==='vocovo'?'VoCoVo':'Store screen'} · {profile.id}</p>
                <p className="text-xs text-slate-500 mt-1">{profile.environment} · {profile.accountId}</p>
              </div>
              <button disabled={!profile.credentialsConfigured||!!busy} onClick={()=>void syncChannels(profile)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40 hover:bg-slate-50">
                {busy===profile.id?'Updating…':'Update channels'}
              </button>
            </div>
            {!profile.credentialsConfigured&&<p className="mt-2 text-xs text-amber-800">Deliverect credentials need to be added on the server before channel updates work.</p>}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-slate-600">Connection addresses</summary>
              <div className="mt-3 space-y-3">
                {Object.entries(profile.urls).map(([name,url])=><div key={name}>
                  <p className="text-xs font-medium capitalize mb-1">{name}</p>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all rounded bg-slate-50 p-2 text-xs">{url}</code>
                    <button aria-label={'Copy '+name} title={'Copy '+name} onClick={()=>void copy(url)}
                      className="rounded border border-slate-200 p-2">{copied===url?<Check size={15}/>:<Copy size={15}/>}</button>
                  </div>
                </div>)}
              </div>
            </details>
          </div>)}
          {!data?.profiles?.length&&<p className="text-sm text-slate-600">No connections configured yet. Ask your administrator to set one up.</p>}
        </div>
      </section>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {label:'Connected stores',value:new Set(mappings.filter(m=>m.state==='active').map(m=>m.locationId)).size},
          {label:'Waiting orders',value:waiting},
          {label:'Active alerts',value:activeAlerts},
          {label:'Channels',value:channels.length}
        ].map(item=><div key={item.label} className={card+' p-4 sm:p-5'}>
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{item.value}</p>
        </div>)}
      </div>

      <div className="border-b border-slate-200 flex items-center gap-6 overflow-x-auto">
        {tabs.map(tab=><button key={tab.id} onClick={()=>setView(tab.id)}
          className={'pb-3 text-sm whitespace-nowrap border-b-2 '+(view===tab.id?'border-[#063d30] font-semibold text-slate-900':'border-transparent text-slate-500 hover:text-slate-900')}>
          {tab.label}
        </button>)}
      </div>

      {view==='orders'&&<section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
          <h2 className="font-semibold">Active orders</h2>
          <select value={store} onChange={e=>setStore(e.target.value)} aria-label="Filter by store"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">All stores</option>
            {stores.map(id=><option key={id} value={id}>{mappings.find(m=>m.locationId===id)?.name||id}</option>)}
          </select>
        </div>
        {!visibleOrders.length?<p className="p-8 text-center text-sm text-slate-500">{loading?'Loading orders…':'No active orders.'}</p>:
          <div className="divide-y divide-slate-100">
            {visibleOrders.map(order=><div key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
              <div>
                <p className="font-semibold">{order.displayId||order.id}</p>
                <p className="mt-1 text-xs text-slate-500">{mappings.find(m=>m.locationId===order.locationId)?.name||order.locationId} · {formatTime(order.receivedAt)}</p>
              </div>
              <span className={'rounded-full px-3 py-1 text-xs font-medium '+(order.phase==='waiting'?'bg-amber-50 text-amber-800':'bg-slate-100 text-slate-700')}>
                {phaseName[order.phase]||order.phase}
              </span>
            </div>)}
          </div>}
      </section>}

      {view==='stores'&&<section className={card}>
        <div className="border-b border-slate-100 p-5"><h2 className="font-semibold">Stores</h2></div>
        {!mappings.length?<p className="p-8 text-center text-sm text-slate-500">No stores connected yet.</p>:
          <div className="divide-y divide-slate-100">
            {mappings.map(m=><div key={m.id} className="flex flex-wrap justify-between items-center gap-3 px-5 py-4">
              <div><p className="font-medium">{m.name||m.locationId}</p><p className="mt-1 text-xs text-slate-500">{m.locationId}</p></div>
              <span className={'text-xs font-medium '+(m.state==='active'?'text-emerald-700':'text-slate-500')}>
                {m.state==='active'?'Connected':m.state==='registered'?'Registered':'Inactive'}
              </span>
            </div>)}
          </div>}
      </section>}

      {view==='channels'&&<section className={card+' p-5'}>
        <h2 className="font-semibold mb-4">Channels</h2>
        {!channels.length?<p className="py-5 text-sm text-slate-500">No channels available. Open Settings to connect Deliverect.</p>:
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map(ch=>{const identity=channelIdentity(ch.channelId,channels);return <div key={String(ch.channelId)}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3">
              {identity.icon?<img src={identity.icon} alt="" className="h-7 w-7 object-contain"/>:<span className="h-7 w-7 rounded bg-slate-100"/>}
              <span className="text-sm font-medium">{identity.name}</span>
            </div>})}
          </div>}
      </section>}

      {view==='activity'&&<div className="grid gap-4 lg:grid-cols-2">
        <section className={card}>
          <div className="border-b border-slate-100 p-5"><h2 className="font-semibold">Recent activity</h2></div>
          {!events.length?<p className="p-6 text-sm text-slate-500">Nothing to show yet.</p>:
            <div className="divide-y divide-slate-100">{events.slice(-30).reverse().map(event=><div key={event.id} className="px-5 py-3">
              <p className="text-sm font-medium">{eventName[event.kind]||'Update received'}</p>
              <p className="mt-1 text-xs text-slate-500">{event.orderId||event.locationId||''} · {formatTime(event.at)}</p>
            </div>)}</div>}
        </section>
        <section className={card}>
          <div className="border-b border-slate-100 p-5"><h2 className="font-semibold">Alert history</h2></div>
          {!alerts.length?<p className="p-6 text-sm text-slate-500">No alerts yet.</p>:
            <div className="divide-y divide-slate-100">{alerts.slice(-30).reverse().map(alert=><div key={alert.id} className="px-5 py-3">
              <p className="text-sm font-medium">{alert.message}</p>
              <p className="mt-1 text-xs text-slate-500">{alertName[alert.status]||alert.status} · {formatTime(alert.createdAt)}</p>
            </div>)}</div>}
        </section>
      </div>}

      {loading&&!data&&<p className="text-center text-sm text-slate-500">Connecting…</p>}
      {!demo&&<p className="text-xs text-slate-400">VoCoVo headset delivery is not yet connected. Order information is read-only.</p>}
    </div>
  );
}
