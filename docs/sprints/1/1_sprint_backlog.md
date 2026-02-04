# Sprint 1 - Review

**Data Sprint**: 14 Novembre 2025 - 27 Novembre 2025  
**Durata**: 2 settimane  
**Partecipanti**: Tutti

---

## Sprint Goal

**Obiettivo**: Pagina principale per ogni categoria di utente e bozza feed

**Obiettivo raggiunto?**: Parzialmente (86.67%)

**Motivazione**: Tutte le funzionalità core sono state completate (autenticazione, profili, feed, post), ma il sistema follow/amicizia è stato solo parzialmente implementato a causa di sottostima dell'effort necessario.

---

## User Stories Completate

### US01 - Creazione profilo personale
- **Effort**: 7 SP
- **Status**: Completata
- **Demo**: Funzionalità di registrazione e creazione profilo per Appassionato, Barista, Torrefazione
- **Note**: Implementato con Firebase Auth e Firestore, inserito un rappresentate Bar per un insieme di baristi (forse da considerare l'inserimento di un nuovo attore del sistema)

### US02 - Creazione profilo bar
- **Effort**: 5 SP
- **Status**: Completata
- **Demo**: Profilo bar con gestione team baristi
- **Note**: Supporto per associare baristi al bar

### US03 - Modifica informazioni profilo bar
- **Effort**: 2 SP
- **Status**: Completata
- **Demo**: Form di modifica profilo bar
- **Note**: Update in tempo reale su Firestore e da verificare necessita refresh pagina o meno per visualizzare moidifiche 

### US05 - Creazione profilo aziendale
- **Effort**: 4 SP
- **Status**: Completata
- **Demo**: Profilo torrefazione 
- **Note**: Gestione permessi team 

### US15 - Visualizzazione home feed
- **Effort**: 6 SP
- **Status**: Completata
- **Demo**: Feed con post degli utenti seguiti
- **Note**: Implementato con sistema di voti

### US18 - Sistema follow/amicizia
- **Effort**: 6 SP
- **Status**: Parzialmente completata (1/6)
- **Demo**: Struttura base, ma non implementata
- **Note**: Sottostimato effort necessario, richiede transazioni Firestore

### US48 - Login e logout
- **Effort**: 2 SP
- **Status**: Completata
- **Demo**: Autenticazione Firebase funzionante
- **Note**: Gestione sessione con AuthContext

### US49 - Recupero password
- **Effort**: 9 SP
- **Status**: Completata
- **Demo**: Email recupero password via Firebase
- **Note**: Funzionalità completa e testata manualmente

### US55 - Creazione post
- **Effort**: 3 SP
- **Status**: Completata
- **Demo**: Form creazione post con testo e immagini
- **Note**: Upload immagini su Firebase Storage

---

## Metriche Sprint

- **Story Points pianificati**: 45
- **Story Points completati**: 39
- **Percentuale completamento**: 86.67%
- **User Stories completate**: 8/9

---

## Problemi Riscontrati

### Tecnici
1. **US18 - Sistema follow/amicizia**: 
   - Sottostimato effort necessario
   - Complessità transazioni Firestore non considerata in fase di planning
   - Necessarie operazioni atomiche per followers/following e contatori
   
2. **Testing**: 
   - Nessun test automatico implementato
   - Testing solo manuale e non sistematico

3. **Performance**: 
   - Upload immagini su Firebase Storage può essere lento da copnsiderare ottimizzazione
   - Nessuna ottimizzazione immagini implementata

### Organizzativi
1. **Stime effort**: Quasi accurata, da prestare attenzione a sottostime (US18)
2. **Definition of Done**: Test manuali -> ASSOLUTAMENTE da implementare automatici prossimo sprint
3. **Code review**: Creazioe di branch divisi tra componenti del team, merge su preRelease dove si risolvevano i conflitti e si revisionava il codice di tutti, una volta revisionato si pusha su main

---

## Azioni per Sprint 2

1. Completare US18 (sistema follow/amicizia)
2. Scegliere con cura le US in base alle stime effort
3. Aggiungere test automatici

---

## Note Aggiuntive

- Architettura base solida e scalabile
- Firebase ben integrato
- Team ha acquisito familiarità con tecnologia e ambiente nuovo