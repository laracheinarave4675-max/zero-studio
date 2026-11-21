const CACHE="zero-studio-shell-v48";
const FILES=[
  "./","./index.html","./styles.css","./app.js","./manifest.webmanifest",
  "./engine.mjs","./zip.mjs","./scene-production.mjs","./animation-production.mjs",
  "./frame-history.mjs","./character-model.mjs","./character-library.mjs",
  "./backgrounds.mjs","./raster-brushes.mjs","./raster-surface.mjs",
  "./digital-artist-brush-engine.mjs","./digital-artist-vision-brush-planner.mjs",
  "./digital-artist-demo-plan.mjs","./digital-artist-brush-executor.mjs",
  "./digital-artist-stroke-edit.mjs","./digital-artist-eyes.mjs",
  "./anime-artist-curriculum.mjs","./anime-drawing-training.mjs",
  "./digital-artist-learning.mjs","./digital-artist-corrections.mjs",
  "./anime-anatomy-engine.mjs","./kimono-side-walk-chart.mjs",
  "./anime-auto-drawing-engine.mjs"
];
const isAppCode=url=>/\\.(?:html|css|m?js)$/i.test(url.pathname);
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith("zero-studio-shell-")&&key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith("/api/"))return;
  if(event.request.mode==="navigate"||isAppCode(url)){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
          return response;
        })
        .catch(async()=>{
          const cached=await caches.match(event.request);
          if(cached)return cached;
          return new Response("ZERO STUDIO: تعذر تحميل ملف التطبيق. تحقق من الاتصال ثم أعد المحاولة.",{
            status:503,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}
          });
        })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
      return response;
    }).catch(()=>new Response("",{status:503})))
  );
});
