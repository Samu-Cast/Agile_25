# Sprint 2 - Review

**Data Sprint**: 28 Novembre 2025 - 12 Dicembre 2025  
**Durata**: 2 settimane  
**Partecipanti**: tutti

---

## Sprint Goal

**Obiettivo**: Raffinate interazioni post e test

**Obiettivo raggiunto?**: Si (100%)

**Motivazione**: Tutte le User Stories pianificate sono state completate, inclusa la gestione del sistema di follow (US18) e le interazioni sui post.

---

## User Stories Completate

### US18 - Sistema follow/amicizia
- **Effort**: 6 SP
- **Status**: Completata (parte restante da Sprint 1)
- **Demo**: Funzionamento follow/unfollow con aggiornamento contatori in tempo reale gestito da transazioni Firestore.
- **Note**: Superate le difficoltà riscontrate nello Sprint 1.

### US07 - Visualizzare informazioni aziendali
- **Effort**: 3 SP
- **Status**: Completata
- **Demo**: Sezione dedicata nel profilo per le informazioni aziendali (Torrefazione).
- **Note**: Dati caricati da DB e visualizzati correttamente.

### US17 - Visualizzare sezione personali
- **Effort**: 13 SP
- **Status**: Completata
- **Demo**: Dashboard utente con sezioni personalizzate.
- **Note**: Implementazione complessa ma completata.

### US19 - Interagire con post (like, commenti)
- **Effort**: 4 SP
- **Status**: Completata
- **Demo**: Aggiunta/rimozione like e inserimento commenti sui post.
- **Note**: Feedback visivo immediato per l'utente anche con colore, riscontrato problema con dislike e voto in negativo (risolto).

### US20 - Thread commenti con risposte
- **Effort**: 4 SP
- **Status**: Completata
- **Demo**: Possibilità di rispondere a un commento creando una discussione nidificata.

### US37 - Aggiungere descrizioni dettagliate ai prodotti
- **Effort**: 5 SP
- **Status**: Completata
- **Demo**: Form per arricchire i prodotti con descrizioni lunghe.

### US50 - Cercare utenti per nome/nickname
- **Effort**: 4 SP
- **Status**: Completata
- **Demo**: Barra di ricerca funzionante con filtro per nome o nickname.
- **Note**: Ricerca case-insensitive implementata.

---

## Metriche Sprint

- **Story Points pianificati**: 39
- **Story Points completati**: 39
- **Percentuale completamento**: 100%
- **User Stories completate**: 7/7

---

## Problemi Riscontrati

### Tecnici
1. **Complessità US17**: La dashboard personale ha richiesto più lavoro del previsto per integrare tutti i dati. Essendo molte informazioni la classe relativa del profilo è diventata molto complessa e difficile da gestire, da valutare una possibile semplificazione.
2. **Setup Test**: L'integrazione iniziale dei test (parte del Goal) ha richiesto tempo di configurazione dell'ambiente eed apprendimento di un nuovo framework di test.

### Organizzativi
1. **Merge Conflicts**: Qualche conflitto di troppo durante l'integrazione delle feature di interazione (US19, US20) risolta con i merge di base.

---

## Azioni per Sprint 3

1. Iniziare lo sviluppo delle funzionalità di Recensione.
2. Implementare il sistema di Collezioni.
3. Consolidare la suite di test.

---

## Note Aggiuntive

- Il team ha recuperato perfettamente il ritardo dello Sprint 1.
- La qualità del codice è migliorata grazie alle review più attente.
- Il sistema di interazioni (social) è ora solido.
