(()=>{
  const main=document.querySelector('main'); if(!main)return;
  const stage=document.createElement('section');
  stage.id='pageStage'; stage.className='page-stage'; stage.hidden=true; main.prepend(stage);
  const copy={
    discover:{eyebrow:'01 — Ton radar anime',title:'Trouve un anime qui te ressemble.',text:'Choisis ton humeur, ton énergie et ton temps. Le guide te dirige vers la bonne histoire.',tag:'6 ambiances à explorer',art:'discover'},
    trends:{eyebrow:'02 — Classement vivant',title:'Ce que les otaku regardent maintenant.',text:'Les sorties qui montent, les univers qui font parler et les prochains coups de cœur.',tag:'Sélection actualisée',art:'trends'},
    calendar:{eyebrow:'03 — Mission calendrier',title:'Ne rate plus ton prochain épisode.',text:'Repère les sorties de la semaine, enregistre-les et prépare tes rappels.',tag:'Rappels personnalisés',art:'calendar'},
    explore:{eyebrow:'04 — Explorations otaku',title:'Entre dans les coulisses de l’anime.',text:'Identifie une scène, partage ta recommandation et découvre des anecdotes.',tag:'Scan · communauté · fun',art:'explore'},
    list:{eyebrow:'Ta collection',title:'Tes anime, ton rythme.',text:'Retrouve tes envies, tes progrès et les rappels que tu as choisis.',tag:'Bibliothèque personnelle',art:'list'},
    account:{eyebrow:'Compte Sempaï',title:'Ton espace anime.',text:'Gère ta synchronisation, tes préférences et tes notifications depuis un seul endroit.',tag:'Données synchronisées',art:'account'}
  };
  const route=()=>({decouvrir:'discover',tendances:'trends',calendrier:'calendar',explorer:'explore','ma-liste':'list',compte:'account'})[location.hash.slice(1)]||'home';
  function render(){
    const r=route(),data=copy[r]; document.body.dataset.route=r;
    if(!data){stage.hidden=true;stage.innerHTML='';return}
    stage.hidden=false; stage.className='page-stage stage-'+data.art;
    stage.innerHTML='<div class="stage-copy"><p class="eyebrow">'+data.eyebrow+'</p><h1>'+data.title+'</h1><p>'+data.text+'</p><span class="stage-tag">✦ '+data.tag+'</span></div><div class="stage-art" aria-hidden="true"><div class="stage-orb orb-one"></div><div class="stage-orb orb-two"></div><div class="stage-ring"></div></div>';
  }
  addEventListener('hashchange',render); render();
})();
