import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {emptyState, type Profile} from '../server/model.ts';
import {register,ingest,receive,sweep,validSignature} from '../server/domain.ts';
import {FileRepository} from '../server/storage.ts';
import {createApp} from '../server/app.ts';
import {channelIdentity} from '../shared/channels.ts';
const profile:Profile={id:'screen-test',tenantId:'tenant',accountId:'account',provider:'screen',adminToken:'a'.repeat(32),webhookSecret:'w'.repeat(32),reportingSecret:'r'.repeat(32),environment:'staging'};
const now='2026-11-05T10:00:00.000Z';
const registration={status:'register',channelLinkId:'registrar-link',locationId:'location',channelLocationId:'provider-store'};
function setup(){const s=emptyState();register(s,profile,registration,now);register(s,profile,{...registration,status:'active'},now);return s;}
const order={_id:'order',account:'account',location:'location',channel:2,channelLink:'deliveroo-link',status:20,_updated:now};
test('registration creates destination without manual assignment, disable retains ownership',()=>{
 const s=setup();assert.equal(s.mappings.length,1);assert.equal(s.mappings[0].externalLocationId,'provider-store');
 register(s,profile,{...registration,status:'inactive'},now);register(s,profile,registration,now);assert.equal(s.mappings[0].state,'inactive');
 assert.throws(()=>register(s,profile,{...registration,locationId:'other'},now),/cannot move/);
});
test('order idempotency, actual source channel and auto-acceptance',()=>{
 const s=setup();ingest(s,profile,'orders',order,now);ingest(s,profile,'orders',order,now);
 assert.equal(s.orders.length,1);assert.equal(s.alerts.length,1);assert.equal(s.orders[0].phase,'waiting');assert.equal(s.orders[0].sourceChannelLinkId,'deliveroo-link');
});
test('picking cancels alerts and reminders; older and later acceptance cannot regress state',()=>{
 const s=setup();ingest(s,profile,'orders',order,now);
 ingest(s,profile,'picking',{orderId:'order',status:'PICKING_STARTED',timeStamp:'2026-11-05T10:01:00Z'},'2026-11-05T10:01:00Z');
 ingest(s,profile,'status',{orderId:'order',status:20,timeStamp:now},'2026-11-05T10:02:00Z');
 ingest(s,profile,'status',{orderId:'order',status:20,timeStamp:'2026-11-05T10:03:00Z'},'2026-11-05T10:03:00Z');
 sweep(s,'2026-11-05T10:06:00Z');assert.equal(s.orders[0].phase,'picking');assert.equal(s.alerts.length,1);assert.equal(s.alerts[0].status,'suppressed');
});
test('cancel-before-order is retried, unknown accounts/locations rejected',()=>{
 const s=setup();assert.throws(()=>ingest(s,profile,'status',{orderId:'order',location:'location',status:110},now),/not received/);
 assert.throws(()=>ingest(s,profile,'orders',{...order,account:'other'},now),/mismatch/);
 assert.throws(()=>ingest(s,profile,'orders',{...order,location:'other'},now),/not registered/);
});
test('scheduled orders wait for release; ready is not completed; unknown status diagnosed',()=>{
 const s=setup();ingest(s,profile,'orders',{...order,status:25},now);assert.equal(s.alerts.length,0);
 ingest(s,profile,'status',{orderId:'order',status:20,timeStamp:'2026-11-05T10:01:00Z'},'2026-11-05T10:01:00Z');assert.equal(s.alerts.length,1);
 ingest(s,profile,'status',{orderId:'order',status:70,timeStamp:'2026-11-05T10:02:00Z'},'2026-11-05T10:02:00Z');assert.equal(s.orders[0].phase,'ready');
 const result=ingest(s,profile,'picking',{orderId:'order',status:'UNRECOGNIZED'},'2026-11-05T10:03:00Z');assert.equal(result.result,'unmapped_status');assert.equal(s.orders[0].phase,'ready');
});
test('VoCoVo is blocked honestly, summary coalesces and excludes cancellations',()=>{
 const s=setup();register(s,{...profile,id:'vocovo-test',provider:'vocovo'},registration,now);register(s,{...profile,id:'vocovo-test',provider:'vocovo'},{...registration,status:'active'},now);
 ingest(s,profile,'orders',order,now);ingest(s,profile,'orders',{...order,_id:'order2'},now);
 assert(s.alerts.some(a=>a.status==='blocked'));
 sweep(s,'2026-11-05T10:05:00Z');sweep(s,'2026-11-05T10:05:00Z');assert.equal(s.alerts.filter(a=>a.orderId==='summary').length,2);
 ingest(s,profile,'status',{orderId:'order',status:110},'2026-11-05T10:06:00Z');assert(s.alerts.filter(a=>a.orderId==='summary').every(a=>a.status==='suppressed'));
});
test('raw body signature and channel directory resolution',()=>{
 const raw=Buffer.from('{ "status": 20 }');const signature=createHmac('sha256',profile.webhookSecret).update(raw).digest('hex');
 assert(validSignature(raw,signature,profile.webhookSecret));assert(!validSignature(Buffer.from('{"status":20}'),signature,profile.webhookSecret));
 assert.equal(channelIdentity(2,[{channelId:2,name:'DELIVEROO'}]).name,'Deliveroo');assert.equal(channelIdentity(55,[]).icon,null);
});
test('HTTP authentication, durable restart, tenant isolation and callback contract',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'alerts-test-'));const repo=new FileRepository(dir);
 const other={...profile,id:'other',tenantId:'other',accountId:'other',adminToken:'b'.repeat(32)};
 const server=createApp(repo,[profile,other],'https://alerts.example','s'.repeat(32)).listen(0);
 await new Promise<void>(resolve=>server.once('listening',resolve));const port=(server.address() as any).port;const root=`http://127.0.0.1:${port}`;
 async function send(kind:string,body:any,secret=profile.webhookSecret){const raw=JSON.stringify(body);return fetch(`${root}/webhooks/deliverect/${profile.id}/${kind}`,{method:'POST',headers:{'content-type':'application/json','x-server-authorization-hmac-sha256':createHmac('sha256',secret).update(raw).digest('hex')},body:raw});}
 try {
   assert.equal((await fetch(`${root}/api/console`)).status,401);
   assert.equal((await send('registration',registration,'bad')).status,401);
   const r=await send('registration',registration);assert.equal(r.status,200);const b:any=await r.json();assert(b.statusUpdateURL.endsWith('/channel-status'));assert(!b.menuUpdateURL);
   await send('registration',{...registration,status:'active'});
   assert.equal((await send('orders',order,profile.reportingSecret)).status,200);
   assert.equal((await new FileRepository(dir).transact('tenant',s=>s.orders.length)),1);
   const isolated:any=await (await fetch(`${root}/api/console`,{headers:{authorization:`Bearer ${other.adminToken}`}})).json();assert.equal(isolated.state.orders.length,0);
   assert.equal((await fetch(`${root}/internal/sweep`,{method:'POST'})).status,401);
 } finally {await new Promise<void>(r=>server.close(()=>r()));await rm(dir,{recursive:true,force:true});}
});

test('status arriving before its order is durable and replayed without an upstream retry',()=>{
 const s=setup();
 assert.equal(receive(s,profile,'picking',{orderId:'order',status:'PICKING_STARTED',timeStamp:'2026-11-05T10:01:00Z'},'2026-11-05T10:01:00Z',[profile]).result,'awaiting_order');
 const restarted=JSON.parse(JSON.stringify(s));
 receive(restarted,profile,'orders',order,'2026-11-05T10:02:00Z',[profile]);
 assert.equal(restarted.orders[0].phase,'picking');assert.equal(restarted.pendingEvents.length,0);
 assert(restarted.alerts.every((a:any)=>a.status==='suppressed'));
});
test('ready state cannot regress to picking with a later duplicate source event',()=>{
 const s=setup();receive(s,profile,'orders',order,now,[profile]);
 receive(s,profile,'picking',{orderId:'order',status:'PICKING_COMPLETE'},'2026-11-05T10:01:00Z',[profile]);
 receive(s,profile,'picking',{orderId:'order',status:'PICKING_STARTED'},'2026-11-05T10:02:00Z',[profile]);
 assert.equal(s.orders[0].phase,'ready');
});

test('unrecognised status keys cannot resolve object prototype properties',()=>{
 const s=setup();assert.throws(()=>register(s,profile,{...registration,status:'__proto__'},now));
 receive(s,profile,'orders',{...order,status:'toString'},now,[profile]);assert.equal(s.orders[0].phase,'unknown');
});

test('profile loading validates IDs, secrets length, and default pilot profiles',async()=>{
 const {loadProfiles,DEFAULT_PILOT_PROFILES}=await import('../server/config.ts');
 const loaded=loadProfiles();
 assert(loaded.length>=2);
 assert(loaded.some(p=>p.provider==='screen'));
 assert(loaded.some(p=>p.provider==='vocovo'));
 assert(DEFAULT_PILOT_PROFILES.every(p=>p.adminToken.length>=24));
});
