(async()=>{
const assert=require('node:assert/strict');const {Quorum:Q}=await import('./lib/quorum-model.js');
const create=(total=400)=>Q.create({title:'Trip',recipient:'Merchant',total,names:['A','B','C','D'],deadline:2000},1000);
let p=create();Q.pay(p,0,1100);assert.equal(Q.balances(p).held,10000);assert.throws(()=>Q.pay(p,0,1200));for(let i=1;i<4;i++)Q.pay(p,i,1200);assert.equal(p.status,'released');assert.equal(Q.balances(p).released,40000);assert.equal(Q.balances(p).held,0);assert.equal(p.events.filter(x=>x.type==='released').length,1);assert.throws(()=>Q.pay(p,1,1300));assert.equal(Q.expire(p,3000),false);
p=create();for(let i=0;i<3;i++)Q.pay(p,i,1100);assert.equal(Q.expire(p,1999),false);assert.equal(Q.expire(p,2000),true);assert.equal(Q.balances(p).held,30000);assert.equal(p.members.filter(x=>x.refund==='pending').length,3);assert.throws(()=>Q.pay(p,3,2100));Q.settle(p,2200);Q.settle(p,2300);assert.equal(Q.balances(p).refunded,30000);assert.equal(Q.balances(p).held,0);assert.equal(Q.balances(p).released,0);assert.equal(p.events.filter(x=>x.type==='refunded').length,3);
p=create(400.01);assert.equal(p.members.reduce((s,m)=>s+m.share,0),40001);p=create();assert.throws(()=>Q.pay(p,0,2000));assert.equal(Q.balances(p).held,0);assert.equal(p.status,'expired');assert.throws(()=>create(-1));
console.log('PASS: collection, exact-cent splits, single release, deadline boundary, pending/completed refunds, duplicate prevention, closed-pool rejection.');

})().catch(e=>{console.error(e);process.exit(1)});
