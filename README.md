# sempai-anime
Application de recommandations, calendrier et notifications d’animés par Sempaï AI


## Vérification des corrections de collection et PWA

Exécuter `node --test tests/regressions.cjs` (Node.js 22 ou version ultérieure).

Les favoris historiques sont repris dans la collection locale. Les titres de secours et MyAnimeList restent sur cet appareil ; seuls les identifiants AniList sont synchronisés avec Supabase. Aucune migration SQL nécessaire.

Après déploiement : rechercher un titre, ouvrir sa fiche, l’ajouter, vérifier Ma liste puis recharger. Vérifier que Tendances efface les filtres de recherche. Sur Android, ouvrir une première fois en ligne, attendre l’installation du cache, fermer l’application, activer le mode avion et rouvrir : accueil, collection et fiches sauvegardées doivent rester accessibles. Les affiches externes ne sont pas garanties hors connexion.

Les tests automatisés simulent les API et le cache ; ils ne remplacent pas le test Android ni une synchronisation avec un compte réel.
