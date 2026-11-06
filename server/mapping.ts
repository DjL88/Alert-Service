import type {MappingRule} from './model.ts';

export const fieldPaths:Record<string,string[]> = {
  orderID: ['_id','orderId','eventData.orderId'],
  orderDisplayID: ['channelOrderDisplayId','displayId','orderId'],
  channelName: ['channelName','channel.name','channel'],
  channelID: ['channel','channelId'],
  itemCount: ['items.length','order.items.length','itemsCount','itemCount'],
  storeID: ['location','locationId'],
  status: ['pickingStatus','eventData.status','status'],
  courierArrivedAtPickup: ['courierArrivedAtPickup','courier.arrivedAtPickup','delivery.courierArrivedAtPickup'],
  timestamp: ['timeStamp','_updated','eventData.timeStamp']
};
function path(obj:unknown,key:string):unknown {
  if (!/^[a-zA-Z][a-zA-Z0-9_.]{0,100}$/.test(key)) return undefined;
  let value:any=obj;
  for (const part of key.split('.')) {
    if (part==='__proto__'||part==='constructor'||part==='prototype') return undefined;
    if (part==='length'&&Array.isArray(value)) {value=value.length;continue;}
    if (!value||typeof value!=='object'||!Object.prototype.hasOwnProperty.call(value,part)) return undefined;
    value=value[part];
  }
  return value;
}
export function normalize(payload:unknown, overrides:Record<string,string>={}) {
  const output:Record<string,unknown>={};
  for (const [name,defaults] of Object.entries(fieldPaths)) {
    const candidates=overrides[name]?[overrides[name]]:defaults;
    output[name]=candidates.map(key=>path(payload,key)).find(v=>v!==undefined)??null;
  }
  return output;
}
export function render(template:string,fields:Record<string,unknown>) {
  if (template.length>12000) throw new Error('Template too large');
  const parsed=JSON.parse(template);
  function visit(value:unknown,depth=0):unknown {
    if(depth>12) throw new Error('Template too deeply nested');
    if(typeof value==='string') {
      const exact=/^{{([a-zA-Z][a-zA-Z0-9]*)}}$/.exec(value);
      if(exact) return Object.prototype.hasOwnProperty.call(fields,exact[1])?fields[exact[1]]:null;
      return value.replace(/{{([a-zA-Z][a-zA-Z0-9]*)}}/g,(_,name)=>{
        const item=fields[name];return item===null||item===undefined?'':String(item);
      });
    }
    if(Array.isArray(value)) return value.map(v=>visit(v,depth+1));
    if(value&&typeof value==='object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,visit(v,depth+1)]));
    return value;
  }
  return visit(parsed);
}
export function validateRule(input:any):MappingRule {
  if(!input||typeof input!=='object') throw new Error('Invalid rule');
  const name=String(input.name||'').trim(),channelName=String(input.channelName||'').trim(),event=String(input.event||'').trim();
  if(!name||name.length>100||channelName.length>120||event.length>80) throw new Error('Invalid rule name or filter');
  if(!['kds','vocovo','webhook'].includes(input.destination)) throw new Error('Invalid destination');
  const overrides=input.overrides||{};
  if(!overrides||typeof overrides!=='object'||Array.isArray(overrides)||Object.keys(overrides).length>30||Object.entries(overrides).some(([key,value])=>!Object.hasOwn(fieldPaths,key)||typeof value!=='string'||!/^[a-zA-Z][a-zA-Z0-9_.]{0,100}$/.test(value))) throw new Error('Invalid field mapping');
  const template=String(input.template||'');
  render(template,{});
  return {id:String(input.id||''),name,enabled:input.enabled===true,channelName,event,destination:input.destination,template,overrides,updatedAt:new Date().toISOString()};
}
export function matches(rule:MappingRule,fields:Record<string,unknown>,kind:string) {
  return rule.enabled&&(!rule.event||rule.event.toLowerCase()===kind.toLowerCase())&&(!rule.channelName||rule.channelName.toLowerCase()===String(fields.channelName??'').toLowerCase());
}
