# NEXOVANTA — prototype gratuit v0.1

PWA responsive Android/Web, interface française.

## Fonctions utilisables
- Inventaire local des URL HTTPS : ajouter, modifier, supprimer.
- Test HEAD depuis le navigateur si CORS le permet.
- Laboratoire API GET/POST/PUT/PATCH/DELETE avec contraintes CORS.
- Création et simulation de flux.
- Copilote heuristique local (pas d'IA distante).
- Approbations avec commentaire obligatoire; approuver ne lance aucune action externe.
- Inventaire d'actifs, journal d'audit, export JSON/CSV.
- Installation PWA sur Android et cache hors ligne de l'interface.

## Limites
Pas de backend, authentification, base de données cloud, synchronisation multiappareil, IA distante ou surveillance en arrière-plan. Les tests navigateur peuvent échouer à cause de CORS sans que le service soit hors ligne. Ne jamais saisir de clés API ou mots de passe dans cette version.

## Publication gratuite GitHub Pages
Dans le dépôt : Settings → Pages → Build and deployment → Deploy from a branch → branch `nexovanta-prototype` → `/(root)` → Save. Le dépôt est public, donc les fichiers de ce prototype seront publics.

## Architecture cible
PWA → API backend authentifiée → base de données isolée par utilisateur → workers de surveillance HTTPS avec protection SSRF → moteur de règles → file d'approbations humaines → connecteurs sécurisés. Les secrets doivent rester côté serveur. Toute action sensible exige aperçu, approbation explicite, journal d'audit et procédure de retour arrière.
