# WAZE AFRICA - Élite du Mapane 🌍

Application Flask professionnelle pour le chat vidéo et texte aléatoire (type Omegle) avec Firebase comme backend.

## 📋 Sommaire

- [Caractéristiques](#caractéristiques)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement](#lancement)
- [API Endpoints](#api-endpoints)
- [Structure du Projet](#structure-du-projet)

## ✨ Caractéristiques

- 🔐 Authentification Firebase (Email/Password)
- 📹 Chat vidéo avec WebRTC (H.264 optimisé iOS/Android)
- 💬 Chat texte en temps réel
- 🎯 Matching aléatoire d'utilisateurs
- 📊 Compteur d'utilisateurs en ligne
- 🌍 Support multi-pays africains
- ⚡ Real-time avec Firebase Firestore
- 📱 Interface mobile responsive

## 🏗️ Architecture

### Backend
- **Flask 3.0+** - Framework web Python
- **Firebase Admin SDK** - Backend services (Auth, Firestore)
- **Jinja2** - Templates HTML

### Frontend
- **JavaScript Vanilla** - Framework-agnostic
- **Firebase JS SDK** - Real-time et Auth côté client
- **WebRTC** - Appels vidéo P2P

### Design Pattern
- MVC (Model-View-Controller)
- Services Layer
- Blueprint pattern pour les routes
- Decorators pour la sécurité

## 🚀 Installation

### Prérequis

- Python 3.11 ou supérieur
- Virtualenv
- Compte Firebase

### Étapes d'installation

1. **Cloner le repository**

```bash
git clone <repository-url>
cd Waze
```

2. **Créer l'environnement virtuel**

```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

3. **Installer les dépendances**

```bash
pip install -r requirements.txt
```

4. **Configuration Firebase**

#### Option A: Fichier de credentials (Recommandé)

1. Télécharger le fichier JSON depuis la console Firebase (Project Settings > Service Accounts)
2. Nommer le fichier `firebase-credentials.json`
3. Placer le fichier à la racine du projet

#### Option B: Variables d'environnement

```bash
export FIREBASE_PROJECT_ID="votre-project-id"
export FIREBASE_CLIENT_EMAIL="votre-email-service-account"
export FIREBASE_PRIVATE_KEY="votre-clé-privée"
```

5. **Créer le fichier .env**

```bash
cp .env.example .env
```

6. **Configurer le fichier .env**

```env
SECRET_KEY=votre-cle-secrete-flask
DEBUG=True
HOST=0.0.0.0
PORT=5000

# Firebase Configuration (Admin SDK)
FIREBASE_PROJECT_ID=waze-5644b

# Firebase Configuration (Frontend)
FIREBASE_API_KEY=votre-api-key
FIREBASE_AUTH_DOMAIN=votre-auth-domain
FIREBASE_PROJECT_ID=votre-project-id
FIREBASE_STORAGE_BUCKET=votre-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=votre-sender-id
FIREBASE_APP_ID=votre-app-id
```

## ⚙️ Configuration

### Firebase Setup

1. Créer un projet Firebase: https://console.firebase.google.com/
2. Activer Authentication (Email/Password)
3. Créer une base Firestore
4. Configurer les règles Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /calls/{callId} {
      allow read, write: if request.auth != null;
    }
    match /calls/{callId}/messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚦 Lancement

### Développement

```bash
source venv/bin/activate
python app.py
```

L'application sera accessible sur: http://localhost:5000

### Production

```bash
export DEBUG=False
python app.py
```

Ou avec Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📡 API Endpoints

### Authentification

#### `GET /`
Redirection selon l'état d'authentification

#### `GET /login`
Page de connexion

#### `POST /login`
Connexion utilisateur (Firebase Auth)

#### `GET /signup`
Page d'inscription

#### `POST /signup`
Inscription utilisateur (Firebase Auth)

#### `GET /logout`
Déconnexion

### Application

#### `GET /selection`
Sélection du mode (vidéo/texte)

#### `GET /video`
Mode vidéo

#### `GET /chat`
Mode chat texte

### API REST

#### `GET /api/health`
Vérifier la santé de l'API

**Response:**
```json
{
  "status": "healthy",
  "message": "Waze Africa API is running"
}
```

#### `GET /api/online-count`
Nombre d'utilisateurs en ligne

**Response:**
```json
{
  "count": 42
}
```

#### `GET /api/user/<uid>`
Informations utilisateur

**Headers:** `Content-Type: application/json`

**Response:**
```json
{
  "status": "success",
  "data": {
    "uid": "...",
    "name": "...",
    "country": "...",
    "isOnline": true,
    "currentMode": "video"
  }
}
```

#### `POST /api/match`
Trouver un partenaire

**Body:**
```json
{
  "mode": "video"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Match found",
  "partner_id": "...",
  "session_id": "sess_...",
  "partner_name": "...",
  "partner_country": "..."
}
```

#### `POST /api/next`
Changer de partenaire

**Body:**
```json
{
  "partner_id": "..."
}
```

#### `POST /api/message`
Envoyer un message

**Body:**
```json
{
  "session_id": "sess_...",
  "text": "Bonjour !"
}
```

#### `POST /api/typing`
Indicateur de frappe

**Body:**
```json
{
  "is_typing": true
}
```

#### `POST /api/call/offer`
Sauvegarder l'offre WebRTC

**Body:**
```json
{
  "session_id": "sess_...",
  "offer": {
    "type": "offer",
    "sdp": "..."
  }
}
```

#### `POST /api/call/answer`
Sauvegarder la réponse WebRTC

**Body:**
```json
{
  "session_id": "sess_...",
  "answer": {
    "type": "answer",
    "sdp": "..."
  }
}
```

#### `POST /api/call/candidate`
Sauvegarder un candidat ICE

**Body:**
```json
{
  "session_id": "sess_...",
  "type": "offer",
  "candidate": {
    "candidate": "...",
    "sdpMid": "...",
    "sdpMLineIndex": 0
  }
}
```

## 📂 Structure du Projet

```
waze/
├── app.py                          # Entry point Flask
├── config.py                       # Configuration application
├── requirements.txt                # Dépendances Python
├── .env                           # Variables d'environnement
├── .env.example                    # Template .env
├── .gitignore
├── firebase-credentials.json       # Credentials Firebase (non-commit)
├── README.md
├── MIGRATION_PLAN.md
│
├── templates/                     # Templates Jinja2
│   ├── base.html                  # Layout de base
│   ├── auth/
│   │   ├── login.html             # Page login
│   │   └── signup.html            # Page inscription
│   ├── selection.html             # Sélection mode
│   └── main/
│       └── main.html              # Interface principale
│
├── static/                        # Fichiers statiques
│   ├── css/
│   │   └── style.css              # Styles CSS
│   ├── js/
│   │   ├── app.js                 # JS principal
│   │   ├── auth.js                # JS authentification
│   │   ├── video.js               # JS WebRTC
│   │   └── chat.js                # JS chat
│   └── img/
│
├── routes/                        # Routes Flask (Blueprints)
│   ├── __init__.py
│   ├── auth.py                   # Routes authentification
│   ├── main.py                   # Routes principales
│   └── api.py                    # API REST endpoints
│
├── services/                      # Business Logic
│   ├── __init__.py
│   ├── firebase_service.py       # Wrapper Firebase
│   ├── matching_service.py       # Logique matching
│   ├── chat_service.py           # Logique chat
│   └── webrtc_service.py         # Gestion WebRTC
│
└── utils/                         # Utilitaires
    ├── __init__.py
    ├── decorators.py             # Décorateurs custom
    └── validators.py             # Validation données
```

## 🔐 Sécurité

- Validation côté serveur pour toutes les entrées
- Rate limiting sur les endpoints API
- Décorateur `@auth_required` pour protéger les routes
- Sessions sécurisées avec Flask
- CORS configuré pour les requêtes frontend
- Firebase Rules pour sécuriser Firestore

## 🐛 Développement

### Mode Debug

```bash
export DEBUG=True
python app.py
```

### Logs

Les logs sont disponibles dans la console Flask.

### Tests

```bash
pytest tests/
```

## 📝 Notes de Développement

- Firebase est utilisé côté frontend pour l'authentification et le real-time
- Flask sert de couche applicative pour la validation et la business logic
- WebRTC utilise STUN + TURN pour la compatibilité mobile (iOS/Android)
- Le codec H.264 est forcé pour la compatibilité iPhone

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Auteurs

- **Waze Africa Team**

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.

---

**🌍 WAZE AFRICA - L'élite du Mapane Africain**
