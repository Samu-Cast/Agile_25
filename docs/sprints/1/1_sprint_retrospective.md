# Sprint 1 - Retrospective

**Data Sprint**: 14 Novembre 2025 - 27 Novembre 2025  
**Data Retrospettiva**: 27 Novembre 2025  
**Partecipanti**: Tutti 

---

## Formato Retrospettiva

**Metodo utilizzato**: Start-Stop-Continue  
**Durata**: 1 ora

---

## Cosa ha funzionato bene (da mantenere alto in futuro)

### Tecnico
1. **Architettura Firebase**
   - Integrazione Firebase Auth e Firestore molto efficace e rapida
   - Upload immagini su Firebase Storage funzionante
   - Struttura dati Firestore ben progettata
   - AuthContext React per gestione stato autenticazione molto efficace

2. **Stack tecnologico**
   - React + Express stack produttivo dopo familiarizzazione
   - route backend implementate in modo modulare
   - pagine frontend completate con buona UX

3. **Completamento funzionalità core**
   - 8 User Stories completate su 9 pianificate (88.9%)
   - Sistema autenticazione completo (login, logout, recupero password)
   - Tutti e 3 i tipi di profilo implementati (Appassionato, Barista, Torrefazione)
   - Feed base funzionante con sistema voti

### Processo
1. **Setup iniziale**
   - Architettura base definita e rapida da implementare
   - Ambiente di sviluppo configurato senza problemi
   - GitHub Actions CI considerato e team formato (per prossimo sprint)

2. **Delivery**
   - 39 story points completati in 2 settimane
   - Tutte le funzionalità core consegnate

### Team
1. **Apprendimento**
   - Team ha acquisito familiarità con Firebase
   - Buona comprensione della tecnologia che si è scelta di utilizzare

---

## Cosa non ha funzionato (da prestarci attenzione in futuro)

### Tecnico
1. **Stime effort - US18**
   - Follow/amicizia sottostimata: previsti 6 SP, completato solo 1/6
   - Non considerata complessità e tempo per creare nuove transazioni Firestore
   - Mancata formazione tecnica per funzionalità mai implementata prima

2. **Testing**
   - Zero test automatici implementati
   - Testing solo manuale e non sistematico
   - Nessun test di integrazione
   - DoD (70% coverage) non rispettata

### Processo
1. **Definition of Done**
   - DoD non del tutto rispettata (test mancanti)
   - Nessun test automatico implementato

---

## Cosa migliorare (subito nello sprint 2)

### Tecnico
1. **Testing**
   - Implementare test unitari per componenti React
   - Configurare CI per test automatici con github actions

### Processo
1. **Stime**
   - Considerare complessità tecniche (es. transazioni, concorrenza)
   - Considerare tempo formazione tecnica per funzionalità mai implementate prima
   - Discutere sufunzionalità incerte e stime relative (campo nuovo per tutti)

2. **Documentazione**
   - Documentare sprint e raffinare il file `increment.md`
   - Aggiornare README durante sviluppo

### Team
1. **Comunicazione**
   - Comunicare più spesso e in modo più chiaro
   - Definire la disponibilità per lo sprint in anticipo

---

## Action Items

### Priorità Alta
1. **Completare US18** (follow/amicizia)
   - Responsabile: [Inserire nome]
   - Deadline: Sprint 2
   - Status: Completare in Sprint 2

2. **Implementare test automatici**
   - Responsabile: [Inserire nome]
   - Deadline: Sprint 2
   - Status: Completare in Sprint 2

### Priorità Media
1. **Code review**
   - Responsabile: tutti
   - Azione: Revisionare il codice degli altri oltre che il proprio
   - Deadline: entro sprint 2 cosi da poter sviluppare in base ai feedback

2. **Documentazione architetturale**
   - Responsabile: tutti
   - Azione: documentare più possibile le scelte cosi da seguire l'obbiettivo
   - Deadline: sprint 2
