# Sprint 2 - Review

**Data Sprint**: 28 Novembre 2025 - 12 Dicembre 2025  
**Durata**: 2 settimane  
**Partecipanti**: tutti

---

## Sprint Goal

**Obiettivo**: Test, CI/CD e realizzazione di US fondamentali

**Obiettivo raggiunto?**: Si (100%)

**Motivazione**: Tutte le User Stories pianificate sono state completate. Implementata la pipeline CI/CD con GitHub Actions e aggiunti test unitari per frontend e backend.

---

## User Stories Completate

### US18 - Seguire altri utenti
- **Epica**: Gestione interazioni social
- **Effort**: 6 SP
- **Status**: Completata (parte restante da Sprint 1)
- **Demo**: Funzionamento follow/unfollow con aggiornamento contatori in tempo reale gestito da transazioni Firestore.
- **Tasks**: 
  - Iniziare a seguire utenti
  - Vedere quanti utenti seguo
  - Vedere quanti follower ho
- **Note**: Superate le difficoltà riscontrate nello Sprint 1.

### US50 - Cercare utenti per nome/nickname
- **Epica**: Gestione interazioni social
- **Effort**: 4 SP
- **Status**: Completata
- **Demo**: Barra di ricerca funzionante con filtro per nome o nickname.
- **Tasks**:
  - Implementare searchbar
  - Effettuare ricerca tra utenti
  - Mostrare risultati affini
- **Note**: Ricerca case-insensitive implementata.

### US05 - Profilo aziendale Torrefazione
- **Epica**: Gestione Profilo e Team
- **Effort**: 4 SP
- **Status**: Completata
- **Demo**: Pagina profilo Torrefazione con informazioni aziendali.
- **Tasks**:
  - Poter avere una pagina profilo della Torrefazione
  - Creazione nuovo profilo Torrefazione
  - Poter mostrare informazioni relative all'azienda

### US37 - Caricare prodotti con media e descrizioni
- **Epica**: Strumenti Aziendali e Marketing
- **Effort**: 5 SP
- **Status**: Completata
- **Demo**: Sezione "Prodotti" nel profilo aziendale con upload media e descrizioni.
- **Tasks**:
  - Avere una sezione "Prodotti" nel profilo aziendale
  - Poter caricare nuovi prodotti
  - Mostrare i prodotti

### US15 - Home feed con post dei seguiti
- **Epica**: Bacheca (Feed)
- **Effort**: 6 SP
- **Status**: Completata
- **Demo**: Sezione home selezionabile dal feed con post degli utenti seguiti.
- **Tasks**:
  - Sezione home selezionabile dal feed

### US17 - Sezione Popular (più sezioni dedicate)
- **Epica**: Bacheca (Feed)
- **Effort**: 13 SP
- **Status**: Completata
- **Demo**: Sezione popular con post ordinati per numero di upvote.
- **Tasks**:
  - Sezione popular selezionabile dal feed
  - Ordine dei post per maggior numero di upvote

### US19 - Eliminare/gestire post
- **Epica**: Gestione post
- **Effort**: 4 SP
- **Status**: Completata
- **Demo**: Possibilità di eliminare i propri post con doppia conferma.
- **Tasks**:
  - Premere su un post nel profilo per eliminarlo
  - Doppia conferma per evitare errori

---

## Testing Implementato

### Frontend (social-frontend)
- **Framework**: Jest + React Testing Library
- **Copertura**: Test per rendering corretto e comportamento componenti React

### Backend (social-backend)
- **Framework**: Jest con mock di Firebase
- **Copertura**: Test isolati per API endpoints senza dipendenze esterne

---

## CI/CD Implementata

### GitHub Actions Workflow
- **Trigger**: Push e Pull Request verso branch `main` e `preRelease`
- **Steps**:
  1. Checkout e setup del codice
  2. Installazione dipendenze backend e frontend
  3. Esecuzione test backend e frontend (`npm test`)
- **Beneficio**: Validazione automatica di ogni modifica prima del merge

---

## Metriche Sprint

- **Story Points pianificati**: 42
- **Story Points completati**: 42
- **Percentuale completamento**: 100%
- **User Stories completate**: 7/7

---

## Problemi Riscontrati

### Tecnici
1. **Setup Test**: L'integrazione iniziale dei test ha richiesto tempo per configurazione ambiente e apprendimento framework essendo un nuovo strumento.
2. **Mock Firebase**: Creazione mock per isolare i test backend dalle dipendenze esterne.

### Organizzativi
1. **Merge Conflicts**: Qualche conflitto durante l'integrazione delle feature, risolto con merge di base.

---

## Azioni per Sprint 3

1. Iniziare sviluppo funzionalità Recensioni.
2. Implementare sistema Collezioni.
3. Consolidare suite di test e aumentare coverage.

---

## Note Aggiuntive

- Il team ha recuperato perfettamente il ritardo dello Sprint 1.
- Pipeline CI/CD funzionante garantisce qualità del codice.
- Sistema social (follow, feed, ricerca) ora completo.
