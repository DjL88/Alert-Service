import test from 'node:test';
import assert from 'node:assert/strict';
import {authenticate,visibleState} from '../server/access.ts';
import {emptyState} from '../server/model.ts';
const profile:any={id:'p',tenantId:'tenant-a',adminToken:'a'.repeat(32)};
test('tenant admin auth and invalid token',()=>{
 assert.deepEqual(authenticate('Bearer '+'a'.repeat(32),[profile]),{role:'tenantadmin',tenantId:'tenant-a'});
 assert.equal(authenticate('Bearer bad',[profile]),null);
});
test('store principal sees only assigned location',()=>{
 process.env.STORE_ACCESS_JSON=JSON.stringify([{token:'b'.repeat(32),tenantId:'tenant-a',locationId:'store-1'}]);
 const principal=authenticate('Bearer '+'b'.repeat(32),[profile])!;
 assert.equal(principal.role,'store');
 const state:any={...emptyState(),orders:[{id:'1',locationId:'store-1'},{id:'2',locationId:'store-2'}],alerts:[{id:'a',locationId:'store-2'}],mappings:[{locationId:'store-1'},{locationId:'store-2'}],events:[{locationId:'store-2'}],rules:[{id:'r'}]};
 const scoped=visibleState(state,principal);
 assert.equal(scoped.orders.length,1);assert.equal(scoped.mappings.length,1);assert.equal(scoped.alerts.length,0);assert.equal(scoped.events.length,0);assert.deepEqual(scoped.rules,[]);
 delete process.env.STORE_ACCESS_JSON;
});
