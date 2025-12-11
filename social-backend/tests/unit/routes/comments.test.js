// backend/tests/unit/routes/comments.test.js
const request = require('supertest'); //libreria per simulare richieste HTTP all'app Express
const app = require('../../../src/app'); //importo l'applicazione Express da testare

// Mock Data Store - Simulazione database in memoria
let mockCommentsData = {}; //memorizza i commenti di test
let mockPostsData = {}; //memorizza i post di test (necessari per verificare i titoli)

// Mock Firebase - Sostituisce il vero database con uno fittizio controllabile
jest.mock('../../../src/config/firebase', () => { //quando un file importa Firebase, riceve questo oggetto finto
    return {
        db: { //simula l'oggetto database di Firestore
            // collectionGroup - Permette di cercare in tutte le subcollection con lo stesso nome
            // Esempio: cerca tutti i 'comments' sotto qualsiasi post
            collectionGroup: jest.fn((collectionName) => {
                if (collectionName === 'comments') {
                    return {
                        // where - Filtra i commenti in base a una condizione
                        // Esempio: where('uid', '==', 'user123') trova tutti i commenti di user123
                        where: jest.fn((field, op, value) => ({
                            get: jest.fn(() => {
                                // Filtra i commenti in base al campo specificato
                                const filteredComments = Object.values(mockCommentsData)
                                    .filter(comment => {
                                        if (field === 'uid' && op === '==') { //se cerchiamo per uid
                                            return comment.uid === value; //restituisci solo i commenti di quell'utente
                                        }
                                        return true; //altrimenti restituisci tutti
                                    });

                                // Converte i commenti in formato Firestore document
                                const docs = filteredComments.map(comment => ({
                                    id: comment.id, //ID del commento
                                    data: () => comment, //funzione che restituisce i dati del commento
                                    ref: { //riferimento al documento (serve per ottenere il postId)
                                        parent: { //parent = collezione 'comments'
                                            parent: { //parent.parent = documento del post
                                                id: comment.postId //ID del post a cui appartiene il commento
                                            }
                                        }
                                    }
                                }));
                                return Promise.resolve({ docs }); //restituisce i documenti trovati
                            })
                        }))
                    };
                }
                return {}; //se la collezione non è 'comments', restituisce oggetto vuoto
            }),

            // collection - Accede a una collezione specifica
            collection: jest.fn((collectionName) => {
                if (collectionName === 'posts') { //se accediamo alla collezione 'posts'
                    return {
                        // doc - Seleziona un documento specifico tramite ID
                        doc: jest.fn((postId) => ({
                            // get - Recupera i dati del post
                            get: jest.fn(() => {
                                const data = mockPostsData[postId]; //cerca il post nel mock
                                return Promise.resolve({
                                    exists: !!data, //true se il post esiste, false altrimenti
                                    id: postId, //ID del post
                                    data: () => data //funzione che restituisce i dati del post
                                });
                            })
                        }))
                    };
                }
                return {}; //se la collezione non è 'posts', restituisce oggetto vuoto
            }),

            // getAll - Recupera più documenti in una singola richiesta (batch read)
            // Usato per ottenere i dettagli di più post contemporaneamente
            getAll: jest.fn((...refs) => {
                return Promise.resolve(refs.map(ref => {
                    const postId = ref._postId || 'post1'; //estrae l'ID del post dal riferimento
                    const data = mockPostsData[postId]; //cerca il post nel mock
                    return {
                        exists: !!data, //true se il post esiste
                        id: postId, //ID del post
                        data: () => data //funzione che restituisce i dati del post
                    };
                }));
            })
        }
    };
});

describe('Comments API - GET /api/comments?uid=USER_ID', () => { //gruppo di test per l'endpoint che recupera i commenti di un utente
    beforeEach(() => { //eseguito prima di ogni test - prepara i dati di test
        // Prepara 3 commenti di test: 2 di user123, 1 di user456
        mockCommentsData = {
            'comment1': {
                id: 'comment1',
                postId: 'post1', //commento sul post1
                uid: 'user123', //autore del commento
                text: 'Great post!',
                createdAt: { toDate: () => new Date('2024-12-01') } //data di creazione
            },
            'comment2': {
                id: 'comment2',
                postId: 'post2', //commento sul post2
                uid: 'user123', //stesso autore
                text: 'Nice article',
                createdAt: { toDate: () => new Date('2024-12-02') } //più recente
            },
            'comment3': {
                id: 'comment3',
                postId: 'post1', //commento sul post1
                uid: 'user456', //autore diverso
                text: 'Thanks!',
                createdAt: { toDate: () => new Date('2024-12-03') } //più recente di tutti
            }
        };

        // Prepara 2 post di test con titoli diversi
        mockPostsData = {
            'post1': {
                id: 'post1',
                text: 'This is a great coffee blend',
                title: 'Amazing Blend' //ha un titolo
            },
            'post2': {
                id: 'post2',
                text: 'How to make espresso properly with detailed instructions',
                title: null // Nessun titolo - dovrebbe usare il testo troncato
            }
        };
    });

    it('dovrebbe ritornare tutti i commenti di un utente', async () => {
        const res = await request(app).get('/api/comments?uid=user123'); //richiesta GET con parametro uid
        expect(res.status).toBe(200); //verifica status 200 (successo)
        expect(Array.isArray(res.body)).toBe(true); //verifica che la risposta sia un array
        expect(res.body.length).toBe(2); //verifica che ci siano 2 commenti (quelli di user123)
        expect(res.body[0]).toHaveProperty('postId'); //verifica che ogni commento abbia il postId
        expect(res.body[0]).toHaveProperty('text'); //verifica che ogni commento abbia il testo
    });

    it('dovrebbe ritornare 400 se manca uid', async () => {
        const res = await request(app).get('/api/comments'); //richiesta senza parametro uid
        expect(res.status).toBe(400); //verifica status 400 (Bad Request)
        expect(res.body.error).toBe('Missing uid query parameter'); //verifica messaggio di errore
    });

    it('dovrebbe includere postTitle per ogni commento', async () => {
        const res = await request(app).get('/api/comments?uid=user123'); //richiesta GET
        expect(res.status).toBe(200); //verifica successo
        expect(res.body[0]).toHaveProperty('postTitle'); //verifica che ci sia il titolo del post
        expect(res.body[0].postTitle).toBeTruthy(); //verifica che il titolo non sia vuoto
    });

    it('dovrebbe ordinare commenti per createdAt (desc)', async () => {
        const res = await request(app).get('/api/comments?uid=user123'); //richiesta GET
        expect(res.status).toBe(200); //verifica successo
        expect(res.body.length).toBe(2); //verifica 2 commenti
        // Dovrebbero essere ordinati dal più recente al più vecchio
        const dates = res.body.map(c => new Date(c.createdAt).getTime()); //estrae le date
        expect(dates[0]).toBeGreaterThanOrEqual(dates[1]); //verifica che la prima sia >= della seconda
    });

    it('dovrebbe ritornare array vuoto se utente non ha commenti', async () => {
        const res = await request(app).get('/api/comments?uid=userWithNoComments'); //utente senza commenti
        expect(res.status).toBe(200); //verifica successo
        expect(Array.isArray(res.body)).toBe(true); //verifica che sia un array
        expect(res.body.length).toBe(0); //verifica che l'array sia vuoto
    });

    it('dovrebbe gestire post senza title (usando testo troncato)', async () => {
        const res = await request(app).get('/api/comments?uid=user123'); //richiesta GET
        expect(res.status).toBe(200); //verifica successo
        const comment2 = res.body.find(c => c.postId === 'post2'); //trova il commento sul post2
        expect(comment2).toBeDefined(); //verifica che esista
        expect(comment2.postTitle).toBeTruthy(); //verifica che abbia un titolo
        // Dovrebbe usare il testo troncato dato che il post non ha title
        expect(comment2.postTitle.length).toBeLessThanOrEqual(53); // 50 caratteri + "..."
    });

    it('dovrebbe gestire post non più esistenti', async () => {
        // Simula un commento su un post che è stato eliminato
        mockCommentsData = {
            'comment1': {
                id: 'comment1',
                postId: 'deletedPost', //post che non esiste in mockPostsData
                uid: 'user123',
                text: 'Comment on deleted post',
                createdAt: { toDate: () => new Date() }
            }
        };

        const res = await request(app).get('/api/comments?uid=user123'); //richiesta GET
        expect(res.status).toBe(200); //verifica successo
        expect(res.body.length).toBe(1); //verifica 1 commento
        expect(res.body[0].postTitle).toBe('Unknown Post'); //verifica che il titolo sia "Unknown Post"
    });
});
