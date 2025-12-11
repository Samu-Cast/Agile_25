// backend/tests/unit/routes/roasters.test.js
const request = require('supertest'); //libreria per simulare richieste HTTP all'app Express
const app = require('../../../src/app'); //importo l'applicazione Express da testare

// Mock Data Store - Simulazione database in memoria
let mockRoastersData = {}; //memorizza le torrefazioni di test - struttura: { 'id': { id, name, address, stats, ... } }
let mockProductsData = {}; //memorizza i prodotti per torrefazione - struttura: { 'roasterId': { 'productId': { id, name, price, ... } } }

// Mock Firebase - Sostituisce il vero database con uno fittizio controllabile
jest.mock('../../../src/config/firebase', () => { //quando un file importa Firebase, riceve questo oggetto finto
    return {
        admin: { //simula Firebase Admin SDK
            firestore: {
                FieldValue: { //funzioni speciali di Firestore
                    increment: jest.fn((value) => ({ _increment: value })) //incrementa contatori atomicamente
                }
            }
        },
        bucket: { //simula Firebase Storage per upload immagini prodotti
            name: 'test-bucket', //nome del bucket fittizio
            file: jest.fn(() => ({ //simula file(path) - riferimento a un file
                save: jest.fn(() => Promise.resolve()) //simula salvataggio file
            }))
        },
        db: { //simula l'oggetto database di Firestore
            collection: jest.fn((collectionName) => { //simula db.collection(name) - accesso a una collezione
                if (collectionName === 'roasters') { //se accediamo alla collezione 'roasters' (torrefazioni)
                    return {
                        //GET - Recupera TUTTE le torrefazioni
                        get: jest.fn(() => {
                            const docs = Object.values(mockRoastersData).map(data => ({ //converte oggetto in array
                                id: data.id, //ID della torrefazione
                                data: () => data //funzione che restituisce i dati
                            }));
                            return Promise.resolve({ docs }); //restituisce i documenti
                        }),
                        //WHERE - Filtra le torrefazioni (es: per ownerUid)
                        where: jest.fn(() => ({
                            get: jest.fn(() => {
                                const docs = Object.values(mockRoastersData).map(data => ({
                                    id: data.id,
                                    data: () => data
                                }));
                                return Promise.resolve({ docs });
                            })
                        })),
                        //LIMIT - Limita il numero di risultati (max 20)
                        limit: jest.fn(() => ({
                            get: jest.fn(() => {
                                const docs = Object.values(mockRoastersData).slice(0, 20).map(data => ({
                                    id: data.id,
                                    data: () => data
                                }));
                                return Promise.resolve({ docs });
                            })
                        })),
                        //DOC - Seleziona una torrefazione specifica tramite ID
                        doc: jest.fn((id) => ({
                            //GET - Recupera i dati della torrefazione
                            get: jest.fn(() => {
                                const data = mockRoastersData[id]; //cerca la torrefazione nel mock
                                return Promise.resolve({
                                    exists: !!data, //true se esiste, false altrimenti
                                    id: id,
                                    data: () => data //funzione che restituisce i dati
                                });
                            }),
                            //SET - Crea/aggiorna una torrefazione
                            set: jest.fn((data) => {
                                mockRoastersData[id] = { ...data, id }; //salva nel mock
                                return Promise.resolve();
                            }),
                            //UPDATE - Aggiorna campi specifici
                            update: jest.fn((updates) => {
                                if (mockRoastersData[id]) { //se la torrefazione esiste
                                    mockRoastersData[id] = { ...mockRoastersData[id], ...updates }; //aggiorna i campi
                                }
                                return Promise.resolve();
                            }),
                            //COLLECTION - Accede alle subcollection (es: products)
                            collection: jest.fn((subCol) => {
                                if (subCol === 'products') { //subcollection prodotti della torrefazione
                                    return {
                                        //GET - Recupera tutti i prodotti
                                        get: jest.fn(() => {
                                            const products = mockProductsData[id] || {}; //prodotti di questa torrefazione
                                            const docs = Object.values(products).map(p => ({
                                                id: p.id,
                                                data: () => p
                                            }));
                                            return Promise.resolve({ docs });
                                        }),
                                        //ADD - Aggiunge un nuovo prodotto
                                        add: jest.fn((data) => {
                                            const productId = 'product-' + Date.now(); //genera ID univoco
                                            if (!mockProductsData[id]) mockProductsData[id] = {}; //inizializza se non esiste
                                            mockProductsData[id][productId] = { ...data, id: productId }; //salva il prodotto
                                            return Promise.resolve({ id: productId }); //restituisce l'ID del prodotto creato
                                        })
                                    };
                                }
                                return {};
                            })
                        })),
                        //ADD - Crea una nuova torrefazione
                        add: jest.fn((data) => {
                            const id = 'roaster-' + Date.now(); //genera ID univoco
                            mockRoastersData[id] = { ...data, id }; //salva nel mock
                            return Promise.resolve({ id }); //restituisce l'ID della torrefazione creata
                        })
                    };
                }
                return {};
            })
        }
    };
});

describe('Roasters API - GET /api/roasters/:id', () => { //gruppo di test per recuperare una singola torrefazione
    beforeEach(() => { //eseguito prima di ogni test - prepara i dati
        mockRoastersData = {
            'roaster1': { //torrefazione di test
                id: 'roaster1',
                name: 'Torrefazione Torino',
                address: 'Via Torino 5',
                city: 'Torino',
                ownerUid: 'owner123',
                stats: { avgRating: 4.8, posts: 20, reviews: 12 }
            }
        };
    });

    it('dovrebbe ritornare roaster quando id esiste', async () => {
        const res = await request(app).get('/api/roasters/roaster1'); //invia GET per roaster1
        expect(res.status).toBe(200); //verifica status 200 (successo)
        expect(res.body.id).toBe('roaster1'); //verifica che l'ID corrisponda
        expect(res.body.name).toBe('Torrefazione Torino'); //verifica il nome
    });

    it('dovrebbe ritornare 404 per roaster non esistente', async () => {
        const res = await request(app).get('/api/roasters/nonexistent'); //richiesta per ID inesistente
        expect(res.status).toBe(404); //verifica status 404 (non trovato)
    });
});

describe('Roasters API - GET /api/roasters (lista)', () => { //gruppo di test per recuperare lista di torrefazioni
    beforeEach(() => { //prepara 2 torrefazioni di test
        mockRoastersData = {
            'roaster1': { id: 'roaster1', name: 'Torrefazione Torino', city: 'Torino' },
            'roaster2': { id: 'roaster2', name: 'Roaster Milano', city: 'Milano' }
        };
    });

    it('dovrebbe ritornare array di roasters', async () => {
        const res = await request(app).get('/api/roasters'); //invia GET per lista completa
        expect(res.status).toBe(200); //verifica status 200
        expect(Array.isArray(res.body)).toBe(true); //verifica che sia un array
        expect(res.body.length).toBe(2); //verifica che ci siano 2 torrefazioni
    });
});

describe('Roasters API - POST /api/roasters', () => { //gruppo di test per creare una nuova torrefazione
    beforeEach(() => { //database vuoto all'inizio
        mockRoastersData = {};
    });

    it('dovrebbe creare roaster con dati validi', async () => {
        const res = await request(app)
            .post('/api/roasters') //invia POST per creare torrefazione
            .send({ //dati della nuova torrefazione
                name: 'New Roastery',
                address: 'Via Roma 1',
                city: 'Roma',
                ownerUid: 'owner123'
            });
        expect(res.status).toBe(200); //verifica successo
        expect(res.body).toHaveProperty('id'); //verifica che abbia un ID
    });

    it('dovrebbe fallire se manca name', async () => {
        const res = await request(app)
            .post('/api/roasters') //invia POST senza name
            .send({ address: 'Via Roma 1' });
        expect(res.status).toBe(400); //verifica errore 400 (Bad Request)
    });
});

describe('Roasters API - PUT /api/roasters/:id', () => { //gruppo di test per aggiornare una torrefazione
    beforeEach(() => { //prepara torrefazione esistente
        mockRoastersData = {
            'roaster1': {
                id: 'roaster1',
                name: 'Old Name',
                address: 'Old Address',
                city: 'Torino'
            }
        };
    });

    it('dovrebbe aggiornare roaster', async () => {
        const res = await request(app)
            .put('/api/roasters/roaster1') //invia PUT per aggiornare
            .send({ name: 'Updated Name', description: 'New description' }); //nuovi dati
        expect(res.status).toBe(200); //verifica successo
        expect(mockRoastersData['roaster1'].name).toBe('Updated Name'); //verifica che il nome sia aggiornato
    });
});

describe('Roasters API - GET /api/roasters/:id/products', () => { //gruppo di test per recuperare prodotti di una torrefazione
    beforeEach(() => { //prepara torrefazione e 2 prodotti  
        mockRoastersData = {
            'roaster1': { id: 'roaster1', name: 'Torrefazione Torino' }
        };
        mockProductsData = {
            'roaster1': { //prodotti della torrefazione roaster1
                'product1': {
                    id: 'product1',
                    name: 'Espresso Blend',
                    price: 12.50,
                    description: 'Rich espresso blend'
                },
                'product2': {
                    id: 'product2',
                    name: 'Filter Coffee',
                    price: 15.00,
                    description: 'Light roast for filter'
                }
            }
        };
    });

    it('dovrebbe ritornare prodotti del roaster', async () => {
        const res = await request(app).get('/api/roasters/roaster1/products'); //richiesta prodotti
        expect(res.status).toBe(200); //verifica successo
        expect(Array.isArray(res.body)).toBe(true); //verifica che sia un array
        expect(res.body.length).toBe(2); //verifica 2 prodotti
        expect(res.body[0]).toHaveProperty('name'); //verifica campo name
        expect(res.body[0]).toHaveProperty('price'); //verifica campo price
    });

    it('dovrebbe ritornare array vuoto se nessun prodotto', async () => {
        mockProductsData = {}; //nessun prodotto
        const res = await request(app).get('/api/roasters/roaster1/products'); //richiesta prodotti
        expect(res.status).toBe(200); //verifica successo
        expect(Array.isArray(res.body)).toBe(true); //verifica che sia un array
        expect(res.body.length).toBe(0); //verifica array vuoto
    });
});

describe('Roasters API - POST /api/roasters/:id/products', () => { //gruppo di test per creare un nuovo prodotto
    beforeEach(() => { //prepara torrefazione, nessun prodotto inizialmente
        mockRoastersData = {
            'roaster1': { id: 'roaster1', name: 'Torrefazione Torino' }
        };
        mockProductsData = {};
    });

    it('dovrebbe creare prodotto con dati validi', async () => {
        const res = await request(app)
            .post('/api/roasters/roaster1/products') //invia POST per creare prodotto
            .send({ //dati del nuovo prodotto
                name: 'New Blend',
                price: 14.99,
                description: 'Amazing new blend',
                imageUrl: 'https://example.com/image.jpg'
            });
        expect(res.status).toBe(200); //verifica successo
        expect(res.body).toHaveProperty('id'); //verifica che abbia un ID
    });

    it('dovrebbe fallire se manca name', async () => {
        const res = await request(app)
            .post('/api/roasters/roaster1/products') //invia POST senza name
            .send({ price: 14.99 });
        expect(res.status).toBe(400); //verifica errore 400
    });

    it('dovrebbe fallire se manca price', async () => {
        const res = await request(app)
            .post('/api/roasters/roaster1/products') //invia POST senza price
            .send({ name: 'New Blend' });
        expect(res.status).toBe(400); //verifica errore 400 (price è obbligatorio)
    });
});
