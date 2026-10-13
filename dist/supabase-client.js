(() => {
  const config = window.SEMPAI_SUPABASE;
  const storageKey = 'sempai-anime-supabase-session-v1';
  const readSession = () => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; } };
  const writeSession = (session) => { if (session) localStorage.setItem(storageKey, JSON.stringify(session)); else localStorage.removeItem(storageKey); };
  const errorMessage = async (response) => { const payload = await response.json().catch(() => ({})); return payload.message || payload.msg || payload.error_description || 'Une erreur est survenue.'; };
  const request = async (path, options = {}) => { const response = await fetch(config.url + path, options); if (!response.ok) throw new Error(await errorMessage(response)); return response.status === 204 ? null : response.json(); };
  const refresh = async () => {
    const session = readSession(); if (!session?.refresh_token) return null;
    const payload = await request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: session.refresh_token }) });
    writeSession(payload); return payload;
  };
  const currentSession = async () => {
    let session = readSession(); if (!session) return null;
    if (session.expires_at && session.expires_at * 1000 < Date.now() + 60_000) { try { session = await refresh(); } catch { writeSession(null); return null; } }
    return session;
  };
  const requireSession = async () => {
    const session = await currentSession();
    if (!session?.access_token || !session?.user?.id) throw new Error('Connecte-toi pour synchroniser tes données.');
    return session;
  };
  const rest = async (resource, { method = 'GET', body, prefer } = {}) => {
    const session = await requireSession();
    const headers = { apikey: config.publishableKey, Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' };
    if (prefer) headers.Prefer = prefer;
    return request('/rest/v1/' + resource, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  };
  window.SempaiDb = {
    configured: Boolean(config?.url && config?.publishableKey),
    session: currentSession,
    async signIn(email, password) {
      const payload = await request('/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      writeSession(payload); return payload;
    },
    async signUp(email, password) {
      const payload = await request('/auth/v1/signup', { method: 'POST', headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, options: { emailRedirectTo: location.origin } }) });
      if (payload.access_token) writeSession(payload); return payload;
    },
    signOut() { writeSession(null); },
    listEntries() { return rest('anime_entries?select=*&order=updated_at.desc'); },
    async upsertEntry(entry) { const session = await requireSession(); return rest('anime_entries?on_conflict=user_id,media_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=representation', body: [{ ...entry, user_id: session.user.id }] }); },
    listPosts() { return rest('community_posts?select=*&order=created_at.desc&limit=30'); },
    async createPost(post) { const session = await requireSession(); return rest('community_posts', { method: 'POST', prefer: 'return=representation', body: [{ ...post, user_id: session.user.id }] }); },
    async saveReminder(reminder) { const session = await requireSession(); return rest('airing_reminders?on_conflict=user_id,media_id,episode', { method: 'POST', prefer: 'resolution=merge-duplicates,return=representation', body: [{ ...reminder, user_id: session.user.id }] }); },
    async savePreferences(preferences) { const session = await requireSession(); return rest('notification_preferences?on_conflict=user_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=representation', body: [{ ...preferences, user_id: session.user.id }] }); },
    async savePushSubscription(subscription) { const session = await requireSession(); return rest('push_subscriptions?on_conflict=endpoint', { method: 'POST', prefer: 'resolution=merge-duplicates,return=representation', body: [{ ...subscription, user_id: session.user.id }] }); }
  };
})();

