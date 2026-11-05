import express from 'express';
import {resolve} from 'node:path';
import type {Profile} from './model.ts';
import type {Repository} from './storage.ts';
import {InputError, sameSecret, validSignature, register, receive, sweep} from './domain.ts';
export function createApp(repo: Repository, profiles: Profile[], origin: string, schedulerToken: string) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');next();});
  app.get('/healthz',(_req,res)=>res.json({status:'ok'}));
  const base=(p:Profile)=>`${origin}/webhooks/deliverect/${p.id}`;
  const wrap=(fn:any)=>(req:any,res:any,next:any)=>Promise.resolve(fn(req,res)).catch(next);
  app.post('/webhooks/deliverect/:profile/:kind',express.raw({type:'application/json',limit:'512kb'}),wrap(async(req:any,res:any)=>{
    const p=profiles.find(p=>p.id===req.params.profile);
    if (!p || !['registration','orders','status','channel-status','picking'].includes(req.params.kind)) throw new InputError('Unknown endpoint',404);
    const raw=req.body;
    if (!Buffer.isBuffer(raw)) throw new InputError('Expected application/json');
    const secret=['orders','status'].includes(req.params.kind)?p.reportingSecret:p.webhookSecret;
    if (!validSignature(raw,String(req.headers['x-server-authorization-hmac-sha256']||''),secret)) throw new InputError('Invalid signature',401);
    let body:any; try {body=JSON.parse(raw.toString('utf8'));} catch {throw new InputError('Invalid JSON');}
    if (!body || typeof body!=='object' || Array.isArray(body)) throw new InputError('Expected JSON object');
    const now=new Date().toISOString();
    if(req.params.kind==='registration') {
      await repo.transact(p.tenantId,s=>register(s,p,body,now));
      // Only advertise implemented channel callbacks. Reporting subscription is separate.
      res.json({statusUpdateURL:`${base(p)}/channel-status`,retailEventsWebhookURL:`${base(p)}/picking`});
    } else {
      const result=await repo.transact(p.tenantId,s=>receive(s,p,req.params.kind,body,now,profiles));
      res.json(result);
    }
  }));
  app.post('/internal/sweep',wrap(async(req:any,res:any)=>{
    if(schedulerToken.length<24 || !sameSecret(req.headers.authorization||'',`Bearer ${schedulerToken}`)) throw new InputError('Unauthorized',401);
    for(const tenant of new Set(profiles.map(p=>p.tenantId))) await repo.transact(tenant,s=>sweep(s,new Date().toISOString()));
    res.json({ok:true});
  }));
  app.use('/api', express.json({limit:'256kb'}));
  app.use('/api', (req:any,res,next)=>{
    const profile=profiles.find(p=>sameSecret(req.headers.authorization||'',`Bearer ${p.adminToken}`));
    if(!profile) {res.status(401).json({error:'Enter a valid server-configured admin token'});return;}
    req.tenantId=profile.tenantId;
    res.setHeader('Cache-Control','no-store'); next();
  });
  app.post('/api/test/webhook', wrap(async(req:any,res:any)=>{
    const {profileId, kind, payload} = req.body || {};
    const p = profiles.find(p => p.id === profileId && p.tenantId === req.tenantId);
    if (!p) throw new InputError('Unknown profile', 404);
    const now = new Date().toISOString();
    if (kind === 'registration') {
      const mapping = await repo.transact(p.tenantId, s => register(s, p, payload, now));
      res.json({ ok: true, mapping, statusUpdateURL: `${base(p)}/channel-status` });
    } else {
      const result = await repo.transact(p.tenantId, s => receive(s, p, kind, payload, now, profiles));
      res.json({ ok: true, result });
    }
  }));
  app.post('/api/test/sweep', wrap(async(req:any,res:any)=>{
    await repo.transact(req.tenantId, s => sweep(s, new Date().toISOString()));
    res.json({ ok: true });
  }));
  app.post('/api/test/reset', wrap(async(req:any,res:any)=>{
    const { emptyState } = await import('./model.ts');
    await repo.transact(req.tenantId, s => {
      const fresh = emptyState();
      s.orders = [];
      s.events = [];
      s.alerts = [];
      s.mappings = [];
      s.pendingEvents = [];
      s.channels = fresh.channels;
    });
    res.json({ ok: true });
  }));
  app.get('/api/console',wrap(async(req:any,res:any)=>{
    const state=await repo.transact(req.tenantId,s=>s);
    res.json({state,storage:process.env.STORAGE_DRIVER==='firestore'?'firestore':'local development',
      profiles:profiles.filter(p=>p.tenantId===req.tenantId).map(p=>({id:p.id,provider:p.provider,accountId:p.accountId,environment:p.environment,
        credentialsConfigured:!!(p.clientId&&p.clientSecret),
        urls:{registration:`${base(p)}/registration`,orders:`${base(p)}/orders`,status:`${base(p)}/status`,picking:`${base(p)}/picking`}})),
      capabilities:{vocovo:'Awaiting provider API contract',pickingWrites:'Disabled: Quest coexistence not verified',reporting:'Requires separate Deliverect provisioning'},
    });
  }));
  app.post('/api/profiles/:id/channels/sync',wrap(async(req:any,res:any)=>{
    const p=profiles.find(p=>p.id===req.params.id&&p.tenantId===req.tenantId);
    if(!p) throw new InputError('Unknown profile',404);
    if(!p.clientId||!p.clientSecret) throw new InputError('Configure Deliverect client credentials on the server',409);
    const root=p.environment==='staging'?'https://api.staging.deliverect.com':'https://api.deliverect.com';
    const auth=await fetch(`${root}/oauth/token`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({client_id:p.clientId,client_secret:p.clientSecret,grant_type:'client_credentials',audience:root}),signal:AbortSignal.timeout(15000),redirect:'error'});
    if(!auth.ok) throw new InputError(`Deliverect authentication returned HTTP ${auth.status}`,502);
    const token:any=await auth.json();
    if(typeof token.access_token!=='string') throw new InputError('Deliverect returned no access token',502);
    const response=await fetch(`${root}/allChannels`,{headers:{authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(15000),redirect:'error'});
    if(!response.ok) throw new InputError(`Channel sync returned HTTP ${response.status}; verify API scope`,502);
    const data:any=await response.json();
    if(!Array.isArray(data)||data.length>1000||data.some(c=>!c||!['number','string'].includes(typeof c.channelId)||typeof c.name!=='string'||c.name.length>180)) throw new InputError('Unexpected channel directory response',502);
    await repo.transact(p.tenantId,s=>{s.channels=data.map(c=>({channelId:c.channelId,name:c.name}));s.channelsSyncedAt=new Date().toISOString();});
    res.json({count:data.length});
  }));
  app.use('/api',(_req,res)=>res.status(404).json({error:'Unknown API endpoint'}));
  app.use(express.static(resolve('dist')));
  app.get('*',(_req,res)=>res.sendFile(resolve('dist/index.html')));
  app.use((err:any,_req:any,res:any,_next:any)=>{
    const status=err instanceof InputError?err.status:err.type==='entity.too.large'?413:500;
    // Do not echo payloads, credentials or upstream response bodies.
    res.status(status).json({error:status===500?'Service unavailable; retry later':err.message});
  });
  return app;
}
