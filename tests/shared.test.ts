import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handle} from '../lib/quorum-service';
const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('drizzle/0000_sturdy_the_stranger.sql','utf8'));
const db:any={
 prepare(sql:string){
  return {bind(...args:any[]){
   return {
    async first(){await Promise.resolve();return sqlite.prepare(sql).get(...args)},
    async run(){await Promise.resolve();const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}
   };
  }};
 }
};
const token='a'.repeat(64),other='b'.repeat(64);let serial=0;
async function call(command?:any,t=token){const r=await handle(new Request('https://quorum.test/api/room',{method:command?'POST':'GET',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:command?JSON.stringify({operationId:'operation-00000000-'+(++serial),...command}):undefined}),db);return{status:r.status,body:await r.json() as any}}
assert.equal((await call()).status,404);const initial=await call({action:'init'});assert.equal(initial.status,200);let p=initial.body.pools[0];assert.deepEqual(p.members.map((m:any)=>m.name),['Ethan','Nico','Cody','Colin','Zenon']);assert.equal(p.total,50000);
assert.equal((await call(undefined,other)).status,404);assert.equal((await handle(new Request('https://quorum.test/api/room'),db)).status,401);
let command={action:'pay',poolId:p.id,generation:p.generation,accepted:true};const concurrent=await Promise.all([0,1,2,3,4].map(member=>call({...command,member})));assert.ok(concurrent.every(x=>x.status===200));p=(await call()).body.pools[0];assert.equal(p.status,'released');assert.equal(p.events.filter((e:any)=>e.type==='released').length,1);assert.equal(p.members.filter((m:any)=>m.paid).length,5);assert.equal((await call({...command,member:0})).status,409);
await call({action:'restart',poolId:p.id,generation:p.generation});let fresh=(await call()).body.pools[0];assert.notEqual(fresh.generation,p.generation);assert.equal((await call({...command,member:0})).status,409);
command={...command,generation:fresh.generation};const dup=await Promise.all([call({...command,member:0}),call({...command,member:0})]);assert.equal(dup.filter(r=>r.status===200).length,1);
const idem={...command,member:1,operationId:'idempotent-operation-000000000'};await call(idem);await call(idem);fresh=(await call()).body.pools[0];assert.equal(fresh.events.filter((e:any)=>e.type==='collected').length,2);
await call({action:'expire',poolId:fresh.id,generation:fresh.generation});fresh=(await call()).body.pools[0];assert.equal(fresh.status,'expired');assert.equal(fresh.members.filter((m:any)=>m.refund==='pending').length,2);await call({action:'settle',poolId:fresh.id,generation:fresh.generation});fresh=(await call()).body.pools[0];assert.equal(fresh.members.filter((m:any)=>m.refund==='completed').length,2);
console.log('PASS: five-member seed, room authorization/isolation, five simultaneous contributions, no lost updates, single release, duplicate prevention, retry idempotency, stale reset rejection, and shared refund state.');
