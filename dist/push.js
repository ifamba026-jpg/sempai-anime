(() => {
  const toUint8Array = value => {
    const padded = value + '='.repeat((4 - value.length % 4) % 4);
    const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, char => char.charCodeAt(0));
  };
  const toBase64 = buffer => btoa(String.fromCharCode(...new Uint8Array(buffer)));

  async function installPushControl() {
    const session = await db().session();
    const panel = document.querySelector('#accountContent .auth-panel');
    if (!session || !panel || panel.dataset.pushControl) return;
    panel.dataset.pushControl = 'true';
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    panel.insertAdjacentHTML('beforeend', supported
      ? '<button id="enablePushButton" class="small-button" type="button">Activer les notifications d’épisodes</button><p class="link-note" id="pushStatus">Tu choisis si Sempaï Anime peut t’alerter avant un épisode enregistré.</p>'
      : '<p class="link-note">Les notifications push ne sont pas prises en charge par ce navigateur.</p>');
    if (supported && Notification.permission === 'granted') {
      const button = document.getElementById('enablePushButton');
      button.textContent = 'Notifications d’épisodes activées';
      button.disabled = true;
      document.getElementById('pushStatus').textContent = 'Les rappels d’épisodes peuvent maintenant arriver même lorsque l’app est fermée.';
    }
  }

  async function enablePush() {
    if (!window.SEMPAI_SUPABASE?.vapidPublicKey) throw new Error('Configuration push indisponible.');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Autorise les notifications dans ton navigateur pour recevoir les rappels.');
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toUint8Array(window.SEMPAI_SUPABASE.vapidPublicKey)
    });
    const keys = subscription.toJSON().keys || {};
    if (!keys.p256dh || !keys.auth) throw new Error('Abonnement push incomplet. Réessaie.');
    await db().savePushSubscription({ endpoint: subscription.endpoint, p256dh: keys.p256dh, auth: keys.auth, user_agent: navigator.userAgent.slice(0, 500) });
    await db().savePreferences({ weekly_airing: true });
  }

  const observer = new MutationObserver(() => { installPushControl().catch(() => {}); });
  observer.observe(accountContent, { childList: true, subtree: true });
  const openAccount = accountButton.onclick;
  accountButton.onclick = async event => { await openAccount.call(accountButton, event); await installPushControl(); };
  accountContent.addEventListener('click', async event => {
    if (event.target.id !== 'enablePushButton') return;
    const button = event.target;
    button.disabled = true;
    button.textContent = 'Activation…';
    try {
      await enablePush();
      button.textContent = 'Notifications d’épisodes activées';
      document.getElementById('pushStatus').textContent = 'Les rappels d’épisodes peuvent maintenant arriver même lorsque l’app est fermée.';
      toast('Notifications d’épisodes activées.');
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Activer les notifications d’épisodes';
      toast(error.message || 'Activation des notifications impossible.');
    }
  });
})();
