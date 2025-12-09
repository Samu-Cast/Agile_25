// backend/tests/unit/routes/roasters.test.js
const request = require('supertest'); //libreria per simulare richieste HTTP all'app 
const app = require('../../../src/app'); //importo l'applicazione da testare

//mock di Firebase: sostituisce il vero database con uno fittizio controllabile
jest.mock('../../../src/config/firebase', () => ({ //quando un file importa Firebase, riceve questo oggetto finto
    db: { //simula l'oggetto database di Firestore
        collection: jest.fn(() => ({ //simula db.collection('roasters') - accesso alla collezione torrefazioni
            doc: jest.fn((docId) => ({ //simula .doc(roasterId) - selezione di un dato specifico tramite id
                get: jest.fn(() => ({ //simula .get() - recupero dei dati del documento
                    exists: true, //indica che il dato esiste nel database fittizio
                    id: docId, //l'id del dato corrisponde a quello richiesto
                    data: () => ({ //funzione che restituisce i campi del dato roaster
                        address: "Via Torino 5, Torino",
                        city: "Torino",
                        createdAt: { toDate: () => new Date('2024-11-26') },
                        description: "Torrefazione artigianale",
                        email: "info@roaster.it",
                        name: "Torrefazione Torino",
                        ownerUid: "owner456",
                        phone: "+39 011 1234567",
                        stats: {
                            avgRating: 4.8,
                            posts: 20,
                            reviews: 12
                        }
                    })
                }))
            })),
            limit: jest.fn(() => ({ //simula .limit(n) - limita il numero di risultati
                get: jest.fn(() => ({ //simula .get() - recupero della lista di dati
                    docs: [ //array di roasters restituiti dalla query
                        {
                            id: 'roaster1',
                            data: () => ({
                                name: 'Torrefazione Torino',
                                address: 'Via Torino 5',
                                city: 'Torino',
                                stats: { avgRating: 4.8, posts: 20, reviews: 12 }
                            })
                        },
                        {
                            id: 'roaster2',
                            data: () => ({
                                name: 'Roaster Milano',
                                address: 'Via Milano 10',
                                city: 'Milano',
                                stats: { avgRating: 4.6, posts: 15, reviews: 9 }
                            })
                        }
                    ]
                }))
            }))
        }))
    }
}));

describe('Roasters API - GET /api/roasters/:id', () => { //gruppo di test per l'endpoint che recupera una singola torrefazione
    it('dovrebbe ritornare roaster quando id esiste', async () => {
        const res = await request(app).get('/api/roasters/roaster1'); //invia richiesta GET per ottenere il roaster con id 'roaster1'
        expect(res.status).toBe(200); //verifica che il server risponda con status 200 (successo)
        expect(res.body).toHaveProperty('id'); //verifica che la risposta contenga il campo 'id'
        expect(res.body.name).toBe('Torrefazione Torino'); //verifica che il nome corrisponda ai dati mockati
    });

    it('dovrebbe ritornare struttura corretta (id, name, address)', async () => {
        const res = await request(app).get('/api/roasters/roaster1'); //invia richiesta GET per il roaster
        expect(res.status).toBe(200); //verifica status 200
        expect(res.body).toHaveProperty('id'); //verifica presenza campo 'id' nella risposta
        expect(res.body).toHaveProperty('name'); //verifica presenza campo 'name' nella risposta
        expect(res.body).toHaveProperty('address'); //verifica presenza campo 'address' nella risposta
    });
});

describe('Roasters API - GET /api/roasters (lista)', () => { //gruppo di test per l'endpoint che recupera la lista torrefazioni
    it('dovrebbe ritornare array di roasters', async () => {
        const res = await request(app).get('/api/roasters'); //invia richiesta GET per ottenere tutti i roasters
        expect(res.status).toBe(200); //verifica status 200
        expect(Array.isArray(res.body)).toBe(true); //verifica che la risposta sia un array
        expect(res.body.length).toBe(2); //verifica che ci siano 2 roasters (quelli definiti nel mock)
    });

    it('dovrebbe ritornare roaster con struttura corretta', async () => {
        const res = await request(app).get('/api/roasters'); //invia richiesta GET per la lista roasters
        expect(res.status).toBe(200); //verifica status 200
        expect(res.body[0]).toHaveProperty('id'); //verifica che il primo roaster abbia il campo 'id'
        expect(res.body[0]).toHaveProperty('name'); //verifica che il primo roaster abbia il campo 'name'
        expect(res.body[0]).toHaveProperty('address'); //verifica che il primo roaster abbia il campo 'address'
    });
});
