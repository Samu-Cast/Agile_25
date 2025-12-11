# Increment

## Definizione

L'**Increment** è la somma di tutti i Product Backlog Items completati durante uno Sprint e il valore degli incrementi di tutti gli Sprint precedenti. Alla fine di uno Sprint, il nuovo Increment deve essere "Done", il che significa che deve soddisfare la Definition of Done del team Scrum e deve essere in uno stato utilizzabile.

---

## Definition of Done (DoD)

Per essere considerato "Done", un Increment deve soddisfare tutti i seguenti criteri:

### Code Quality
- Il codice è stato scritto seguendo le convenzioni del progetto
- Il codice è stato revisionato da almeno un altro membro del team (Code Review)
- Non ci sono conflitti di merge irrisolti
- Non ci sono warning 

### Testing
- Tutti i test unitari esistenti passano
- Nuovi test unitari sono stati scritti per le nuove funzionalità
- Code coverage minimo del 70% per il codice modificato
- Test di integrazione passano (dove applicabile)
- Test manuali completati e documentati

### Documentation
- Il codice è commentato dove necessario
- La documentazione tecnica è aggiornata
- Il README è aggiornato (se necessario)
- Le API sono documentate (se applicabile)

### Quality Assurance
- La funzionalità è stata testata in ambiente locale
- Non ci sono bug critici o bloccanti aperti
- La User Story soddisfa i criteri di accettazione definiti

### Deployment
- Il codice è stato mergiato nel branch principale (main)
- La build di CI/CD passa correttamente
- La funzionalità è stata deployata in ambiente di staging/test
- Non ci sono regressioni rilevate

---

## Log degli Incrementi

### Sprint 1
**Data inizio**: 14 Novembre 2025  
**Data fine**: 27 Novembre 2025  
**Status**: Done

**Sprint Goal**: Pagina principale per ogni categoria di utente e bozza feed

**User Stories completate**:
- US01: Creazione profilo personale (Effort: 7) -> 7/7
- US02: Creazione profilo bar (Effort: 5) -> 5/5
- US03: Modifica informazioni profilo bar (Effort: 2) -> 2/2
- US05: Creazione profilo aziendale (Effort: 4) -> 4/4
- US15: Visualizzazione home feed (Effort: 6) -> 6/6
- US18: Sistema follow/amicizia (Effort: 6) -> 1/6
- US48: Login e logout (Effort: 2) -> 2/2
- US49: Recupero password (Effort: 9) -> 9/9
- US55: Creazione post (Effort: 3) -> 3/3

**Story Points completati**: 39/45 (86.67%)

**Descrizione**:
Setup iniziale del progetto con implementazione completa delle funzionalità base. Tutti e tre i tipi di profilo (Appassionato, Barista, Torrefazione) sono stati implementati con successo. Il sistema di autenticazione Firebase è completamente funzionante, incluso il recupero password. Il feed principale mostra i post degli utenti, ma non è stato possibile implementare il sistema di follow/unfollow (sottostima dell'effort necessario).

**Funzionalità implementate**:
- **Autenticazione**: Login, logout, registrazione, recupero password via email
- **Profili utente**: Creazione e modifica profili per Appassionato, Barista (con gestione team), Torrefazione (con gestione staff)
- **Sistema social**: Follow/unfollow utenti, visualizzazione follower/following
- **Post**: Creazione post con testo e immagini, visualizzazione feed
- **Backend API**: 8 route implementate (users, posts, comments, bars, roasters, search, upload, user)
- **Frontend**: 7 pagine (Home, Profile, CreatePost, Login, Register, ForgotPassword, PostDetails)

**Note incrementate**:
- Architettura base del progetto definita (React + Express + Firebase)
- Sistema di autenticazione funzionante con Firebase Auth
- Profili utente implementati con upload immagini su Firebase Storage
- Feed base con visualizzazione post e sistema di voti (upvote/downvote)
- Sistema follow/amicizia con subcollections Firestore

---

### Sprint 2
**Data inizio**: 28 Novembre 2025  
**Data fine**: 12 Dicembre 2025 
**Status**: Done

**Sprint Goal**: Raffinate interazioni post e test

**User Stories completate**:
- US07: Visualizzare informazioni aziendali (Effort: 3) -> 3/3
- US17: Visualizzare sezione trend personali (Effort: 13) -> 13/13
- US18: Sistema follow/amicizia (Effort: 6) -> 6/6 (completata la parte rimanente 5/6)
- US19: Interagire con post (like, commenti) (Effort: 4) -> 4/4
- US20: Thread commenti con risposte (Effort: 4) -> 4/4
- US37: Aggiungere descrizioni dettagliate ai prodotti (Effort: 5) -> 5/5
- US50: Cercare utenti per nome/nickname (Effort: 4) -> 4/4

**Story Points completati**: 39/39 (100%)

**Descrizione**:
Completamento del sistema social con implementazione delle funzionalità di interazione. Il sistema follow/unfollow è stato completato con gestione transazionale in Firestore. Implementato il sistema di voti (upvote/downvote) sui post e il sistema di commenti con supporto per thread (risposte ai commenti). Aggiunta la funzionalità di ricerca utenti, bar e torrefazioni con filtri per ruolo.

**Funzionalità implementate**:
- **Sistema follow completo**: Follow/unfollow con transazioni Firestore, contatori followers/following, subcollections
- **Interazioni post**: Sistema voti (upvote/downvote), salvataggio post, conteggio interazioni
- **Commenti**: Creazione commenti, thread con risposte (parentComment), visualizzazione gerarchica
- **Ricerca**: Ricerca utenti per nome/nickname/email, ricerca bar e torrefazioni per nome/città
- **Backend**: Route dedicate per bars.js, roasters.js, search.js
- **Frontend**: PostCard con commenti espandibili, CommentSection component
**Note incrementate**:

**Note incrementate**:
- Interazioni raffinate (voti, commenti, salvataggio, upvote/downvote)
- Ricerca utenti con case-insensitive
- Transazioni Firestore per garantire consistenza follow/unfollow

---

### Sprint 3
**Data inizio**: 13 Dicembre 2025  
**Data fine**: 8 Gennaio 2026 
**Status**: TBD

**Sprint Goal**:
- TBD 

**User Stories pianificate**:
- 23
- 51

**Story Points pianificati**: TBD

**Descrizione**:
TBD

**Funzionalità implementate**:
- TBD

**Note incrementate**:
- TBD
