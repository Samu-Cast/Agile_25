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
   - Abbiamo imparato a gestire le transazioni per il sistema follow, garantendo la coerenza dei dati.
   - La conoscenza acquisita è stata condivisa col team.

2. **Testing**
   - Implementati test unitari per componenti React (Jest + React Testing Library).
   - Implementati test API endpoints con mock Firebase.
   - Framework ben integrato e facile da usare.

3. **CI/CD**
   - GitHub Actions configurato correttamente.
   - Validazione automatica su push/PR verso main e preRelease.
   - Garanzia di qualità prima del merge.

4. **Completamento Feature Social**
   - Follow/unfollow funzionante con contatori real-time.
   - Ricerca utenti efficace e veloce.
   - Feed home e popular implementati.

### Processo
1. **Recupero Velocità**
   - Siamo riusciti a completare il 100% dello sprint, recuperando la preoccupazione per il mancato completamento della US follow nello Sprint 1.
   - Stime molto più accurate questa volta.

2. **Goal Raggiunto**
   - Aver completato tutte le US dà morale al team stimolandoci a fare molto di più nel prossimo sprint.

### Team
1. **Collaborazione**
   - Ottima collaborazione nella risoluzione dei problemi complessi e difficoltà riscontrate durante il percorso con: branch, merge, test e allineamento del codice.

---

## Cosa non ha funzionato (da prestarci attenzione in futuro)

### Tecnico
1. **Setup Iniziale Test**
   - La configurazione dell'ambiente di test ha richiesto più tempo del previsto essendo un nuovo strumento.
   - Curva di apprendimento per Jest e mocking.

2. **Test Coverage**
   - Essendo una prima implementazione di test, la copertura non è ancora ottimale su tutte le aree.

### Processo
1. **Conflitti di Merge**
   - Lo sviluppo concorrente su componenti condivisi ha generato conflitti, gestiti e risolti efficacemente tramite sessioni di "quick sync".

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

2. **Migliorare Test Coverage**
   - Assicurarsi che la pipeline di test sia solida.
   - Responsabile: Team
   - Deadline: Fine Sprint 3

### Priorità Media
1. **Refactoring Componenti**
   - Se avanza tempo, ottimizzare il codice dei componenti più complessi.
   - Deadline: Fine Sprint 3

2. **Strategia di Testing**
   - **Decisione**: Valutare se mantenere test backend o focalizzarsi sul frontend.
   - Motivazione: Focus prioritario sulle funzionalità frontend e visuali.
