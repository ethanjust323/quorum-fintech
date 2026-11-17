import { Quorum as Q } from './quorum-model.js';
const TEAM=['Ethan','Nico','Cody','Colin','Zenon'];
const headers={'content-type':'application/json','cache-control':'no-store','referrer-policy':'no-referrer'};
export function json(value:any,status=200){return new Response(JSON.stringify(value),{status,headers})}
function fault(message:string,status=400):never {throw Object.assign(new Error(message),{status})}
export async function roomId(request:Request){const token=request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];if(!token)fault('Open the invite link to access this shared room.',401);const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');}
function createPool(input:any,now:number){if(!input||typeof input.title!=='string'||input.title.length>70||typeof input.recipient!=='string'||input.recipient.length>90||!Array.isArray(input.names)||input.names.some((n:any)=>typeof n!=='string'||n.length>40))fault('Check the pool name, recipient, and participant names.');const p=Q.create(input,now);p.id='Q-'+crypto.randomUUID().slice(0,8).toUpperCase();p.generation=crypto.randomUUID();return p;}
function seed(now:number){return {schema:2,pools:[createPool({title:'The group getaway',recipient:'Pine Lodge · booking deposit',total:500,names:TEAM,deadline:now+2*86400000},now)],processed:[]};}
function age(state:any,now:number){let changed=false;for(const p of state.pools)if(Q.expire(p,now))changed=true;return changed;}
export async function handle(request:Request,db:D1Database){try{
 if(!db)return json({error:'Shared storage is unavailable. Please try again.'},503);
 if(request.method!=='GET'&&request.method!=='POST')return json({error:'Method not allowed'},405);
 const id=await roomId(request);let command:any=null;
 if(request.method==='POST'){
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)fault('Use this website to make changes.',403);
  if(Number(request.headers.get('content-length'))>16384)fault('Request is too large.',413);
  const body=await request.text();if(body.length>16384)fault('Request is too large.',413);try{command=JSON.parse(body)}catch{fault('Invalid request.')}
  if(!command||typeof command.operationId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(command.operationId))fault('Missing operation identifier.');
 }
 for(let attempt=0;attempt<8;attempt++){
  let row=await db.prepare('SELECT state, version FROM quorum_rooms WHERE id = ?').bind(id).first<any>();
  if(!row){if(command?.action!=='init')return json({error:'Shared room not found. Ask a teammate for the complete invite link.'},404);const now=Date.now();const seeded=seed(now);seeded.processed.push(command.operationId as never);await db.prepare('INSERT OR IGNORE INTO quorum_rooms (id,state,version,updated) VALUES (?,?,0,?)').bind(id,JSON.stringify(seeded),now).run();row=await db.prepare('SELECT state,version FROM quorum_rooms WHERE id = ?').bind(id).first<any>();if(!row)continue;}
  const state=JSON.parse(row.state),now=Date.now();let dirty=age(state,now),mutationError:any=null;
  if(command&&!state.processed.includes(command.operationId)){
   try{
    if(command.action==='init'){}
    else if(command.action==='create'){
     if(state.pools.length>=40)fault('This demo room has reached its 40-pool limit. Start a new room.');state.pools.unshift(createPool(command.input,now));
    }else{
     const p=state.pools.find((p:any)=>p.id===command.poolId);if(!p)fault('This pool no longer exists.',404);
     if(command.generation!==p.generation)fault('This scenario was restarted. Review the current agreement and try again.',409);
     if(command.action==='pay'){
      if(command.accepted!==true||!Number.isInteger(command.member)||command.member<0||command.member>=p.members.length)fault('Select a participant and accept the agreement.');Q.pay(p,command.member,now);
     }else if(command.action==='expire'){
      if(p.status!=='collecting')fault('This pool has already closed.',409);const simulatedNow=Math.max(now,p.deadline+1000);Q.expire(p,simulatedNow);p.events.push({type:'demo_clock',amount:0,at:simulatedNow,text:'Shared demo clock advanced past deadline. Real deadline was not edited.'});
     }else if(command.action==='settle')Q.settle(p,Math.max(now,p.deadline+2000));
     else if(command.action==='restart'){
      const next=createPool({title:p.title,recipient:p.recipient,total:p.total/100,names:p.members.map((m:any)=>m.name),deadline:now+2*86400000},now);next.id=p.id;state.pools[state.pools.findIndex((x:any)=>x.id===p.id)]=next;
     }else fault('Unknown action.');
    }
    state.processed.push(command.operationId);state.processed=state.processed.slice(-150);dirty=true;
   }catch(e){mutationError=e;}
  }
  if(dirty){const result=await db.prepare('UPDATE quorum_rooms SET state = ?, version = version + 1, updated = ? WHERE id = ? AND version = ?').bind(JSON.stringify(state),now,id,row.version).run();if(!result.meta.changes)continue;row.version++;}
  if(mutationError)return json({error:mutationError.message,state:{pools:state.pools,version:row.version}},mutationError.status||409);
  return json({pools:state.pools,version:row.version,serverTime:now});
 }
 return json({error:'Several people updated at once. Please try again.'},409);
}catch(e:any){return json({error:e.status?e.message:'The shared room could not be updated. Please try again.'},e.status||500)}}
