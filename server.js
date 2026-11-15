// Zarorat SMM Panel - Full Heavy Server for Vercel
// Upload: index.html + admin.html + server.js + vercel.json + package.json ko Vercel me daalo
// Local run: node server.js  ->  http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

let DB = { users:[], services:[], orders:[], deposits:[], tickets:[], notifications:[], coupons:[], announcements:[], categories:[], activity:[], settings:{panelName:"ZARORAT",minDeposit:50,referralBonus:5,supportMessage:"Ask the support team anything. Replies appear inside your ticket."}, favorites:[], transactions:[] };
let clients = []; // SSE clients
let lastUpdate = Date.now();

function sendAll(data){
  let msg = `data: ${JSON.stringify(data)}\n\n`;
  clients = clients.filter(c => { try{ c.res.write(msg); return true; }catch(e){ return false; } });
}
function json(res, code, obj){
  res.writeHead(code, {'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'});
  res.end(JSON.stringify(obj));
}
function serveFile(res, file, type){
  let p = path.join(__dirname, file);
  fs.readFile(p, (err, data)=>{
    if(err){ res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {'Content-Type': type, 'Cache-Control':'no-store'});
    res.end(data);
  });
}
function handler(req, res){
  let u = url.parse(req.url, true);
  let p = u.pathname;
  if(req.method==='OPTIONS'){ res.writeHead(200, {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}); res.end(); return; }
  // Realtime stream - server pushes change instantly
  if(p==='/api/events'){
    res.writeHead(200, {'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','Access-Control-Allow-Origin':'*'});
    res.write(`data: ${JSON.stringify(DB)}\n\n`);
    clients.push({res});
    req.on('close', ()=>{ clients = clients.filter(c=>c.res!==res); });
    // heartbeat har 20s
    let hb = setInterval(()=>{ try{ res.write(': ping\n\n'); }catch(e){ clearInterval(hb); } }, 20000);
    req.on('close', ()=>clearInterval(hb));
    return;
  }
  if(p==='/api/db' && req.method==='GET'){ json(res, 200, DB); return; }
  if(p==='/api/db' && (req.method==='POST' || req.method==='PUT')){
    let body='';
    req.on('data', c=>body+=c);
    req.on('end', ()=>{
      try{
        let d = JSON.parse(body||'{}');
        if(d && typeof d==='object' && (d.users!==undefined || d.services!==undefined)){
          DB = d; lastUpdate = Date.now();
          json(res, 200, {ok:true, updatedAt:lastUpdate});
          sendAll(DB); // sab ko turant bhej do
          return;
        }
        json(res, 400, {ok:false, error:'Invalid DB'});
      }catch(e){ json(res, 400, {ok:false, error:String(e)}); }
    });
    return;
  }
  if(p==='/api/health'){ json(res, 200, {ok:true, server:'Zarorat Full Heavy Server', clients: clients.length, updatedAt:lastUpdate}); return; }
  if(p==='/' || p==='/index.html') return serveFile(res, 'index.html', 'text/html');
  if(p==='/admin.html') return serveFile(res, 'admin.html', 'text/html');
  if(p==='/server.js') return serveFile(res, 'server.js', 'text/javascript');
  res.writeHead(404); res.end('Not found');
}
const server = http.createServer(handler);
if(require.main===module){
  let PORT = process.env.PORT || 3000;
  server.listen(PORT, ()=>console.log('Zarorat Full Heavy Server running on http://localhost:'+PORT));
}
module.exports = handler;
module.exports.server = server;
