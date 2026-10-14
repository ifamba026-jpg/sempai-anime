(() => {
  const routePaths = {
    home: '/', discover: '/app/decouvrir', trends: '/app/tendances',
    calendar: '/app/calendrier', explore: '/app/explorer', list: '/app/ma-liste', account: '/app/compte'
  };
  const routeNames = { home: 'Accueil', discover: 'DÃ©couvrir', trends: 'Tendances', calendar: 'Calendrier', explore: 'Explorer', list: 'Ma liste', account: 'Mon compte' };
  const groups = {
    home: ['.hero'], discover: ['#decouvrir', '#tonight'], trends: ['#tendance'], calendar: ['#calendar'],
    explore: ['#trace', '#community', '#extras'], list: ['#listScreen'], account: ['#accountScreen']
  };
  const contentSections = [...document.querySelectorAll('main > section')];
  const listScreen = document.querySelector('#listScreen');
  const accountScreen = document.querySelector('#accountScreen');
  const accountHome = document.querySelector('#accountDialog');

  const routeFromLocation = () => {
    const part = location.pathname.match(/^\/app\/([^/]+)/)?.[1];
    return ({ accueil: 'home', decouvrir: 'discover', tendances: 'trends', calendrier: 'calendar', explorer: 'explore', 'ma-liste': 'list', compte: 'account' })[part] || 'home';
  };
  const formatDate = value => new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

  async function getReminders() {
    try {
      const session = await db().session();
      if (!session?.access_token) return [];
      const config = window.SEMPAI_SUPABASE;
      const response = await fetch(config.url + '/rest/v1/airing_reminders?select=*&order=airing_at.asc', {
        headers: { apikey: config.publishableKey, Authorization: 'Bearer ' + session.access_token }
      });
      return response.ok ? await response.json() : [];
    } catch { return []; }
  }

  async function renderListScreen() {
    try { await syncList(); } catch {}
    const items = watchlist();
    const reminders = await getReminders();
    const upcoming = reminders.filter(item => new Date(item.airing_at).getTime() >= Date.now());
    const reminderMarkup = upcoming.length
      ? `<div class="reminder-list">${upcoming.map(item => `<article class="reminder-card"><span class="reminder-mark">â·</span><div><b>${safe(item.title || 'Anime')}</b><small>Ãpisode ${Number(item.episode || 0)} Â· ${formatDate(item.airing_at)}</small></div><span class="reminder-state">ProgrammÃ©</span></article>`).join('')}</div>`
      : '<p class="empty-copy">Aucun rappel Ã  venir. Depuis le calendrier, touche Â« Me rappeler Â» : lâanime sera aussi ajoutÃ© Ã  ta liste.</p>';
    const animeMarkup = items.length
      ? `<div class="saved-anime-grid">${items.map(item => `<button class="saved-anime" data-open-saved-page="${Number(item.id)}" type="button">${item.image ? `<img src="${safe(item.image)}" alt="">` : '<span class="saved-anime-placeholder">â¦</span>'}<span><b>${safe(item.title)}</b><small>${safe(item.status || 'Ã  regarder')} Â· ${Number(item.progress || 0)}/${item.episodes || '?'}</small></span><i>âº</i></button>`).join('')}</div>`
      : '<div class="empty-state"><b>Ta liste dÃ©marre ici.</b><p>Ajoute un anime depuis sa fiche ou active un rappel depuis le calendrier.</p><button class="small-button" data-route="discover" type="button">DÃ©couvrir des anime</button></div>';
    listScreen.innerHTML = `<div class="app-page-head"><p class="eyebrow">Ta collection personnelle</p><h1>Ma liste</h1><p>Anime enregistrÃ©s, progression et rappels sont regroupÃ©s ici.</p></div><div class="list-kpis"><article><b>${items.length}</b><span>Anime enregistrÃ©s</span></article><article><b>${upcoming.length}</b><span>Rappels Ã  venir</span></article><article><b>${items.filter(item => item.status === 'en cours').length}</b><span>En cours</span></article></div><section class="list-block"><div class="list-block-head"><h2>Prochains rappels</h2><button class="text-button" data-route="calendar" type="button">Voir le calendrier</button></div>${reminderMarkup}</section><section class="list-block"><div class="list-block-head"><h2>Mes anime</h2><button class="text-button" data-route="discover" type="button">DÃ©couvrir</button></div>${animeMarkup}</section>`;
  }

  async function renderAccountScreen() {
    if (accountContent.parentElement !== accountScreen) accountScreen.appendChild(accountContent);
    await renderAccount();
  }
  function restoreAccountContent() {
    if (accountContent.parentElement === accountScreen) accountHome.appendChild(accountContent);
  }
  async function renderRoute() {
    const route = routeFromLocation();
    document.body.dataset.route = route;
    document.title = `${routeNames[route]} â SempaÃ¯ Anime`;
    contentSections.forEach(section => { section.hidden = !(groups[route] || []).some(selector => section.matches(selector)); });
    document.querySelectorAll('[data-route]').forEach(element => elem.classList.toggle('active', element.dataset.route === route));
    if (route === 'list') await renderListScreen();
    if (route === 'account') await renderAccountScreen(); else restoreAccountContent();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function go(route, { replace = false } = {}) {
    if (!routePaths[route]) return;
    const destination = routePaths[route];
    if (location.pathname !== destination) history[replace ? 'replaceState' : 'pushState']({ route }, '', destination);
    renderRoute();
  }
  document.addEventListener('click', event => {
    const routeTarget = event.target.closest('[data-route]');
    if (routeTarget) { event.preventDefault(); event.stopImmediatePropagation(); go(routeTarget.dataset.route); return; }
    const action = event.target.closest('[data-account-action]')?.dataset.accountAction;
    if (action === 'list' || action === 'discover') { event.preventDefault(); event.stopImmediatePropagation(); go(action === 'list' ? 'list' : 'discover'); return; }
    const saved = event.target.closest('[data-open-saved-page]');
    if (saved) openEnriched(saved.dataset.openSavedPage);
  }, true);
  document.querySelector('#moodGrid')?.addEventListener('click', event => { if (event.target.closest('button')) setTimeout(() => go('trends'), 0); });
  document.querySelector('#searchButton')?.addEventListener('click', () => { if (document.querySelector('#searchInput').value.trim()) setTimeout(() => go('trends'), 0); });
  document.querySelector('#searchInput')?.addEventListener('keydown', event => { if (event.key === 'Enter' && event.currentTarget.value.trim()) setTimeout(() => go('trends'), 0); });
  document.querySelector('#favoritesButton')?.addEventListener('click', () => setTimeout(() => go('trends'), 0));
  window.addEventListener('popstate', renderRoute);
  renderRoute();
})();
