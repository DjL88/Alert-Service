import {createHash,timingSafeEqual} from 'node:crypto';
import type {Profile,State} from './model.ts';
export type Principal={role:'superadmin'|'tenantadmin'|'store';tenantId:string;locationId?:string};
const digest=(s:string)=>createHash('sha256').update(s).digest();
const eq=(a:string,b:string)=>timingSafeEqual(digest(a),digest(b));
export function authenticate(header:string,profiles:Profile[]):Principal|null {
 if(!header.startsWith('Bearer '))return null;
 const token=header.slice(7);
 if(token.length<24)return null;
 const superToken=process.env.SUPERADMIN_TOKEN;
 if(superToken&&superToken.length>=32&&eq(token,superToken))return {role:'superadmin',tenantId:''};
 for(const p of profiles)if(eq(token,p.adminToken))return {role:'tenantadmin',tenantId:p.tenantId};
 let entries:any[]=[];
 try{entries=JSON.parse(process.env.STORE_ACCESS_JSON||'[]');}catch{return null;}
 if(!Array.isArray(entries))return null;
 for(const entry of entries)if(typeof entry?.token==='string'&&entry.token.length>=24&&eq(token,entry.token)){
  if(typeof entry.tenantId!=='string'||typeof entry.locationId!=='string'||!profiles.some(p=>p.tenantId===entry.tenantId))return null;
  return {role:'store',tenantId:entry.tenantId,locationId:entry.locationId};
 }
 return null;
}
export function visibleState(state:State,principal:Principal):State {
 if(principal.role!=='store')return state;
 const location=principal.locationId;
 return {...state,orders:state.orders.filter(o=>o.locationId===location),mappings:state.mappings.filter(m=>m.locationId===location),
 alerts:state.alerts.filter(a=>a.locationId===location),events:state.events.filter(e=>e.locationId===location),
 pendingEvents:[],rules:[],channels:state.channels};
}
