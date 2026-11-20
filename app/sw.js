const CACHE="zero-studio-shell-v47";
const FILES=[
  "./","./index.html","./styles.css","./app.js","./engine.mjs",
  "./raster-brushes.mjs","./raster-environment-media.mjs","./raster-surface.mjs",
  "./character-model.mjs","./character-library.mjs","./backgrounds.mjs","./zip.mjs",
  "./gemini-drawing.mjs","./scene-production.mjs","./environment-art.mjs",
  "./mesh-scene-renderer.mjs","./anime-background-painter.mjs",
  "./animation-production.mjs","./frame-history.mjs","./animation-worker.mjs",
  "./manifest.webmanifest"
];
const SHELL_NETWORK_FIRST=new Set(["/","/index.html","/app.js"]);
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
  if(SHELL_NETWORK_FIRST.has(url.pathname)){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
          return response;
        })
        .catch(()=>caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
      return response;
    }).catch(()=>caches.match("./index.html")))
  );
});
