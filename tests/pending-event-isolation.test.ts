import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState} from '../server/model.ts';
import {register,receive} from '../server/domain.ts';
const now='2026-11-06T13:00:00.000Z';
const profile:any={id:'screen',tenantId:'tenant',accountId:'account',provider:'screen'};
function setup(){
 const state=emptyState();
 for(const location of ['store-a','store-b']) register(state,profile,{channelLinkId:'link-'+location,locationId:location,channelLocationId:'external-'+location,status:'active'},now);
 return state;
}
test('early callback cannot transition another store with matching order id',()=>{
 const s=setup();
 assert.equal(receive(s,profile,'picking',{orderId:'same-order',location:'store-b',pickingStatus:'PICKING_STARTED'},now,[profile]).result,'awaiting_order');
 receive(s,profile,'orders',{_id:'same-order',account:'account',location:'store-a',status:'1'},now,[profile]);
 assert.equal(s.orders[0].phase,'waiting');
 assert.equal(s.pendingEvents?.length,1);
});
test('early callback without location remains pending rather than guessing a store',()=>{
 const s=setup();
 receive(s,profile,'picking',{orderId:'order-2',pickingStatus:'PICKING_STARTED'},now,[profile]);
 receive(s,profile,'orders',{_id:'order-2',account:'account',location:'store-a',status:'1'},now,[profile]);
 assert.equal(s.orders[0].phase,'waiting');
 assert.equal(s.pendingEvents?.length,1);
});
test('matching scoped callback is replayed for the correct store',()=>{
 const s=setup();
 receive(s,profile,'picking',{orderId:'order-3',locationId:'store-a',pickingStatus:'PICKING_STARTED'},now,[profile]);
 receive(s,profile,'orders',{_id:'order-3',account:'account',location:'store-a',status:'1'},now,[profile]);
 assert.equal(s.orders[0].phase,'picking');
 assert.equal(s.pendingEvents?.length,0);
});
