# SùSù backend — mise en route

Ce backend remplace Firebase (Firestore pour les commandes) et devient le
seul endroit où les clés PayDunya existent. Le site (`commande.html`,
`successpay.html`) leur parle uniquement via cette API — jamais directement
à PayDunya.

## 1. Lancer en local

```
cd backend
cp .env.example .env
```

Ouvre `.env` et remplis `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`,
`PAYDUNYA_TOKEN` avec tes clés de **test** pour commencer (celles qui
commencent par `test_`). Laisse `PAYDUNYA_BASE_URL` sur la valeur sandbox
tant que tu utilises ces clés-là.

```
docker compose up --build
```

L'API tourne sur `http://localhost:3000`, MongoDB tourne à côté dans son
propre conteneur (pas besoin de l'installer toi-même).

## 2. Vérifier que ça fonctionne

```
curl http://localhost:3000/orders
```

Doit répondre `[]` (aucune commande pour l'instant) sans erreur.

## 3. Brancher le site dessus

Dans **`commande.js`** et **`successpay.js`**, remplace :

```js
const BACKEND_BASE_URL = 'http://localhost:3000';
```

par l'URL réelle de ton backend une fois déployé (les deux fichiers doivent
avoir exactement la même valeur).

## 4. Déployer

N'importe quel hébergeur qui supporte Docker convient (un VPS avec Docker
installé, Railway, Render, etc.) — o2switch ne peut pas faire tourner ce
backend, il n'héberge que les fichiers statiques du site. Une fois déployé :

1. Remplis `.env` sur le serveur avec les mêmes variables qu'en local
2. `docker compose up -d --build`
3. Mets à jour `BACKEND_BASE_URL` dans `commande.js` et `successpay.js`
   avec l'URL publique du serveur
4. Mets à jour `CORS_ORIGIN` et `PUBLIC_BASE_URL` dans `.env` avec l'URL
   réelle de `backtoschool.dixtri.com`

## Passer en production (paiements réels)

Une fois que tout fonctionne avec les clés de test :

1. Remplace les trois clés dans `.env` par tes clés `live_...`
2. Change `PAYDUNYA_BASE_URL` pour `https://app.paydunya.com/api/v1`
   (sans `sandbox-`)
3. Redéploie (`docker compose up -d --build`)

Aucune ligne de code à changer pour cette bascule — uniquement les
variables dans `.env`.

## Ce qui n'est PAS encore couvert

Ce backend gère les commandes et les paiements uniquement — c'est le
minimum nécessaire pour remplacer le flux Firestore + PayDunya actuel.
Le backoffice (comptes staff, rôles, tableau de bord, journal d'activité)
reste sur Firebase pour l'instant. Si tu veux migrer ça aussi vers ce
backend plus tard, ce sera un module `auth`/`staff` séparé à ajouter —
dis-le moi quand tu y arrives.
