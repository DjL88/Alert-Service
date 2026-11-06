import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState} from '../server/model.ts';
import {register,ingest} from '../server/domain.ts';
const now='2026-11-06T12:00:00.000Z';
const p=(id:string,provider:'screen'|'vocovo'='screen'):any=>({id,tenantId:'tenant-a',accountId:'account-a',provider});
test('two registrations create one location and one KDS alert',()=>{
 const s=emptyState();
 register(s,p('screen'),{account:'account-a',channelLinkId:'link-1',locationId:'loc-1',channelLocationId:'ext-1',status:'active'},now);
 register(s,p('vocovo','vocovo'),{account:'account-a',channelLinkId:'link-2',locationId:'loc-1',channelLocationId:'ext-2',status:'active'},now);
 assert.equal(s.locations?.length,1);assert.equal(s.mappings.length,2);assert.equal(s.accountId,'account-a');
 ingest(s,p('screen'),'orders',{account:'account-a',_id:'order-1',location:'loc-1',status:'1',channel:'42'},now);
 assert.equal(s.orders.length,1);assert.equal(s.alerts.length,1);
 assert.equal(s.alerts[0].provider,'screen');
 ingest(s,p('vocovo','vocovo'),'orders',{account:'account-a',_id:'order-1',location:'loc-1',status:'1',channel:'42'},now);
 assert.equal(s.orders.length,1);assert.equal(s.alerts.length,1);
});
test('registration rejects cross-account tenant ownership',()=>{
 const s=emptyState();register(s,p('a'),{channelLinkId:'l1',locationId:'loc',channelLocationId:'ext',status:'active'},now);
 assert.throws(()=>register(s,{...p('b'),accountId:'account-b'},{channelLinkId:'l2',locationId:'loc',channelLocationId:'ext2',status:'active'},now),/another Deliverect account/);
});
