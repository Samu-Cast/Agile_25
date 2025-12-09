// backend/tests/unit/routes/bars.test.js
const request = require('supertest'); //libreria per simulare richieste HTTP all'app Express
const app = require('../../../src/app'); //importo l'applicazione Express da testare

//mock di Firebase: sostituisce il vero database con uno fittizio controllabile
jest.mock('../../../src/config/firebase', () => ({ //quando un file importa Firebase, riceve questo oggetto finto
    db: { //simula l'oggetto database di Firestore
        collection: jest.fn(() => ({ //simula db.collection('bars') - accesso alla collezione bar
            doc: jest.fn((docId) => ({ //simula .doc(barId) - selezione di un dato specifico tramite id
                get: jest.fn(() => ({ //simula .get() - recupero dei dati del documento
                    exists: true, //indica che il dato esiste nel database fittizio
                    id: docId, //l'id del dato corrisponde a quello richiesto
                    data: () => ({ //funzione che restituisce i campi del dato bar
                        address: "Via Roma 1, Milano",
                        baristas: [],
                        city: "Milano",
                        createdAt: { toDate: () => new Date('2024-11-26') },
                        description: "Bar storico nel centro di Milano",
                        imageCover: "",
                        name: "Bar Centrale",
                        openingHours: "7:00-20:00",
                        ownerUid: "owner123",
                        stats: {
                            avgRating: 4.5,
                            posts: 10,
                            reviews: 5
                        }
                    })
                }))
            })),
            limit: jest.fn(() => ({ //simula .limit(n) - limita il numero di risultati
                get: jest.fn(() => ({ //simula .get() - recupero della lista di dati
                    docs: [ //array di bar restituiti dalla query
                        {
                            id: 'bar1',
                            data: () => ({
                                name: 'Bar Centrale',
                                address: 'Via Roma 1',
                                city: 'Milano',
                                stats: { avgRating: 4.5, posts: 10, reviews: 5 }
                            })
                        },
                        {
                            id: 'bar2',
                            data: () => ({
                                name: 'Caffè del Corso',
                                address: 'Corso Italia 10',
                                city: 'Torino',
                                stats: { avgRating: 4.2, posts: 8, reviews: 3 }
                            })
                        }
                    ]
                }))
            }))
        }))
    }
}));

describe('Bars API - GET /api/bars/:id', () => { //gruppo di test per l'endpoint che recupera un singolo bar
    it('dovrebbe ritornare bar quando id esiste', async () => {
        const res = await request(app).get('/api/bars/bar1'); //invia richiesta GET per ottenere il bar con id 'bar1'
        expect(res.status).toBe(200); //verifica che il server risponda con status 200 (successo)
        expect(res.body).toHaveProperty('id'); //verifica che la risposta contenga il campo 'id'
        expect(res.body.name).toBe('Bar Centrale'); //verifica che il nome corrisponda ai dati mockati
    });

    it('dovrebbe ritornare struttura corretta (id, name, address)', async () => {
        const res = await request(app).get('/api/bars/bar1'); //invia richiesta GET per il bar
        expect(res.status).toBe(200); //verifica status 200
        expect(res.body).toHaveProperty('id'); //verifica presenza campo 'id' nella risposta
        expect(res.body).toHaveProperty('name'); //verifica presenza campo 'name' nella risposta
        expect(res.body).toHaveProperty('address'); //verifica presenza campo 'address' nella risposta
    });
});

describe('Bars API - GET /api/bars (lista)', () => { //gruppo di test per l'endpoint che recupera la lista bar
    it('dovrebbe ritornare array di bar', async () => {
        const res = await request(app).get('/api/bars'); //invia richiesta GET per ottenere tutti i bar
        expect(res.status).toBe(200); //verifica status 200
        expect(Array.isArray(res.body)).toBe(true); //verifica che la risposta sia un array
        expect(res.body.length).toBe(2); //verifica che ci siano 2 bar (quelli definiti nel mock)
    });

    it('dovrebbe ritornare bar con struttura corretta', async () => {
        const res = await request(app).get('/api/bars'); //invia richiesta GET per la lista bar
        expect(res.status).toBe(200); //verifica status 200
        expect(res.body[0]).toHaveProperty('id'); //verifica che il primo bar abbia il campo 'id'
        expect(res.body[0]).toHaveProperty('name'); //verifica che il primo bar abbia il campo 'name'
        expect(res.body[0]).toHaveProperty('address'); //verifica che il primo bar abbia il campo 'address'
    });
});
