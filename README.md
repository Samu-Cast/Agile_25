# BrewHub - Coffee Social Platform

> Piattaforma social dedicata alla community del caffè artigianale

[![Status](https://img.shields.io/badge/status-in%20development-yellow)](https://github.com)
[![License](https://img.shields.io/badge/license-Academic-blue)](LICENSE)

## 📋 Indice

- [Panoramica](#panoramica)
- [Caratteristiche](#caratteristiche)
- [Architettura](#architettura)
- [Quick Start](#quick-start)
- [Sviluppo](#sviluppo)
- [Testing](#testing)
- [Deployment](#deployment)
- [Team](#team)

## 🎯 Panoramica

BrewHub è una piattaforma social che connette tre tipologie di utenti:
- **Appassionati di caffè** - Condividono esperienze e recensioni
- **Baristi** - Professionisti del settore
- **Torrefazioni** - Produttori e distributori

Sviluppato seguendo la metodologia **Agile/Scrum** per il corso Agile 25/26.

## ✨ Caratteristiche

- 🔐 **Autenticazione** - Firebase Authentication
- 📝 **Post & Commenti** - Sistema social completo
- ⭐ **Valutazioni** - Rating a stelle per prodotti
- 👤 **Profili Utente** - Gestione profilo con ruoli
- 🖼️ **Upload Immagini** - Firebase Storage
- 🔍 **Ricerca** - Ricerca utenti e contenuti
- 📱 **Responsive** - Design mobile-first

## 🏗️ Architettura

```
Agile_25/
├── firebase/          # Configurazione Firebase unificata
├── BrewHub_Web/
│   ├── backend/       # Node.js + Express API
│   ├── frontend/      # React App
│   └── docs/          # Documentazione
```

Per dettagli completi vedi [STRUCTURE.md](./STRUCTURE.md)

## 🚀 Quick Start

### Prerequisiti

- Node.js 18+
- npm 9+
- Firebase CLI (`npm install -g firebase-tools`)
- Account Firebase

### Installazione

```bash
# Clone repository
git clone <repo-url>
cd Agile_25

# Installa dipendenze backend
cd BrewHub_Web/backend
npm install

# Installa dipendenze frontend
cd ../frontend
npm install
```

### Configurazione

1. **Backend**: Crea `.env` in `BrewHub_Web/backend/`
```env
PORT=3001
FIREBASE_PROJECT_ID=brewhub-bd760
```

2. **Frontend**: Crea `.env` in `BrewHub_Web/frontend/`
```env
REACT_APP_API_URL=http://localhost:3001/api
```

3. **Firebase**: Posiziona `firebase-key.json` in `BrewHub_Web/backend/src/config/`

### Avvio

```bash
# Terminal 1: Backend
cd BrewHub_Web/backend
npm start
# Server: http://localhost:3001

# Terminal 2: Frontend
cd BrewHub_Web/frontend
npm start
# App: http://localhost:3000
```

## 💻 Sviluppo

### Struttura Backend

```
backend/src/
├── config/         # Configurazioni (Firebase, etc)
├── controllers/    # Business logic
├── routes/         # API endpoints
├── services/       # Servizi esterni
├── models/         # Data models
├── middlewares/    # Auth, validation
└── utils/          # Helper functions
```

### Struttura Frontend

```
frontend/src/
├── components/     # Componenti riutilizzabili
├── pages/          # Pagine dell'app
├── context/        # React Context
├── hooks/          # Custom hooks
├── services/       # API services
├── types/          # Type definitions
└── styles/         # Global styles
```

### Comandi Utili

```bash
# Backend
npm run dev        # Development con nodemon
npm test           # Run tests
npm run lint       # Lint code

# Frontend
npm start          # Development server
npm test           # Run tests
npm run build      # Production build
```

## 🧪 Testing

### Backend Tests

```bash
cd BrewHub_Web/backend
npm test                    # Run all tests
npm test -- --coverage      # With coverage
npm test -- posts.test.js   # Specific file
```

### Frontend Tests

```bash
cd BrewHub_Web/frontend
npm test                    # Interactive mode
npm test -- --coverage      # With coverage
npm test -- --watchAll=false # Run once
```

## 🚢 Deployment

### Firebase Hosting (Frontend)

```bash
cd firebase
firebase login
firebase deploy --only hosting
```

### Firebase Functions (Backend)

```bash
cd firebase
firebase deploy --only functions
```

### Firestore Rules

```bash
cd firebase
firebase deploy --only firestore:rules
```

## 📚 Documentazione

- [STRUCTURE.md](./STRUCTURE.md) - Architettura dettagliata
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Guida contribuzione
- [docs/](./BrewHub_Web/docs/) - Documentazione Agile

## 👥 Team

**Progetto Agile 25/26**

- Sam Castellani - [@username](https://github.com/username)
- [Altri membri del team]

## 📄 License

Progetto accademico per il corso Agile 25/26

## 🔗 Links

- [Firebase Console](https://console.firebase.google.com/project/brewhub-bd760)
- [Notion Board](https://notion.so/...)
- [GitHub Issues](https://github.com/.../issues)

---

**Made with ☕ by Team BrewHub**
