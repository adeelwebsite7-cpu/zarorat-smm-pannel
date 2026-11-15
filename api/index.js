// Zarorat - Vercel API (Self-contained, server.js ki zaroorat nahi)
let DB = { users:[], services:[], orders:[], deposits:[], tickets:[], notifications:[], coupons:[], announcements:[], categories:[], activity:[], settings:{panelName:"ZARORAT",minDeposit:50,referralBonus:5,supportMessage:"Ask the support team anything. Replies appear inside your ticket."}, favorites:[], transactions:[] };
let clients = [];
let lastUpdate = Date.now();
function sendAll(){
  let msg = `data: ${JSON.stringify(DB)}\n\n`;
  clients = clients.filter(c => { try{ c.res.write(msg); return true; }catch(e){ return false; } });
}
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){ res.statusCode=200; res.end(); return; }
  let u = new URL(req.url || '/', 'http://localhost');
  let p = u.pathname;
  // /api/events - live stream
  if(p==='/api/events' || p==='/api/index'){
    // agar /api/index ko browser ne khola (page samajh ke) to DB bhejo, Not found mat bhejo
    if(p==='/api/index' && req.method==='GET' && !u.searchParams.get('t')){
      // Vercel isko function samjhega, is liye yahan sirf health bhejte hain
    }
  }
  if(p==='/api/events'){
    res.writeHead(200, {'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
    res.write(`data: ${JSON.stringify(DB)}\n\n`);
    clients.push({res});
    req.on('close', ()=>{ clients = clients.filter(c=>c.res!==res); });
    return;
  }
  if(p==='/api/db' || p==='/api/index'){
    if(req.method==='GET'){ res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store'); res.end(JSON.stringify(DB)); return; }
    if(req.method==='POST' || req.method==='PUT'){
      let body='';
      req.on('data', c=>body+=c);
      req.on('end', ()=>{
        try{
          let d = JSON.parse(body||'{}');
          if(d && typeof d==='object' && (d.users!==undefined || d.services!==undefined)){
            DB = d; lastUpdate = Date.now();
            res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({ok:true, updatedAt:lastUpdate}));
            sendAll(); return;
          }
          res.statusCode=400; res.end(JSON.stringify({ok:false}));
        }catch(e){ res.statusCode=400; res.end(JSON.stringify({ok:false})); }
      });
      return;
    }
  }
  if(p==='/api/health'){ res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({ok:true, server:'Zarorat Vercel API', clients: clients.length, updatedAt:lastUpdate})); return; }
  // Koi bhi aur /api rasta ho to bhi Not found mat bhejo, DB bhej do taake frontend na toote
  if(p.startsWith('/api')){ res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(DB)); return; }
  res.statusCode=404; res.end('Not found');
};
