const endpoint = 'https://graphql.anilist.co';
const grid = document.querySelector('#animeGrid');
const loading = document.querySelector('#loading');
const title = document.querySelector('#resultsTitle');
const subtitle = document.querySelector('#resultsSubtitle');
const dialog = document.querySelector('#animeDialog');
const dialogContent = document.querySelector('#dialogContent');
const favoritesKey = 'sempai-anime-favorites';
let currentPage = 1;
let activeGenre = null;
let activeSearch = '';
let currentItems = [];

const query = `query ($page: Int, $search: String, $genre: String) {
  Page(page: $page, perPage: 12) { pageInfo { hasNextPage } media(type: ANIME, isAdult: false, search: $search, genre: $genre, sort: TRENDING_DESC) {
    id title { romaji english native } coverImage { large color } bannerImage averageScore episodes format status seasonYear genres description(asHtml: false) trailer { id site thumbnail }
  } }
}`;

function favorites(){ return JSON.parse(localStorage.getItem(favoritesKey) || '[]'); }
function setFavorites(values){ localStorage.setItem(favoritesKey, JSON.stringify(values)); updateFavoriteCount(); }
function updateFavoriteCount(){ document.querySelector('#favoriteCount').textContent = favorites().length; }
function animeTitle(anime){ return anime.title.english || anime.title.romaji || anime.title.native; }
function escapeHtml(text=''){ const el=document.createElement('div'); el.textContent=text; return el.innerHTML; }
function toast(message){ const box=document.querySelector('#toast'); box.textContent=message; box.classList.add('show'); setTimeout(()=>box.classList.remove('show'),2500); }
function setLoading(value){ loading.hidden=!value; }

async function loadAnime({append=false}={}){
  setLoading(true);
  if(!append) grid.innerHTML='';
  try{
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({query,variables:{page:currentPage,search:activeSearch||null,genre:activeGenre}})});
    const payload=await response.json();
    if(payload.errors) throw new Error(payload.errors[0].message);
    const page=payload.data.Page;
    currentItems=append?[...currentItems,...page.media]:page.media;
    renderCards(append?page.media:currentItems);
    document.querySelector('#loadMore').hidden=!page.pageInfo.hasNextPage;
  }catch(error){
    if(!append) grid.innerHTML='<div class="empty">Impossible de charger les anime pour le moment. Vérifie ta connexion puis réessaie.</div>';
    toast('La recherche n’a pas pu aboutir.');
  }finally{ setLoading(false); }
}
function renderCards(items){
  if(!items.length){ grid.innerHTML='<div class="empty">Aucun anime trouvé. Essaie un autre titre ou une autre humeur.</div>'; return; }
  const html=items.map(anime=>`<article class="anime-card" data-id="${anime.id}" tabindex="0"><div class="cover">${anime.coverImage?.large?`<img src="${anime.coverImage.large}" alt="Affiche de ${escapeHtml(animeTitle(anime))}" loading="lazy">`:''}<span class="score">★ ${anime.averageScore?Math.round(anime.averageScore/10)+'/10':'—'}</span></div><div class="card-info"><h3>${escapeHtml(animeTitle(anime))}</h3><p>${anime.format||'Anime'} · ${anime.episodes||'?'} ép.</p></div></article>`).join('');
  if(currentPage===1) grid.innerHTML=html; else grid.insertAdjacentHTML('beforeend',html);
}
function openAnime(id){
  const anime=currentItems.find(item=>item.id===Number(id)); if(!anime) return;
  const saved=favorites().includes(anime.id);
  dialogContent.innerHTML=`<div class="detail"><img class="detail-cover" src="${anime.coverImage?.large||''}" alt=""><div><p class="eyebrow">${escapeHtml(anime.format||'Anime')} ${anime.seasonYear?'· '+anime.seasonYear:''}</p><h2>${escapeHtml(animeTitle(anime))}</h2><p class="meta">★ ${anime.averageScore?Math.round(anime.averageScore/10)+'/10':'Pas encore noté'} · ${anime.episodes||'Nombre d’épisodes inconnu'} épisodes · ${escapeHtml(anime.status||'')}</p><div class="tags">${(anime.genres||[]).map(tag=>`<span>${escapeHtml(tag)}</span>`).join('')}</div><p class="description">${escapeHtml((anime.description||'Description indisponible.').replace(/\n/g,' '))}</p><button class="fav-detail" data-favorite="${anime.id}">${saved?'♥ Retirer de ma liste':'♡ Ajouter à ma liste'}</button></div></div>`;
  dialog.showModal();
}
function toggleFavorite(id){ const values=favorites(); const index=values.indexOf(Number(id)); if(index===-1){values.push(Number(id));toast('Ajouté à ta liste !');}else{values.splice(index,1);toast('Retiré de ta liste.');}setFavorites(values); dialog.close(); }
document.querySelector('#moodGrid').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;document.querySelectorAll('#moodGrid button').forEach(item=>item.classList.remove('active'));button.classList.add('active');activeGenre=button.dataset.genre;activeSearch='';currentPage=1;title.textContent=button.dataset.label;subtitle.textContent=`Une sélection ${button.dataset.genre.toLowerCase()} rien que pour toi.`;loadAnime();document.querySelector('#tendance').scrollIntoView({behavior:'smooth',block:'start'});});
function search(){activeSearch=document.querySelector('#searchInput').value.trim();if(!activeSearch){toast('Écris le titre d’un anime.');return;}activeGenre=null;document.querySelectorAll('#moodGrid button').forEach(item=>item.classList.remove('active'));currentPage=1;title.textContent=`Résultats pour « ${activeSearch} »`;subtitle.textContent='Découvre les anime correspondants.';loadAnime();document.querySelector('#tendance').scrollIntoView({behavior:'smooth',block:'start'});}
document.querySelector('#searchButton').addEventListener('click',search);document.querySelector('#searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
grid.addEventListener('click',e=>{const card=e.target.closest('.anime-card');if(card)openAnime(card.dataset.id)});grid.addEventListener('keydown',e=>{const card=e.target.closest('.anime-card');if(card&&e.key==='Enter')openAnime(card.dataset.id)});
document.querySelector('#closeDialog').addEventListener('click',()=>dialog.close());dialogContent.addEventListener('click',e=>{const btn=e.target.closest('[data-favorite]');if(btn)toggleFavorite(btn.dataset.favorite)});
document.querySelector('#loadMore').addEventListener('click',()=>{currentPage++;loadAnime({append:true})});
document.querySelector('#favoritesButton').addEventListener('click',()=>{const ids=favorites();if(!ids.length){toast('Ta liste est encore vide.');return;}const saved=currentItems.filter(item=>ids.includes(item.id));if(saved.length){title.textContent='Ma liste';subtitle.textContent='Les anime que tu veux regarder.';grid.innerHTML='';currentPage=1;renderCards(saved);document.querySelector('#loadMore').hidden=true;document.querySelector('#tendance').scrollIntoView({behavior:'smooth'});}else toast('Ouvre un anime récent pour voir ta liste.');});
updateFavoriteCount();loadAnime();
