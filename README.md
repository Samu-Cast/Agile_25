# BrewHub - Piattaforma Social per il Caffè Artigianale

**Descrizione**  
BrewHub è una piattaforma social dedicata alla community del caffè artigianale, sviluppata come progetto accademico seguendo la metodologia **Agile/Scrum** per il corso Agile 25/26. L'applicazione consente a tre tipologie di utenti — appassionati di caffè, baristi professionisti (inclusi bar con baristi associati) e torrefazioni — di connettersi, condividere esperienze, recensire prodotti e scoprire nuove miscele. L'obiettivo è creare un ecosistema digitale dove la passione per il caffè incontra la tecnologia.

---

## Funzionalità Principali

- **Autenticazione e Gestione Utenti**:
    - Registrazione e login sicuri tramite Firebase Authentication.
    - Profili utente personalizzati con ruoli distinti (Appassionato, Barista, Torrefazione).
    - Gestione delle impostazioni account e preferenze personali.

- **Sistema Social**:
    - Creazione e pubblicazione di post con testo e immagini.
    - Sistema di commenti per interagire con i contenuti.
    - Follow/Unfollow per seguire altri utenti e rimanere aggiornati.
    - Feed personalizzato con le attività dei profili seguiti.

- **Valutazioni e Recensioni**:
    - Sistema di voto per il post (upvote/downvote).
    - Recensioni testuali dettagliate.
    - Confronto tra diverse miscele di caffè.

- **Collezioni Prodotti**:
    - Creazione di collezioni personalizzate ("provati", "da provare").
    - Esplorazione delle collezioni di altri utenti.
    - Sistema di ricerca con filtri per categoria.

- **Upload Media**:
    - Caricamento immagini tramite Firebase Storage.
    - Supporto per contenuti multimediali nei post.

---

## Tecnologie Utilizzate

- **Frontend**:
    - React.js per l'interfaccia utente
    - React Router per la navigazione
    - Context API per la gestione dello stato globale
    - CSS Modules per lo styling

- **Backend**:
    - Node.js con Express.js come framework server
    - Architettura REST API
    - Middleware per autenticazione e validazione

- **Database e Servizi Cloud**:
    - Firebase Firestore (database NoSQL)
    - Firebase Authentication (gestione utenti)
    - Firebase Storage (archiviazione media)
    - Firebase Hosting (deploy frontend)

- **Testing**:
    - Jest per unit testing
    - React Testing Library per component testing

- **CI/CD**:
    - GitHub Actions per continuous integration

---

## Struttura del Progetto

```
Agile_25/
├── .github/workflows/     # Workflow GitHub Actions per testing
├── docs/                  # Documentazione Agile e di progetto
├── firebase/              # Configurazione Firebase (rules, hosting)
├── social-backend/        # Backend Node.js + Express
│   ├── src/
│   │   ├── config/        # Configurazioni (Firebase, env)
│   │   ├── routes/        # API endpoints
│   └── tests/             # Unit ed Integration tests backend
├── social-frontend/       # Frontend React
│   ├── src/
│   │   ├── components/    # Componenti riutilizzabili
│   │   ├── pages/         # Pagine dell'applicazione
│   │   ├── context/       # React Context providers
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── styles/        # Global styles
│   │   └── tests/         # Unit ed Integration tests frontend
│   └── public/            # Asset statici
└── README.md              # Questo file
```

---

## Prerequisiti

Prima di iniziare, assicurati di avere installato:

- **Node.js** versione 18 o superiore
- **npm** versione 9 o superiore
- **Firebase CLI** (`npm install -g firebase-tools`)
- Un account Firebase con un progetto configurato

---

## Installazione

1. **Clona il repository**:
   ```bash
   git clone <repo-url>
   cd Agile_25
   ```

2. **Installa le dipendenze del backend**:
   ```bash
   cd social-backend
   npm install
   ```

3. **Installa le dipendenze del frontend**:
   ```bash
   cd ../social-frontend
   npm install
   ```

4. **Configura le variabili d'ambiente**:

   Crea il file `.env` in `social-backend/`:
   ```env
   PORT=3001
   FIREBASE_PROJECT_ID=brewhub-bd760
   ```

   Crea il file `.env` in `social-frontend/`:
   ```env
   REACT_APP_API_URL=http://localhost:3001/api
   ```

5. **Configura Firebase**:
   - Scarica il file `firebase-key.json` dalla console Firebase
   - Posizionalo in `social-backend/src/config/`

---

## Avvio dell'Applicazione

**Backend** (Terminal 1):
```bash
cd social-backend
npm start
# Server disponibile su http://localhost:3001
```

**Frontend** (Terminal 2):
```bash
cd social-frontend
npm start
# Applicazione disponibile su http://localhost:3000
```

---

## Testing

**Esecuzione test backend**:
```bash
cd social-backend
npm test                    # Esegue tutti i test
npm test -- --coverage      # Con report coverage
```

**Esecuzione test frontend**:
```bash
cd social-frontend
npm test                    # Modalità interattiva
npm test -- --watchAll=false # Esecuzione singola
```


## Team di Sviluppo

**Progetto Agile 25/26**

- Samuele Castellani
- Gianrico Fornari
- Matteo Cardarelli
- Roberto Ringoli


