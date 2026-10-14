self.addEventListener('push', event => {
  const fallback = { title: 'SempaÃ¯ Anime', body: 'Un Ã©pisode arrive bientÃ´t.', url: '/app/calendrier' };
  let data = fallback;
  try { data = { ...fallback, ...(event.data ? event.data.json() : {}) }; } catch {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: 'assets/sempai-anime-icon.jpg',
    badge: 'assets/sempai-anime-icon.jpg',
    tag: data.tag || 'sempai-anime-reminder',
    renotify: false,
    data: { url: data.url || '/app/calendrier' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/app/calendrier', self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
    const existing = windows.find(window => window.url.startsWith(self.location.origin));
    return existing ? existing.focus() : clients.openWindow(target);
  }));
});
self.addEventListener('push', event => {
  const fallback = { title: 'Sempaï Anime', body: 'Un épisode arrive bientôt.', url: './#calendar' };
  let data = fallback;
  try { data = { ...fallback, ...(event.data ? event.data.json() : {}) }; } catch {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: 'assets/sempai-anime-icon.jpg',
    badge: 'assets/sempai-anime-icon.jpg',
    tag: data.tag || 'sempai-anime-reminder',
    renotify: false,
    data: { url: data.url || './#calendar' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './#calendar', self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
    const existing = windows.find(window => window.url.startsWith(self.location.origin));
    return existing ? existing.focus() : clients.openWindow(target);
  }));
});
