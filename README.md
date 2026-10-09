# deepflow

Plateforme d'order flow locale pour Binance (style TradingView / DeepCharts / Bookmap), avec des
signaux expliqués : **WHY · ENTRY · EXIT · POS SIZE**.

> Les signaux sont produits par des règles mécaniques. Ce n'est pas un conseil financier.
> Validez-les en suivi papier et en backtest avant d'engager de l'argent réel.

## Architecture

| Partie | Rôle | Techno |
|---|---|---|
| `server/` | Collecteur : WebSockets Binance, carnet local, historique (archives Binance Vision + REST), heatmap en mémoire, moteur de signaux, alertes, API et flux SSE (port 8787) | Node.js 22, sans dépendance |
| `shared/` | Construction des bougies, profils et transformations, commune au serveur et au navigateur | JavaScript ES |
| `web/` | Interface (port 3000) : barre d'outils, graphique, panneaux, recherche de symbole | Next.js 16, React 19, TypeScript, Hugeicons, Inter |
| `web/lib/` | Moteur de graphique Canvas 2D + WebGL2 (heatmap), piloté hors de React | JavaScript ES |

Next.js relaie `/api` et `/stream` vers le collecteur : le navigateur ne parle qu'à `localhost:3000`.

## Lancer

Node.js 22.4 ou plus récent.

```bash
nvm use
npm install --prefix web
npm run dev
```

Ouvrir http://localhost:3000. Le moteur observe le marché 5 minutes avant d'émettre un signal.

| Commande | Rôle |
|---|---|
| `npm run dev` | Collecteur + interface en développement |
| `npm run web:build` puis `npm start` | Version optimisée |
| `npm run collector` | Collecteur seul |
| `npm run signal` | Signal actif et état du moteur dans le terminal |
| `npm run backtest -- <fichier>` | Rejoue un enregistrement à vitesse max, puis statistiques |
| `npm test` | Tests du moteur sur données synthétiques |

## Interface

- **Barre du haut** : recherche de symbole (ou taper des lettres sur le graphique), intervalles
  favoris et menu complet (secondes, minutes, heures, jours, bougies ticks, volume, range, delta,
  renko), style (bougies, creuses, barres, Heikin Ashi, volume, ligne, aire, baseline, escalier,
  colonnes, haut-bas, Line break, Kagi, Point & Figure, TPO), footprint (6 modes), Indicateurs,
  Alerte, réglages, plein écran.
- **Graphique** : historique défilable à l'infini, zoom à la molette, heatmap de liquidité,
  bulles de trades, gros prints, profils de session, POC non testés, VWAP et bandes, signaux,
  lignes d'alerte, compte à rebours de clôture ; panneaux volume, delta, CVD, open interest.
- **Rail à droite** : Signal, DOM, Trades, Marchés, Alertes, Compte (deux panneaux empilés au plus).
- **Barre d'état** : plages 1J, 5J, 1M, 3M, 1A, état de l'historique, heure UTC.

Les choix d'interface sont décrits dans `docs/ux-ui.md`.

## Historique

- Bougies temps sans footprint : klines Binance, depuis la cotation de la paire.
- Footprint, bougies d'activité, profils, bulles : trades agrégés des archives quotidiennes
  Binance Vision (cache dans `data/cache`) et, pour le jour en cours, rattrapage REST.
- Heatmap : mémoire du collecteur (4 h par défaut) ; au-delà, seul `RECORD=1` conserve le carnet.

## Signaux

Deux setups : **absorption sur mur** et **cassure confirmée par le flux**. Plan : entrée au marché,
stop structurel (au moins `MIN_STOP_PCT`), cible 1 à +1,5R (50 %, puis stop au point d'entrée),
cible 2 à +3R, sortie forcée à 30 min ; taille = risque % du capital / distance au stop, plafonnée
par le levier. Refus si frais > 0,35R, mur opposé avant la cible 1 ou taille sous le minimum.

## Configuration (variables d'environnement du collecteur)

| Variable | Défaut | Rôle |
|---|---|---|
| `MARKET` | `futures` | `futures` (USD-M) ou `spot` |
| `SYMBOL` | `BTCUSDT` | Symbole au démarrage (modifiable dans l'interface) |
| `BUCKET` / `FP_BUCKET` | auto | Tranches de la heatmap et du footprint (sinon selon le prix) |
| `HEAT_HOURS` | `4` | Profondeur de la heatmap en mémoire |
| `EQUITY`, `RISK_PCT`, `MAX_LEV` | `1000`, `0.5`, `5` | Risque (modifiable dans Compte) |
| `MIN_STOP_PCT`, `TAKER_FEE` | `0.3`, `0.0005` | Stop minimal, frais taker |
| `RECORD` | désactivé | `1` : enregistre le carnet dans `data/*.ndjson.gz` |
| `REPLAY`, `SPEED` | — , `1` | Rejouer un enregistrement |
| `COLLECTOR_PORT` | `8787` | Port du collecteur (l'interface est sur 3000) |

## Limites connues

- Les frais sont l'obstacle principal : avec 0,05 % de frais taker, un stop doit faire au moins
  0,3 % du prix pour que les frais restent sous 0,35R.
- Binance ne publie pas de flux ordre par ordre : pas de détection d'icebergs fiable.
- Le suivi papier suppose une exécution au bid/ask observé, sans glissement supplémentaire.

Icônes : Hugeicons (jeu gratuit, licence MIT).
