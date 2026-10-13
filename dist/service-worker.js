importScripts('push-worker.js');
const cacheName='sempai-anime-v3';
const assets=['./','index.html','styles.css','extras.css','warmth.css','anime-world.css','features.css','account.css','supabase-config.js','supabase-client.js','app-v3.js','warmth.js','features.js','push.js','push-worker.js','manifest.webmanifest','assets/sempai-anime-icon.jpg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(assets)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(cacheName).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('index.html'))))});
