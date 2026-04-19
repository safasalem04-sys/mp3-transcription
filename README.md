# PulseScript - Transcription Audio/Video Sans Cle API

Application web elegante pour importer un fichier audio/video et obtenir sa transcription texte directement dans le navigateur.
Le projet est pret pour un deploiement sur Render et ne demande aucune cle OpenAI.

## Pourquoi ca ne marche plus apres fermeture VS Code

En local, quand tu fermes VS Code ou le terminal, le serveur Node s'arrete.
Pour garder l'application accessible en permanence, il faut la deployer sur un hebergeur (ex: Render).

## Acces Depuis iPhone

- `localhost:3000` ne fonctionne pas sur iPhone (localhost pointe vers l'iPhone lui-meme).
- Utilise l'URL publique Render apres deploiement.
- En local uniquement: iPhone et PC doivent etre sur le meme Wi-Fi, puis ouvre `http://IP_DU_PC:3000`.

## Stack

- Node.js + Express pour servir l'application
- Frontend statique moderne (HTML/CSS/JS)
- Transcription locale dans le navigateur avec Transformers.js et Whisper Tiny

## Prerequis

- Node.js 18+

## Lancer en local

1. Installer les dependances:

	```bash
	npm install
	```

2. Demarrer le serveur:

	```bash
	npm run dev
	```

3. Ouvrir `http://localhost:3000`

## Deployer sur Render

### Bouton de deploiement (apres push GitHub)

Lien direct pour ton repository:

```text
https://render.com/deploy?repo=https://github.com/safasalem04-sys/mp3-transcription
```

### Option A (Blueprint recommande)

1. Push le repo sur GitHub.
2. Sur Render, clique sur **New +** puis **Blueprint**.
3. Selectionne ton repository.
4. Lance le deploiement.

Une fois deploye, Render te donne une URL publique (ex: `https://ton-app.onrender.com`) qui reste disponible meme quand ton PC est eteint.

### Option B (Web Service manuel)

1. **New +** -> **Web Service**
2. Runtime: **Node**
3. Build Command: `npm install`
4. Start Command: `npm start`

## API

- `GET /api/health` -> verification de l'etat du service

## Limites Et Compromis

- Upload autorise pour `audio/*` et `video/*`
- Le modele Whisper se telecharge au premier usage
- La premiere transcription est plus lente que les suivantes
- Le modele `whisper-tiny` est leger et economique, mais moins precis qu'une API premium
- Les performances dependent du navigateur et de la machine du visiteur
- Certains codecs video/audio exotiques peuvent ne pas etre decodables par le navigateur