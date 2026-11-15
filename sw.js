const CACHE="dobavki-v4";
const FILES=["./","index.html","manifest.webmanifest","icons/icon-180.png","icons/icon-192.png","icons/icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>fetch(f,{cache:"reload"}).then(r=>{if(r.ok)return c.put(f,r)})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
function timeout(ms){return new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms))}
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  if(url.pathname.endsWith("version.txt"))return;
  // Own files: always try the network first so a new version shows on the next open; cache is the offline fallback.
  e.respondWith(caches.open(CACHE).then(async c=>{
    try{
      const r=await Promise.race([fetch(req,{cache:"no-cache"}),timeout(4000)]);
      if(r&&r.ok)c.put(req,r.clone());
      return r;
    }catch(err){
      const hit=await c.match(req,{ignoreSearch:true})||await c.match("index.html");
      if(hit)return hit;
      throw err;
    }
  }));
});
