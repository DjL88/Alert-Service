import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type {Alert, Profile, State, OrderPhase} from './model.ts';
import { channelIdentity } from '../shared/channels.ts';
export class InputError extends Error {
  public status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
export const hash = (v: string) => createHash('sha256').update(v).digest('hex');
export function sameSecret(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
export function validSignature(raw: Buffer, signature: string, secret: string) {
  return /^[a-f0-9]{64}$/i.test(signature) && sameSecret(createHmac('sha256', secret).update(raw).digest('hex'), signature.toLowerCase());
}
function field(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 180) throw new InputError(`Missing or invalid ${name}`);
  return value.trim();
}
function timestamp(value: unknown, fallback: string) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new InputError('Invalid event timestamp');
  const result = new Date(value).toISOString();
  if (Date.parse(result) > Date.parse(fallback) + 300_000) throw new InputError('Event timestamp is in the future');
  return result;
}
export function trimState(s: State) {
  s.events = s.events.slice(-250); s.alerts = s.alerts.slice(-200);
  // Preserve active orders and terminal tombstones. Never silently evict dedupe state.
  if (s.orders.length > 500) throw new InputError('Pilot order capacity reached; archive required', 503);
}
export function register(s: State, p: Profile, body: any, now: string) {
  if (body.account && body.account !== p.accountId) throw new InputError('Account mismatch', 403);
  const link = field(body.channelLinkId, 'channelLinkId');
  const location = field(body.locationId, 'locationId');
  const states: Record<string, 'registered' | 'active' | 'inactive'> = {register:'registered', active:'active', inactive:'inactive'};
  const state = Object.hasOwn(states, String(body.status)) ? states[String(body.status)] : undefined;
  if (!state) throw new InputError('Expected register, active or inactive');
  const existing = s.mappings.find(m => m.profileId === p.id && m.channelLinkId === link);
  if (existing && existing.locationId !== location) throw new InputError('Registration cannot move an existing connection to another store', 409);
  const external = body.channelLocationId === undefined && existing ? existing.externalLocationId : field(body.channelLocationId, 'channelLocationId');
  if (s.mappings.some(m => m.id !== existing?.id && m.profileId === p.id && (m.locationId === location || m.externalLocationId === external))) throw new InputError('Duplicate store/destination mapping', 409);
  const mapping = {id: hash(`${p.id}:${link}`), profileId:p.id, channelLinkId:link, locationId:location,
    externalLocationId:external, name: typeof body.channelLinkName === 'string' ? body.channelLinkName.slice(0,180) : location,
    // Re-registration refreshes metadata without re-enabling a disabled link.
    state: state === 'registered' && existing ? existing.state : state, provider:p.provider, updatedAt:now};
  if (existing) Object.assign(existing, mapping); else s.mappings.push(mapping);
  if (mapping.state !== 'active') for (const a of s.alerts.filter(a => a.mappingId === mapping.id)) {a.status='suppressed'; a.reason='Registration not active';}
  s.events.push({id:hash(`${p.id}:${link}:${now}`), kind:'registration', at:now, profileId:p.id, locationId:location, result:mapping.state});
  trimState(s);
  return mapping;
}
function phaseFor(p: Profile, body: any, kind: string): {phase:OrderPhase; raw:string} {
  const raw = String(kind === 'picking' ? body.pickingStatus ?? body.eventData?.status ?? body.status ?? '' : body.status ?? '');
  if (p.statusMap?.[`${kind}:${raw}`]) return {phase:p.statusMap[`${kind}:${raw}`],raw};
  // Only explicit picking evidence moves an accepted order out of waiting.
  const picking: Record<string,OrderPhase> = {PICKING_STARTED:'picking',PICKING:'picking',IN_PROGRESS:'picking',PICKING_COMPLETE:'ready',PICKED:'ready'};
  const generic: Record<string,OrderPhase> = {'1':'waiting','2':'waiting','3':'waiting','6':'waiting','7':'waiting','10':'waiting','20':'waiting','25':'scheduled','35':'cancelled','40':'waiting','60':'ready','70':'ready','90':'completed','100':'cancelled','110':'cancelled'};
  const statuses = kind === 'picking' ? picking : generic;
  return {phase:Object.hasOwn(statuses,raw) ? statuses[raw] : 'unknown',raw};
}
function addAlert(s: State, locationId: string, orderId: string, message: string, now: string, suffix: string) {
  for (const m of s.mappings.filter(m => m.locationId === locationId && m.state === 'active')) {
    const id = hash(`${m.id}:${orderId}:${suffix}`);
    if (s.alerts.some(a=>a.id===id)) continue;
    const a: Alert = {id, locationId,orderId,message,createdAt:now,expiresAt:new Date(Date.parse(now)+120_000).toISOString(),mappingId:m.id,provider:m.provider,
      status:m.provider === 'screen' ? 'screen_available' : 'blocked'};
    if (m.provider !== 'screen') a.reason='VoCoVo API contract and credentials required; no delivery attempted';
    s.alerts.push(a);
  }
}
export function ingest(s: State, p: Profile, kind: string, body: any, now: string) {
  if (body.account && body.account !== p.accountId) throw new InputError('Account mismatch',403);
  if (kind === 'orders' && body.account !== p.accountId) throw new InputError('Order account required',403);
  const orderId = field(body._id ?? body.orderId ?? body.eventData?.orderId, 'orderId');
  const known = s.orders.find(o=>o.id===orderId);
  const location = body.location ?? body.locationId ?? known?.locationId;
  field(location,'location');
  if (!s.mappings.some(m=>m.profileId===p.id && m.locationId===location)) throw new InputError('Store not registered for this integration',409);
  if (known && known.locationId !== location) throw new InputError('Order location mismatch',409);
  if (kind !== 'orders' && !known) throw new InputError('Order not received yet; retry after new-order feed',409);
  const at = timestamp(body.timeStamp ?? body._updated ?? body.eventData?.timeStamp, now);
  const {phase,raw} = phaseFor(p,body,kind);
  const eventId = hash(JSON.stringify([kind, orderId, location, raw, body.timeStamp ?? body._updated ?? body.eventData?.timeStamp ?? null]));
  if (s.events.some(e=>e.id===eventId)) return {result:'duplicate'};
  let result = 'processed';
  if (known && at < known.updatedAt) result='stale';
  else if (known && (['completed','cancelled'].includes(known.phase) || (kind === 'orders' && phase === 'waiting' && known.phase !== 'scheduled'))) result='no_transition';
  else if (known && (
    (['picking','ready'].includes(known.phase) && ['waiting','scheduled'].includes(phase)) ||
    (known.phase === 'ready' && phase === 'picking')
  )) result='no_transition';
  else {
    const order = known || {id:orderId,locationId:location, channelId:String(body.channel ?? 'unknown'),sourceChannelLinkId:String(body.channelLink ?? ''),
      displayId:String(body.channelOrderDisplayId ?? orderId).slice(0,80),receivedAt:now,reminders:0,phase,sourceStatus:raw,updatedAt:at};
    const previousPhase = known?.phase;
    order.sourceStatus=raw;
    if (phase !== 'unknown' || !known) {order.phase=phase; order.updatedAt=at;}
    if (!known) s.orders.push(order);
    if (phase==='unknown') result='unmapped_status';
    if (phase === 'waiting' && (!known || previousPhase === 'scheduled')) addAlert(s,location,orderId,`New ${channelIdentity(order.channelId,s.channels).name} order`,now,'new');
    if (phase !== 'waiting' && phase !== 'unknown') for (const alert of s.alerts.filter(a=>a.orderId===orderId)) {alert.status='suppressed';alert.reason='Order no longer waiting';}
  }
  for (const a of s.alerts.filter(a=>a.orderId==='summary' && a.locationId===location && a.status!=='suppressed')) { a.status='suppressed'; a.reason='Queue changed; recalculate at next reminder'; }
  s.events.push({id:eventId,kind,at:now,profileId:p.id,orderId,locationId:location,sourceStatus:raw,result});
  s.lastFeedAt=now;
  trimState(s); return {result};
}
/** Keep early status callbacks durable: provider retries need not be assumed. */
export function receive(s: State, p: Profile, kind: string, body: any, now: string, profiles: Profile[]) {
  if (body.account && body.account !== p.accountId) throw new InputError('Account mismatch',403);
  const orderId=field(body._id ?? body.orderId ?? body.eventData?.orderId,'orderId');
  const at=timestamp(body.timeStamp ?? body._updated ?? body.eventData?.timeStamp,now);
  s.pendingEvents ||= [];
  if(kind!=='orders' && !s.orders.some(o=>o.id===orderId)) {
    if(s.pendingEvents.length>=100) throw new InputError('Pending event capacity reached',503);
    const raw=String(body.pickingStatus ?? body.eventData?.status ?? body.status ?? '');
    const id=hash(JSON.stringify([p.id,kind,orderId,raw,body.timeStamp ?? body._updated ?? null]));
    if(s.pendingEvents.some(e=>e.id===id)) return {result:'duplicate'};
    const minimal:Record<string,string|number>={orderId,status:raw,timeStamp:at};
    if(body.location || body.locationId) minimal.location=field(body.location ?? body.locationId,'location');
    s.pendingEvents.push({id,profileId:p.id,kind,receivedAt:now,body:minimal});
    s.events.push({id,kind,at:now,profileId:p.id,orderId,result:'awaiting_order'});
    trimState(s);return {result:'awaiting_order'};
  }
  const result=ingest(s,p,kind,body,now);
  if(kind==='orders') {
    const matches=s.pendingEvents.filter(e=>e.body.orderId===orderId).sort((a,b)=>String(a.body.timeStamp).localeCompare(String(b.body.timeStamp)));
    for(const event of matches) {
      const owner=profiles.find(candidate=>candidate.id===event.profileId && candidate.tenantId===p.tenantId);
      if(!owner) continue;
      // Validated mismatches stay visible for investigation, never cross-map stores.
      try {ingest(s,owner,event.kind,event.body,now);s.pendingEvents=s.pendingEvents.filter(e=>e.id!==event.id);}
      catch(e) {if(!(e instanceof InputError))throw e;}
    }
  }
  return result;
}
export function sweep(s: State, now: string) {
  for (const order of s.orders.filter(o=>o.phase==='waiting' && o.reminders<3)) {
    const since = order.lastReminderAt || order.receivedAt;
    if (Date.parse(now)-Date.parse(since)<300_000) continue;
    if (!s.mappings.some(m=>m.locationId===order.locationId && m.state==='active')) continue;
    const count=s.orders.filter(o=>o.locationId===order.locationId && o.phase==='waiting').length;
    // One summary per store per five-minute window, even with many waiting orders.
    const window=String(Math.floor(Date.parse(now)/300_000));
    addAlert(s,order.locationId,'summary',`${count} order${count===1?'':'s'} waiting to be picked`,now,window);
    order.lastReminderAt=now; order.reminders++;
  }
  for (const a of s.alerts) if (a.expiresAt<now && a.status==='screen_available') {a.status='suppressed';a.reason='Announcement expired';}
  s.lastSweepAt=now; trimState(s);
}
