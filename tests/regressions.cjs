const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
function app(){
 const nodes=new Map(),storage=new Map();
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{textContent:'',innerHTML:'',value:'',hidden:false,classList:{add(){},remove(){}},addEventListener(){},scrollIntoView(){},close(){},showModal(){}});return nodes.get(selector)};
 const context=vm.createContext({console,Map,Set,Date,JSON,Number,String,Math,AbortController,setTimeout,clearTimeout,requestAnimationFrame:f=>f(),navigator:{onLine:true},location:{hash:''},document:{querySelector:node,querySelectorAll:()=>[],createElement:()=>node('created')},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},window:{SempaiDb:{session:async()=>null}},fetch:async()=>{throw Error('offline')}});
 vm.runInContext(read('dist/app-v3.js').replace(/updateFavoriteCount\(\);\s*loadSeasonalAnime\(\);\s*loadHeroCharacters\(\);\s*$/,''),context);
 const features=read('dist/features.js');vm.runInContext(features.slice(0,features.indexOf('async function showWatchlist')),context);
 return {context,nodes,storage,run:code=>vm.runInContext(code,context),features};
}
test('simple detail add, reload and remove use the same collection',()=>{
 const a=app();a.run('currentItems=offlineAnime;toggleFavorite(-1)');
 assert.equal(JSON.parse(a.storage.get('sempai-anime-watchlist-v1'))[0].title,'One Piece');
 assert.equal(a.run('favorites()[0]'),-1);
 a.run('toggleFavorite(-1)');assert.equal(a.run('watchlist().length'),0);
});
test('legacy favorite migration preserves unknown IDs and deduplicates',()=>{
 const a=app();a.storage.set('sempai-anime-favorites','[-1,999999]');
 a.run(a.features.slice(a.features.indexOf('// Recover known legacy favorites')));
 a.run(a.features.slice(a.features.indexOf('// Recover known legacy favorites')));
 assert.equal(a.run('watchlist().length'),2);assert.equal(a.run('watchlist()[0].title'),'One Piece');
});
test('cached titles remain searchable when both catalogs fail',async()=>{
 const a=app();a.run("rememberAnime([{id:20,title:{english:'Naruto',romaji:'NARUTO'},genres:['Action']}]);activeSearch='Naruto'");
 await a.run('loadAnime()');assert.equal(a.run('currentItems[0].id'),20);
 a.run("activeSearch='missing';loadOfflineAnime()");assert.match(a.nodes.get('#animeGrid').innerHTML,/pas disponible sur cet appareil/);
});
test('Tendances resets search and genre; MyAnimeList URL keeps interpolation',async()=>{
 const a=app();let request;a.context.fetch=async(url,options)=>{request={url,options};return {json:async()=>({data:{Page:{media:[],pageInfo:{hasNextPage:false}}}})}};
 a.run("activeSearch='One Piece';activeGenre='Action'");await a.run('loadTrends()');
 assert.equal(JSON.parse(request.options.body).variables.search,null);assert.equal(JSON.parse(request.options.body).variables.genre,null);
 a.context.fetch=async url=>{request=url;return {ok:true,json:async()=>({data:[]})}};
 a.run("activeSearch='One Piece'");await a.run('loadJikan()');assert.match(request,/q=One%20Piece/);
 assert.notEqual(a.run('normalizeJikan({mal_id:20}).id'),20);
});
test('remote sync keeps local fallback entries and never uploads their synthetic IDs',async()=>{
 const a=app(),uploaded=[];a.run('saveAnime(offlineAnime[0])');
 a.context.window.SempaiDb={session:async()=>({}),upsertEntry:async x=>uploaded.push(x),listEntries:async()=>[{media_id:20,title:'Naruto',status:'planned',updated_at:'2026-11-03'}]};
 await a.run('syncList()');assert.equal(uploaded.length,0);assert.equal(a.run('watchlist().length'),2);
});
function worker(){
 const handlers={},deleted=[],cache={addAll:async list=>{for(const p of list)assert.ok(fs.existsSync('dist/'+(p==='./'?'index.html':p)),p)},put:async()=>{},match:async request=>request==='index.html'?new Response('APP',{headers:{'Content-Type':'text/html'}}):null};
 const context=vm.createContext({URL,Response,AbortController,setTimeout,clearTimeout,importScripts(){},self:{skipWaiting:async()=>{},location:{origin:'https://anime.test'},registration:{scope:'https://anime.test/'},clients:{claim:async()=>{}},addEventListener:(name,fn)=>handlers[name]=fn},caches:{open:async()=>cache,keys:async()=>['sempai-anime-v8','sempai-anime-v9','unrelated'],delete:async name=>deleted.push(name)},fetch:async()=>{throw Error('offline')}});
 vm.runInContext(read('dist/service-worker.js'),context);return {handlers,deleted};
}
test('offline navigation gets HTML, missing JS never gets HTML, external/auth requests bypass cache',async()=>{
 const w=worker();const request=(path,mode='cors',auth=false)=>({url:'https://anime.test/'+path,method:'GET',mode,headers:{has:()=>auth}});
 let result;w.handlers.fetch({request:request('app/decouvrir','navigate'),respondWith:p=>result=p});assert.equal(await (await result).text(),'APP');
 w.handlers.fetch({request:request('navigation.js'),respondWith:p=>result=p});assert.equal((await result).type,'error');
 let intercepted=false;w.handlers.fetch({request:request('navigation.js','cors',true),respondWith:()=>intercepted=true});assert.equal(intercepted,false);
 w.handlers.fetch({request:{...request(''),url:'https://api.test/anime'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
 let done;w.handlers.install({waitUntil:p=>done=p});await done;
 w.handlers.activate({waitUntil:p=>done=p});await done;assert.deepEqual(w.deleted,['sempai-anime-v8']);
});
