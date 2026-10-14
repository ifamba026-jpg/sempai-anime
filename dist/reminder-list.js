(() => {
  const calendar = document.querySelector('#calendarDays');
  if (!calendar) return;
  calendar.addEventListener('click', async event => {
    const button = event.target.closest('[data-reminder-media]');
    if (!button) return;
    event.stopImmediatePropagation();
    try {
      if (!await hasSession()) return toast('Connecte-toi pour enregistrer un rappel et le retrouver dans Ma liste.');
      const title = button.dataset.reminderTitle;
      saveAnime({ id: Number(button.dataset.reminderMedia), title: { romaji: title }, coverImage: { large: '' }, episodes: null, format: 'TV' });
      await db().saveReminder({ media_id: Number(button.dataset.reminderMedia), episode: Number(button.dataset.reminderEpisode), airing_at: new Date(Number(button.dataset.reminderAt) * 1000).toISOString(), title });
      await db().savePreferences({ weekly_airing: true, community_updates: false });
      button.textContent = 'Dans ma liste Â· rappel enregistrÃ©';
      button.disabled = true;
      toast('Anime ajoutÃ© Ã  Ma liste et rappel enregistrÃ©.');
    } catch {
      toast('Impossible dâenregistrer ce rappel. RÃ©essaie dans quelques instants.');
    }
  }, true);
})();
