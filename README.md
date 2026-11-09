# DIGITAL SOUL — prototype avec intégration fal.ai

## Fonctions intégrées côté serveur
- Génération d'un portrait adulte via `google/nano-banana-2.1`.
- Synthèse vocale via `elevenlabs/tts/eleven-v4`.
- Clé API protégée dans `FAL_KEY`, jamais dans le navigateur.
- Configuration personnage et export JSON.
- Endpoint de santé `GET /api/health`.

## Lancement local
Node.js 20+ requis.
1. `npm install`
2. Définir `FAL_KEY` dans l'environnement du serveur.
3. `npm start`
4. Ouvrir `http://localhost:3000`.

Ne jamais mettre la clé dans le code du navigateur ou dans GitHub.

## Render
Le fichier `render.yaml` décrit un service Node. Il faut pousser ce dossier dans un dépôt Git, connecter ce dépôt à Render et ajouter `FAL_KEY` dans les variables d'environnement Render. Le compte fal.ai utilisé pour le développement ne transmet pas automatiquement sa clé au site hébergé.

## Ce qui reste à construire
Le monde ouvert est une maquette d'interface, pas un environnement 3D jouable. Il reste à intégrer un moteur 3D (par exemple Godot ou Three.js), les déplacements, les PNJ autonomes, la mémoire persistante, la sélection de voix et la synchronisation labiale. Les appels de génération fal.ai peuvent entraîner des frais.


## Modules ajoutés — autonomie et lèvres

La version 1.1 ajoute `three` et `@pixiv/three-vrm`, une scène 3D dans le navigateur,
un comportement de déplacement autonome de démonstration et une synchronisation
labiale basée sur l'amplitude audio.

### Pour essayer
1. Déploie cette version et installe les dépendances (`npm install`).
2. Génère une voix dans l'application.
3. Charge un avatar 3D au format `.vrm` (une image générée par IA n'est pas un modèle 3D).
4. Clique sur « Activer la vie autonome », puis sur « Tester la synchronisation des lèvres ».

### Limites techniques à connaître
- L'autonomie actuelle est une première simulation de promenade avec choix aléatoire de destinations.
  Les besoins, relations, mémoire persistante, conversations entre PNJ et économie du monde ne sont pas encore implémentés.
- La synchronisation labiale actuelle suit le volume sonore et pilote l'expression VRM `Aa`.
  Ce n'est pas encore une synchronisation phonème/visème précise.
- Il faut fournir un avatar `.vrm` riggé et compatible. La génération d'un portrait 2D ne produit pas automatiquement un avatar 3D animable.
- Les modules 3D du navigateur sont chargés depuis esm.sh; une connexion Internet est nécessaire.
