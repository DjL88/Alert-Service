import test from 'node:test';
import assert from 'node:assert/strict';
import {register,InputError} from '../server/domain.ts';
import {emptyState} from '../server/model.ts';
import type {Profile} from '../server/model.ts';

const profile:Profile={id:'screen',tenantId:'tenant-a',accountId:'account-a',provider:'screen',
 adminToken:'a'.repeat(32),webhookSecret:'b'.repeat(32),reportingSecret:'c'.repeat(32),environment:'staging'};
const now='2026-11-06T10:00:00.000Z';
const payload=(link:string,external:string,location='store-1')=>({
 account:'account-a',channelLinkId:link,channelLocationId:external,locationId:location,status:'active'
});

test('multiple channel links map to one store without duplicate registration rejection',()=>{
 const state=emptyState();
 register(state,profile,payload('link-1','external-1'),now);
 register(state,profile,payload('link-2','external-2'),now);
 assert.equal(state.mappings.length,2);
 assert.deepEqual(new Set(state.mappings.map(m=>m.locationId)),new Set(['store-1']));
 register(state,profile,payload('link-1','external-1'),now);
 assert.equal(state.mappings.length,2,'re-registration is idempotent');
});

test('external destination cannot be reused by another channel link',()=>{
 const state=emptyState();
 register(state,profile,payload('link-1','external-1'),now);
 assert.throws(()=>register(state,profile,payload('link-2','external-1'),now),
  (error:unknown)=>error instanceof InputError && error.status===409);
});

test('channel link cannot silently move to another store',()=>{
 const state=emptyState();
 register(state,profile,payload('link-1','external-1'),now);
 assert.throws(()=>register(state,profile,payload('link-1','external-1','store-2'),now),
  (error:unknown)=>error instanceof InputError && error.status===409);
});
