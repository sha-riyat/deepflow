# Instructions pour Claude (deepflow)

Répondre en français, avec les accents. Le propriétaire débute en order flow, Volume Profile et TPO :
expliquer simplement, sans jargon non défini.

## Le projet

deepflow est un **terminal d'analyse crypto gratuit et local**, dans l'esprit d'ATAS, DeepCharts,
Exocharts, Sierra Chart ou NinjaTrader. Les données d'order flow sont payantes ailleurs ; Binance
les publie gratuitement (chaque trade, carnet d'ordres, liquidations), ce qui rend l'outil possible.

- Utilisateurs : le propriétaire et ses amis ; **chacun installe deepflow sur son ordinateur**
  (pas d'hébergement, pas de comptes).
- **Analyse et exécution manuelles.** Aucun signal automatique, scanner ou backtest dans
  l'application : ils ont été retirés volontairement et archivés sur la branche
  `archive/moteur-strategie`. Ne pas les réintroduire sans demande explicite.
- Objectif : tous les outils d'un trader order flow / Volume Profile, plusieurs graphiques et
  fenêtres, des dessins, et une aide à l'apprentissage.

Le README décrit l'architecture, les commandes, l'interface et la feuille de route.

## Prochaine étape (feuille de route)

1. **Outils de dessin** (priorité choisie par le propriétaire) : lignes, horizontales, rayons,
   rectangles, Fibonacci, texte, règle de mesure, outil position longue / courte (stop, cible,
   rapport gain / risque), **Volume Profile à plage fixe** tracé à la souris, **VWAP ancré** au clic ;
   dessins sauvegardés par symbole, aimant sur les prix (OHLC).
2. Espace de travail : grilles 1 / 2 / 4 graphiques, fenêtres détachables, liens symbole /
   intervalle, réticule synchronisé, plusieurs symboles en direct, mises en page sauvegardées.
3. Indicateurs : bandes du VWAP, ouvertures jour / semaine / mois, sessions Asie / Londres /
   New York, historique du financement et de la prime, CVD multi-plateformes (Bybit, OKX).
4. Apprentissage : explication de chaque indicateur dans l'interface, mode replay.

Avant de coder une étape, proposer un plan court et le faire valider.

## Repères techniques

- `server/` : collecteur Node.js 22 sans dépendance (WebSockets Binance, carnet local, historique
  Binance Vision + REST, heatmap, analyse du flux `server/flow.js`, alertes, API + SSE sur 8787).
- `shared/` : calculs communs serveur / navigateur (bougies, profils, TPO, enchère, footprint, CVD).
- `web/` : Next.js 16 + React 19 + TypeScript ; le graphique (`web/lib/chart`, `web/lib/layers`)
  est en Canvas 2D / WebGL2, piloté hors de React. Les réglages d'indicateurs sont dans
  `web/lib/indicators.js`, les préférences dans `web/lib/store.ts` (localStorage).
- Session = jour UTC. Niveaux de prix en « lignes » (`row × bucket`).
- Vérifications : `npm test` (tests unitaires), `cd web && npx tsc --noEmit`, `npm run web:build`,
  `npm run verify` (compare aux données officielles Binance, réseau requis).
- Dans un environnement cloud, l'accès à Binance peut être bloqué (erreur 451 selon le pays) :
  s'appuyer alors sur les tests unitaires et le build, et le dire.
- Node : version de `.nvmrc` (22). En local (Windows), changer de version uniquement avec `nvm` ;
  ne pas modifier `.nvmrc` ni `engines` sans accord.

## Règles de travail (obligatoires)

- **Une action, un commit** : une fonctionnalité, un correctif, une page, une suppression = un
  commit distinct. Ne jamais mélanger fonctionnalité et correctif, ni code et documentation.
- **Ne jamais commiter sans accord explicite** du propriétaire, donné après qu'il a testé et
  validé le résultat (« les tests passent » ne vaut pas accord). Préparer les commits, vérifier
  que chaque diff ne contient que l'action concernée, puis demander.
- Messages de commit en français, simples, décrivant une seule action. **Jamais de ligne
  `Co-authored-by` ni de mention de Claude** dans les commits.
- Ne pas commiter les fichiers Markdown créés par l'agent (notes, plans, rapports), **sauf
  `README.md`**, à mettre à jour quand une fonctionnalité visible change (commit séparé).
- Fichiers de 200 à 300 lignes ; 400 au plus si c'est justifié, sinon découper en modules.
- Écrire comme le code existant : commentaires en français, même densité, mêmes conventions.
