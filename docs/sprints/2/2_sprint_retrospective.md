# Sprint 2 - Retrospective

**Data Sprint**: 28 Novembre 2025 - 12 Dicembre 2025  
**Data Retrospettiva**: 12 Dicembre 2025  
**Partecipanti**: Tutti

---

## Formato Retrospettiva

**Metodo utilizzato**: Start-Stop-Continue  
**Durata**: 1 ora

---

## Cosa ha funzionato bene (da mantenere alto in futuro)

### Tecnico
1. **Firestore Transactions**
   - Abbiamo imparato a gestire le transazioni per US18, garantendo la coerenza dei dati.
   - La conoscenza acquisita è stata condivisa col team.

2. **Completamento Interazioni**
   - Like, commenti e thread funzionano bene e l'UX è fluida.

3. **Ricerca**
   - L'implementazione della ricerca è stata veloce ed efficace.

4. **Richieste al DB**
   - Abbiamo imparato a gestire le richieste al DB in modo più efficiente senza appesantire il codice facendo troppe chiamate. Sicuramente da raffinare e migliorare ancora.

### Processo
1. **Recupero Velocità**
   - Siamo riusciti a completare il 100% dello sprint, recuperando la preoccupazone per il mancato completamento della US18 nello scorso sprint.
   - Stime molto più accurate questa volta.

2. **Goal Raggiunto**
   - Aver completato tutte le US dà morale al team stimolandoci a fare molto di più nel prossimo.

### Team
1. **Collaborazione**
   - Ottima collaborazione nella risoluzione dei problemi complessi e difficiolta riscontrate durante il percorso con: branch, merge, test e allineamento del codice.

---

## Cosa non ha funzionato (da prestarci attenzione in futuro)

### Tecnico
1. **Gestione Stato Dashboard (US17)**
   - La complessità della dashboard ha creato qualche bug di stato iniziale, risolto poi in corso d'opera.
   
2. **Test Coverage**
   - Essendo una prima implementazione di test, la copertura non è ancora ottimale su tutte le nuove feature.

### Processo
1. **Conflitti di Merge**
   - Lo sviluppo concorrente su componenti condivisi (Post, Commenti) ha generato conflitti di merge, gestiti e risolti efficacemente tramite sessioni di "quick sync" e risoluzione collaborativa.

---

## Cosa migliorare (subito nello sprint 3)

### Tecnico
1. **Testing**
   - Insistere sui test automatici per le nuove feature ed aumentare la copertura.

2. **Modularità**
   - Mantenere i componenti piccoli per evitare conflitti di merge futuri.

### Processo
1. **Pianificazione Merge**
   - Coordinarsi meglio quando si lavora sugli stessi file per evitare conflitti.

---

## Action Items

### Priorità Alta
1. **Implementare Recensioni e Collezioni**
   - Focus dello Sprint 3.
   - Responsabile: Team
   - Deadline: Fine Sprint 3

2. **Migliorare CI/CD**
   - Assicurarsi che la pipeline di test sia solida.
   - Responsabile: Team
   - Deadline: Fine Sprint 3

### Priorità Media
1. **Refactoring Dashboard**
   - Se avanza tempo, ottimizzare il codice.
   - Deadline: Fine Sprint 3

2. **Strategia di Testing**
   - **Decisione**: Rimuovere i test del backend per il momento.
   - Motivazione: Focus prioritario sulle funzionalità frontend e visuali; i test backend non sono necessare, non avendo un DB con funzioni o operazioni complesse non è necessario testarlo

