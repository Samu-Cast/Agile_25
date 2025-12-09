// backend/tests/unit/routes/users.test.js
const request = require('supertest'); //libreria per simulare richieste HTTP all'app 
const app = require('../../../src/app'); //importo l'applicazione da testare

//mock di Firebase: sostituisce il vero database con uno fittizio controllabile
jest.mock('../../../src/config/firebase', () => ({ //quando un file importa Firebase, riceve questo oggetto finto
    db: { //simula l'oggetto database di Firestore
        collection: jest.fn(() => ({ //simula db.collection('users') - accesso alla collezione utenti
            doc: jest.fn((docId) => ({ //simula .doc('userId') - selezione di un dato specifico tramite id
                get: jest.fn(() => ({ //simula .get() - recupero dei dati del documento
                    exists: true, //indica che il dato esiste nel database fittizio
                    id: docId, //l'id del dato corrisponde a quello richiesto
                    data: () => ({ //funzione che restituisce i campi del dato utente
                        bio: "",
                        createdAt: { toDate: () => new Date('2024-11-26') },
                        displayName: "",
                        email: "admin@admin.com",
                        lastLogin: { toDate: () => new Date('2024-12-06') },
                        location: "",
                        name: "Admin User",
                        nickname: "admin",
                        photoURL: "",
                        profilePic: "https://ui-avatars.com/api/?name=Admin+User&background=random",
                        provider: "password",
                        role: "Appassionato",
                        stats: {
                            followers: 0,
                            following: 0,
                            posts: 0
                        },
                        uid: "user123"
                    })
                }))
            })),
            limit: jest.fn(() => ({ //simula .limit(n) - limita il numero di risultati
                get: jest.fn(() => ({ //simula .get() - recupero della lista di dati
                    docs: [ //array di dati utente restituiti dalla query
                        {
                            id: 'user1',
                            data: () => ({
                                uid: 'user1',
                                name: 'User One',
                                email: 'user1@test.com',
                                nickname: 'userone',
                                role: 'Appassionato',
                                stats: { followers: 5, following: 10, posts: 3 }
                            })
                        },
                        {
                            id: 'user2',
                            data: () => ({
                                uid: 'user2',
                                name: 'User Two',
                                email: 'user2@test.com',
                                nickname: 'usertwo',
                                role: 'Barista',
                                stats: { followers: 15, following: 8, posts: 12 }
                            })
                        }
                    ]
                }))
            }))
        }))
    }
}));

describe('Users API - GET /api/users/:uid', () => { //gruppo di test per l'endpoint che recupera un singolo utente
    it('dovrebbe ritornare utente quando UID esiste', async () => {
        const res = await request(app).get('/api/users/user123'); //invia richiesta GET per ottenere l'utente con uid 'user123'
        expect(res.status).toBe(200); //verifica che il server risponda con status 200 (successo)
        expect(res.body).toHaveProperty('uid'); //verifica che la risposta contenga il campo 'uid'
        expect(res.body.name).toBe('Admin User'); //verifica che il nome corrisponda ai dati mockati
    });

    it('dovrebbe ritornare struttura corretta (uid, name, email)', async () => {
        const res = await request(app).get('/api/users/user123'); //invia richiesta GET per l'utente
        expect(res.status).toBe(200); //verifica status 200
        expect(res.body).toHaveProperty('uid'); //verifica presenza campo 'uid' nella risposta
        expect(res.body).toHaveProperty('name'); //verifica presenza campo 'name' nella risposta
        expect(res.body).toHaveProperty('email'); //verifica presenza campo 'email' nella risposta
    });
});

describe('Users API - GET /api/users (lista)', () => { //gruppo di test per l'endpoint che recupera la lista utenti
    it('dovrebbe ritornare array di utenti', async () => {
        const res = await request(app).get('/api/users'); //invia richiesta GET per ottenere tutti gli utenti
        expect(res.status).toBe(200); //verifica status 200
        expect(Array.isArray(res.body)).toBe(true); //verifica che la risposta sia un array
        expect(res.body.length).toBe(2); //verifica che ci siano 2 utenti (quelli definiti nel mock)
    });

    it('dovrebbe ritornare utenti con struttura corretta', async () => {
        const res = await request(app).get('/api/users'); //invia richiesta GET per la lista utenti
        expect(res.status).toBe(200); //verifica status 200
        expect(res.body[0]).toHaveProperty('id'); //verifica che il primo utente abbia il campo 'id'
        expect(res.body[0]).toHaveProperty('name'); //verifica che il primo utente abbia il campo 'name'
        expect(res.body[0]).toHaveProperty('email'); //verifica che il primo utente abbia il campo 'email'
    });
});
