# ☕ BrewHub - Piattaforma Social per il Caffè Artigianale

<div align="center">

![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)
![React](https://img.shields.io/badge/Frontend-React%2018-61dafb)
![Node.js](https://img.shields.io/badge/Backend-Node.js%2018-339933)
![Firebase](https://img.shields.io/badge/Cloud-Firebase-FFCA28)
![Agile](https://img.shields.io/badge/Methodology-Agile%2FScrum-brightgreen)

**Progetto Accademico - Agile 25/26**

</div>

---

## 📖 Descrizione

**BrewHub** è una piattaforma social dedicata alla community del caffè artigianale, sviluppata seguendo la metodologia **Agile/Scrum**. L'applicazione consente a tre tipologie di utenti di connettersi e interagire:

| Ruolo | Descrizione |
|-------|-------------|
| ☕ **Appassionato** | Amante del caffè che recensisce, scopre nuove miscele e segue esperti |
| 👨‍🍳 **Barista** | Professionista con profilo bar e gestione team di baristi associati |
| 🏭 **Torrefazione** | Azienda produttrice con profilo aziendale e catalogo prodotti |

---

## ✨ Funzionalità Principali

### 🔐 Autenticazione e Gestione Utenti
- Registrazione e login sicuri tramite **Firebase Authentication**
- Recupero password via email
- Profili utente personalizzati con ruoli distinti
- Gestione team (Barista) e staff (Torrefazione)

### 📱 Sistema Social
- Creazione e pubblicazione di post con testo e immagini
- Sistema di **upvote/downvote** per i post
- **Commenti con thread** (risposte ai commenti)
- **Follow/Unfollow** con contatori e subcollections Firestore
- Feed personalizzato con le attività dei profili seguiti
- **Tagging** utenti nei post
- **Messaggi diretti** tra utenti

### ⭐ Recensioni e Valutazioni
- Sistema di **punteggio tazzine** (1-5)
- Recensioni testuali dettagliate con possibilità di risposta
- Inserimento **dati tecnici** sulla preparazione (temperatura, umidità, pressione)
- Storico recensioni e contributi per utente

### 📂 Collezioni Prodotti
- Creazione collezioni
- **Confronto** tra diverse miscele di caffè
- Ricerca e filtri per categoria e tag

### 🔍 Ricerca
- Ricerca utenti per nome, nickname o email
- Ricerca bar e torrefazioni per nome o città

---

## 🛠️ Tecnologie Utilizzate

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | React 18, React Router, Context API, CSS Modules |
| **Backend** | Node.js 18+, Express.js, REST API |
| **Database** | Firebase Firestore (NoSQL) |
| **Auth** | Firebase Authentication |
| **Storage** | Firebase Storage (media) |
| **Hosting** | Firebase Hosting |
| **Testing** | Jest 30, React Testing Library |
| **CI/CD** | GitHub Actions |

---

## 📁 Struttura del Progetto

```
Agile_25/
├── .github/workflows/          # CI/CD Pipelines
│   ├── ci.yml                  # Continuous Integration (tests)
│   └── cd.yml                  # Continuous Deployment
├── docs/                       # Documentazione Agile
│   ├── product_backlog.md      # 55 User Stories (356 SP)
│   ├── increment.md            # Log incrementi Sprint
│   └── sprints/                # Sprint Planning e Retrospettive
├── firebase/                   # Configurazione Firebase (rules, hosting)
├── social-backend/             # Backend Node.js + Express
│   ├── src/
│   │   ├── config/             # Configurazioni (Firebase, env)
│   │   └── routes/             # API endpoints (8 route)
│   ├── functions/              # Firebase Cloud Functions
│   └── API_DOCUMENTATION.md    # Documentazione API REST
├── social-frontend/            # Frontend React
│   ├── src/
│   │   ├── components/         # 14+ componenti riutilizzabili
│   │   ├── pages/              # 9 pagine dell'applicazione
│   │   ├── context/            # React Context providers (Auth)
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # 7 API services
│   │   ├── styles/             # 20 file CSS Modules
│   │   └── test/               # Unit e Integration tests
│   └── public/                 # Asset statici
└── README.md
```

---

## 🚀 Getting Started

### Prerequisiti

- **Node.js** versione 18 o superiore
- **npm** versione 9 o superiore
- **Firebase CLI** (`npm install -g firebase-tools`)
- Account Firebase con progetto configurato

### Installazione

1. **Clona il repository**
   ```bash
   git clone <repo-url>
   cd Agile_25
   ```

2. **Installa le dipendenze del backend**
   ```bash
   cd social-backend
   npm install
   ```

3. **Installa le dipendenze del frontend**
   ```bash
   cd ../social-frontend
   npm install
   ```

4. **Configura le variabili d'ambiente**

   Crea `.env` in `social-backend/`:
   ```env
   PORT=3001
   FIREBASE_PROJECT_ID=brewhub-bd760
   ```

   Crea `.env` in `social-frontend/`:
   ```env
   REACT_APP_API_URL=http://localhost:3001/api
   ```

5. **Configura Firebase**
   - Scarica `firebase-key.json` dalla Console Firebase
   - Posizionalo in `social-backend/src/config/`

---

## ▶️ Avvio dell'Applicazione

**Backend** (Terminal 1):
```bash
cd social-backend
npm start
# Server su http://localhost:3001
```

**Frontend** (Terminal 2):
```bash
cd social-frontend
npm start
# App su http://localhost:3000
```

---

## 🧪 Testing

**Backend**:
```bash
cd social-backend
npm test                    # Esegue tutti i test
npm test -- --coverage      # Con report coverage
```

**Frontend**:
```bash
cd social-frontend
npm test                    # Modalità interattiva
npm test -- --watchAll=false --coverage  # Esecuzione singola con coverage
```

---

## 📚 Documentazione

| Documento | Descrizione |
|-----------|-------------|
| [Product Backlog](docs/product_backlog.md) | 55 User Stories organizzate per Epic |
| [Increment Log](docs/increment.md) | Storico incrementi e Definition of Done |
| [Sprint Planning](docs/sprints/) | Pianificazione e retrospettive |

---

## 👥 Team di Sviluppo

**Progetto Agile 25/26**

| Nome | Ruolo |
|------|-------|
| Samuele Castellani | Developer |
| Gianrico Fornari | Developer |
| Matteo Cardarelli | Developer |
| Roberto Ringoli | Developer |

---

## 📄 License

Progetto accademico - Università degli Studi

---

<div align="center">

Made with ☕ and ❤️ by the BrewHub Team

</div>
