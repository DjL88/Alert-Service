import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState} from '../server/model.ts';
import {register,receive} from '../server/domain.ts';
const now='2026-11-06T11:00:00.000Z';
const profile=(id:string,provider:'screen'|'vocovo'='screen'):any=>({id,tenantId:'tenant-a',accountId:'account-a',provider});
function connect(state:ReturnType<typeof emptyState>,p:any,link:string) {
 return register(state,p,{account:'account-a',channelLinkId:link,locationId:'store-1',channelLocationId:'external-'+link,status:'active'},now);
}
test('multiple screen profiles create one KDS alert per order',()=>{
 const s=emptyState();const a=profile('screen-a');const b=profile('screen-b');
 connect(s,a,'link-a');connect(s,b,'link-b');
 const order={account:'account-a',_id:'order-1',location:'store-1',status:'1',channel:'42'};
 receive(s,a,'orders',order,now,[a,b]);
 assert.equal(s.orders.length,1);
 assert.equal(s.alerts.filter(x=>x.provider==='screen').length,1);
 receive(s,b,'orders',order,now,[a,b]);
 assert.equal(s.orders.length,1);
 assert.equal(s.alerts.filter(x=>x.provider==='screen').length,1);
});
test('external destination remains blocked separately, never dispatched',()=>{
 const s=emptyState();const screen=profile('screen');const voice=profile('voice','vocovo');
 connect(s,screen,'screen-link');connect(s,voice,'voice-link');
 receive(s,screen,'orders',{account:'account-a',_id:'order-2',location:'store-1',status:'1'},now,[screen,voice]);
 assert.equal(s.alerts.filter(x=>x.provider==='screen').length,1);
 assert.equal(s.alerts.filter(x=>x.provider==='vocovo'&&x.status==='blocked').length,1);
});
