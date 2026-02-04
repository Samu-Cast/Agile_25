# Sprint 3 - Review

**Data Sprint**: 13 Dicembre 2025 - 8 Gennaio 2026  
**Durata**: ~4 settimane (include pausa festiva)  
**Partecipanti**: Tutti

---

## Sprint Goal

**Obiettivo**: Migliorare la user experience con: recensioni, collezioni e interazioni avanzate

**Obiettivo raggiunto?**: Si (91.80%)

**Motivazione**: Quasi tutte le User Stories pianificate sono state completate. L'unica US non completata (US28 - Cercare/filtrare collezioni) è stata rimandata per mancanza di tempo.

---

## User Stories Completate

### US04 - Storico recensioni e contributi
- **Effort**: 4 SP
- **Status**: Completata
- **Demo**: Sezione dedicata nel profilo per visualizzare lo storico delle proprie recensioni, con possibilità di eliminarle.
- **Note**: Implementata anche la visualizzazione dei contributi (post, commenti).

### US21 - Messaggi diretti tra utenti
- **Effort**: 6 SP
- **Status**: Completata
- **Demo**: Icona chat nell'header, popup per messaggiare, ricerca utenti direttamente dal popup.
- **Note**: Chat persistente con aggiornamento real-time.

### US22 - Tagging nei post
- **Effort**: 4 SP
- **Status**: Completata
- **Demo**: Possibilità di taggare altri utenti nei post, recensioni e confronti.
- **Note**: Tag visualizzati come badge cliccabili che portano al profilo.

### US23 - Recensioni con punteggio (1-5 tazzine)
- **Effort**: 6 SP
- **Status**: Completata
- **Demo**: Sezione dedicata per la creazione nel tasto "Create", votazione prodotto con sistema tazzine, inclusione foto/video.
- **Note**: Implementato `CoffeeCupRating` component con supporto mezze tazzine.

### US24 - Dati tecnici preparazione
- **Effort**: 3 SP
- **Status**: Completata
- **Demo**: Form per inserire parametri di preparazione caffè.
- **Note**: Inclusi temperatura, umidità, pressione.

### US25 - Risposta alle recensioni
- **Effort**: 3 SP
- **Status**: Completata
- **Demo**: Visualizzazione recensioni in feed e community, possibilità di rispondere.
- **Note**: Integrato nel sistema commenti esistente.

### US26 - Seguire recensioni
- **Effort**: 3 SP
- **Status**: Completata
- **Demo**: Sistema per seguire/salvare recensioni di altri utenti.

### US27 - Creare collezioni personali
- **Effort**: 9 SP
- **Status**: Completata
- **Demo**: Creazione e gestione collezioni nel proprio profilo.
- **Note**: Implementato `CollectionManager` component.

### US29 - Confronto miscele
- **Effort**: 8 SP
- **Status**: Completata
- **Demo**: Sezione confronto nel tasto "Create", possibilità di caricare foto e specifiche delle miscele.
- **Note**: Modalità "Comparison" con supporto User vs User.

### US30 - Collezioni aziendali (Torrefazioni)
- **Effort**: 6 SP
- **Status**: Completata
- **Demo**: Le torrefazioni possono creare e gestire collezioni, visibili nei profili di altre torrefazioni.
- **Note**: CRUD completo per collezioni aziendali.

### US51 - Ricerca per nome e città
- **Effort**: 4 SP
- **Status**: Completata
- **Demo**: Ricerca di luoghi e nomi nella barra di ricerca.
- **Note**: Estesa a tutte le categorie (Appassionato, Barista, Torrefazione).

---

## User Stories Non Completate

### US28 - Cercare o filtrare collezioni
- **Effort**: 5 SP
- **Status**: Non completata
- **Motivazione**: Mancanza di tempo, priorità inferiore rispetto alle altre US.
- **Azione**: Valutare per Sprint futuro.

---

## Metriche Sprint

- **Story Points pianificati**: 61
- **Story Points completati**: 56
- **Percentuale completamento**: 91.80%
- **User Stories completate**: 11/12

---

## Problemi Riscontrati

### Tecnici
1. **Complessità Collezioni**: La gestione delle collezioni aziendali ha richiesto più logica del previsto per gestire permessi e visibilità.
2. **Sistema Chat**: L'implementazione del sistema di messaggistica diretta ha richiesto attenzione per la gestione dello stato real-time.

### Organizzativi
1. **Pausa Festiva**: Lo sprint ha coperto il periodo natalizio, riducendo la disponibilità effettiva del team.

---

## Azioni per Sprint Futuro

1. Completare US28 (ricerca/filtro collezioni).
2. Migliorare test coverage frontend.
3. Ottimizzare performance caricamento feed.

---

## Note Aggiuntive

- Nuova UI per la creazione post implementata e ben accolta.
- Sistema recensioni completo e funzionale.
- Documentazione tecnica massicciamente aggiornata (API, Components, Services, Testing).
- Test unitari frontend aggiunti per i componenti principali.
