// backend/tests/unit/routes/posts.test.js
const request = require('supertest'); //libreria per simulare richieste HTTP all'app 
const app = require('../../../src/app'); //importo l'applicazione da testare

//mappa per tracciare lo stato dei like durante i test (simula persistenza)
const mockLikes = new Map();

//mock di Firebase: sostituisce il vero database con uno fittizio controllabile
jest.mock('../../../src/config/firebase', () => { //quando un file importa Firebase, riceve questo oggetto finto
    const mockAdmin = { //simula firebase-admin
        firestore: {
            FieldValue: {
                increment: jest.fn((value) => ({ _increment: value })) //simula FieldValue.increment() per contatori
            }
        }
    };

    return {
        admin: mockAdmin,
        db: { //simula l'oggetto database di Firestore
            collection: jest.fn((collectionName) => { //simula db.collection() - accesso dinamico alle collezioni
                if (collectionName === 'posts') { //gestione specifica per la collezione 'posts'
                    return {
                        //simula .orderBy() - ordinamento dei post (usato per GET /api/posts)
                        orderBy: jest.fn(() => ({
                            get: jest.fn(() => Promise.resolve({ //simula .get() - recupero dei documenti ordinati
                                docs: [ //array di post restituiti dalla query
                                    { //primo post di test
                                        id: 'post1',
                                        data: () => ({ //funzione che restituisce i campi del post
                                            uid: 'user123',
                                            text: 'First test post',
                                            imageUrl: null,
                                            likesCount: 0,
                                            commentsCount: 0,
                                            comments: 0,
                                            entityType: 'user',
                                            entityId: 'user123',
                                            votes: 0,
                                            votedBy: {},
                                            createdAt: { toDate: () => new Date('2024-01-01') }
                                        })
                                    },
                                    { //secondo post di test (con like e commenti)
                                        id: 'post2',
                                        data: () => ({
                                            uid: 'user456',
                                            text: 'Second test post',
                                            imageUrl: 'https://example.com/img.jpg',
                                            likesCount: 5,
                                            commentsCount: 2,
                                            comments: 2,
                                            entityType: 'user',
                                            entityId: 'user456',
                                            votes: 5,
                                            votedBy: {
                                                'userA@example.com': 1,
                                                'userB@example.com': 1,
                                                'userC@example.com': 1,
                                                'userD@example.com': 1,
                                                'userE@example.com': 1
                                            },
                                            createdAt: { toDate: () => new Date('2024-01-02') }
                                        })
                                    }
                                ]
                            }))
                        })),
                        //simula .doc(postId) - selezione di un post specifico tramite id
                        doc: jest.fn((postId) => ({
                            get: jest.fn(() => Promise.resolve({ //simula .get() - recupero dati del post
                                exists: true, //indica che il post esiste
                                id: postId, //l'id del post corrisponde a quello richiesto
                                data: () => ({ //funzione che restituisce i campi del post
                                    uid: 'user123',
                                    text: 'Test post',
                                    imageUrl: null,
                                    likesCount: 0,
                                    commentsCount: 0
                                })
                            })),
                            update: jest.fn(() => Promise.resolve()), //simula .update() - modifica campi del post
                            //simula .collection() - accesso alle sub-collection del post
                            collection: jest.fn((subCollection) => {
                                if (subCollection === 'comments') { //sub-collection per i commenti
                                    return {
                                        orderBy: jest.fn(() => ({ //simula .orderBy() - ordinamento commenti
                                            get: jest.fn(() => Promise.resolve({
                                                docs: [] //nessun commento esistente
                                            }))
                                        })),
                                        add: jest.fn(() => Promise.resolve({ //simula .add() - aggiunta nuovo commento
                                            id: 'comment123' //id del commento appena creato
                                        }))
                                    };
                                }
                                if (subCollection === 'likes') { //sub-collection per i like
                                    return {
                                        doc: jest.fn((uid) => { //simula .doc(uid) - accesso al like di un utente specifico
                                            const key = `${postId}-${uid}`; //chiave unica post-utente
                                            return {
                                                get: jest.fn(() => Promise.resolve({ //simula .get() - verifica esistenza like
                                                    exists: mockLikes.has(key) //true se l'utente ha già messo like
                                                })),
                                                set: jest.fn((data) => { //simula .set() - creazione nuovo like
                                                    mockLikes.set(key, data);
                                                    return Promise.resolve();
                                                }),
                                                delete: jest.fn(() => { //simula .delete() - rimozione like
                                                    mockLikes.delete(key);
                                                    return Promise.resolve();
                                                })
                                            };
                                        })
                                    };
                                }
                            })
                        }))
                    };
                }
                return {};
            })
        }
    };
});

describe('Posts API - GET /api/posts', () => { //gruppo di test per l'endpoint che recupera tutti i post
    it('dovrebbe ritornare tutti i post', async () => {
        const res = await request(app).get('/api/posts'); //invia richiesta GET per ottenere tutti i post
        expect(res.status).toBe(200); //verifica che il server risponda con status 200 (successo)
        expect(Array.isArray(res.body)).toBe(true); //verifica che la risposta sia un array
        expect(res.body.length).toBe(2); //verifica che ci siano 2 post (quelli definiti nel mock)
    });
});

describe('Posts API - POST /api/posts/:postId/comments', () => { //gruppo di test per l'endpoint di aggiunta commenti
    it('dovrebbe aggiungere commento con dati validi', async () => {
        const res = await request(app) //invia richiesta POST
            .post('/api/posts/post1/comments') //all'endpoint per aggiungere commento al post1
            .send({ uid: 'user123', text: 'Nuovo commento' }); //con uid e testo del commento
        expect(res.status).toBe(200); //verifica status 200
        expect(res.body).toHaveProperty('id'); //verifica che la risposta contenga l'id del commento creato
    });

    it('dovrebbe fallire se mancano uid o text', async () => {
        const res = await request(app) //invia richiesta POST
            .post('/api/posts/post1/comments') //all'endpoint per aggiungere commento
            .send({ text: 'Manca uid' }); //dati incompleti: manca il campo uid
        expect(res.status).toBe(400); //verifica che il server risponda con errore 400 (bad request)
    });
});

describe('Posts API - POST /api/posts/:postId/like', () => { //gruppo di test per l'endpoint di aggiunta like
    beforeEach(() => { //eseguito prima di ogni test in questo gruppo
        mockLikes.clear(); //resetta la mappa dei like per partire da stato pulito
    });

    it('dovrebbe aggiungere like se non esiste', async () => {
        const res = await request(app) //invia richiesta POST
            .post('/api/posts/post1/like') //all'endpoint per mettere like al post1
            .send({ uid: 'user123' }); //con l'uid dell'utente che mette like
        expect(res.status).toBe(200); //verifica status 200
        expect(res.body).toHaveProperty('message'); //verifica presenza del messaggio nella risposta
        expect(res.body.message).toBe('Post liked'); //verifica che il messaggio confermi il like
    });
});

describe('Posts API - DELETE /api/posts/:postId/like', () => { //gruppo di test per l'endpoint di rimozione like
    it('dovrebbe rimuovere like da post', async () => {
        //setup: aggiungo un like esistente prima del test
        mockLikes.set('post1-user123', { likedAt: new Date() });

        const res = await request(app) //invia richiesta DELETE
            .delete('/api/posts/post1/like') //all'endpoint per rimuovere like dal post1
            .send({ uid: 'user123' }); //con l'uid dell'utente che rimuove il like
        expect(res.status).toBe(200); //verifica status 200
        expect(res.body).toHaveProperty('message'); //verifica presenza del messaggio nella risposta
        expect(res.body.message).toBe('Post unliked'); //verifica che il messaggio confermi la rimozione
    });
});
