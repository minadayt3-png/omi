// Omi relay server – no dependencies. Run: node server.js
const http=require('http'),fs=require('fs'),path=require('path');
const rooms={};
const send=(res,t,d)=>res.write(`event: ${t}\ndata: ${JSON.stringify(d)}\n\n`);
http.createServer((req,res)=>{
  const u=new URL(req.url,'http://x'),code=(u.searchParams.get('room')||'').slice(0,20);
  if(u.pathname==='/ev'){
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});
    res.write(': ok\n\n');
    const r=rooms[code]=rooms[code]||new Set();r.add(res);
    const ka=setInterval(()=>res.write(': ka\n\n'),20000);
    req.on('close',()=>{clearInterval(ka);r.delete(res);if(!r.size)delete rooms[code]});
    return;
  }
  if(u.pathname==='/emit'&&req.method==='POST'){
    let b='';req.on('data',c=>{b+=c;if(b.length>1e5)req.destroy()});
    req.on('end',()=>{try{const m=JSON.parse(b);if(/^[a-z]{1,10}$/.test(m.topic))(rooms[code]||[]).forEach(r=>send(r,m.topic,{data:m.data,from:m.from}))}catch(e){}res.writeHead(204).end()});
    return;
  }
  const f=path.join(__dirname,'public','index.html');
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});fs.createReadStream(f).pipe(res);
}).listen(process.env.PORT||3000,()=>console.log('Omi running on port '+(process.env.PORT||3000)));
