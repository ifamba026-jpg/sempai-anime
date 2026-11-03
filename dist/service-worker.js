importScripts('push-worker.js');
const cacheName='sempai-anime-v9';
const assets=['./','index.html','styles.css','extras.css','warmth.css','anime-world.css','features.css','account.css','refonte.css','home-trends.css','reminder-list.js','navigation.css','navigation.js','page-stages.js','supabase-config.js','supabase-client.js','app-v3.js','home-trends.js','warmth.js','features.js','push.js','push-worker.js','manifest.webmanifest','assets/sempai-anime-icon.jpg','assets/sempai-anime-icon-192.png','assets/sempai-anime-icon-512.png','assets/anime-hero-original-v1.png','assets/isaac-anime-guide-cyber-v1.png','assets/isaac-anime-guide-tonight-v1.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(assets)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith('sempai-anime-v')&&name!==cacheName)await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  // Never cache third-party APIs or authenticated responses.
  if(request.method!=='GET'||url.origin!==self.location.origin||request.headers.has('Authorization'))return;
  const relative=url.pathname.slice(new URL(self.registration.scope).pathname.length);
  if(request.mode!=='navigate'&&!assets.includes(relative)&&!assets.includes('./'+relative))return;
  event.respondWith((async()=>{
    const cache=await caches.open(cacheName),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
    try{
      const response=await fetch(request,{signal:controller.signal});
      if(response.ok){await cache.put(request,response.clone());return response}
      if(response.status<500)return response;
      throw Error('Service unavailable');
    }catch{
      const hit=await cache.match(request);
      if(hit)return hit;
      if(request.mode==='navigate'){const page=await cache.match('index.html');if(page)return page}
      return Response.error();
    }finally{clearTimeout(timer)}
  })());
});
