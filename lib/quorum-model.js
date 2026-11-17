export const Quorum = (()=>{
'use strict';
const money=n=>Math.round(n*100);
function create({title,recipient,total,names,deadline},now=Date.now()){
 if(!title?.trim()||!recipient?.trim())throw Error('Enter a name and recipient.');
 const cents=money(Number(total));
 if(!Number.isFinite(cents)||cents<100||cents>100000000)throw Error('Total must be between $1 and $1,000,000.');
 if(!Array.isArray(names)||names.length<2||names.length>10||names.some(n=>!n.trim()))throw Error('Add 2–10 participant names.');
 if(new Set(names.map(n=>n.trim().toLowerCase())).size!==names.length)throw Error('Use a different name for each participant.');
 if(!Number.isFinite(deadline)||deadline<=now)throw Error('Choose a future deadline.');
 return {id:'Q-'+Math.random().toString(36).slice(2,8).toUpperCase(),title:title.trim(),recipient:recipient.trim(),total:cents,deadline,created:now,status:'collecting',members:names.map((n,i)=>({name:n.trim(),share:Math.floor(cents/names.length)+(i<cents%names.length?1:0),paid:false,refund:'none'})),events:[{type:'created',amount:0,at:now,text:'Pool created. Terms set for everyone.'}]};
}
function event(p,type,amount,text,now){p.events.push({type,amount,text,at:now});}
function expire(p,now){if(p.status!=='collecting'||now<p.deadline)return false;p.status='expired';p.members.filter(m=>m.paid).forEach(m=>{m.refund='pending';event(p,'refund_pending',m.share,'Refund initiated for '+m.name,now)});event(p,'expired',0,'Deadline passed. Recipient receives nothing.',now);return true;}
function pay(p,index,now=Date.now()){
 expire(p,now);
 if(p.status!=='collecting')throw Error('This pool is closed.');
 const m=p.members[index];if(!m)throw Error('Choose a participant.');if(m.paid)throw Error('This participant has already contributed.');
 m.paid=true;event(p,'collected',m.share,m.name+' contributed. Funds held by simulated partner.',now);
 if(p.members.every(x=>x.paid)){p.status='released';event(p,'released',p.total,'Full amount released to '+p.recipient+' (simulated).',now)}
}
function settle(p,now=Date.now()) {if(p.status!=='expired')throw Error('Only expired pools can have refunds.');p.members.filter(m=>m.refund==='pending').forEach(m=>{m.refund='completed';event(p,'refunded',m.share,'Refund completed for '+m.name+' (simulated).',now)});}
function balances(p){const collected=p.members.reduce((s,m)=>s+(m.paid?m.share:0),0),refunded=p.members.reduce((s,m)=>s+(m.refund==='completed'?m.share:0),0),released=p.status==='released'?p.total:0;return{collected,refunded,released,held:collected-refunded-released};}
return {create,pay,expire,settle,balances};
})();
