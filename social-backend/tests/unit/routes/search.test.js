// backend/tests/unit/routes/search.test.js
const request = require('supertest'); //libreria per simulare richieste HTTP all'app 
const app = require('../../../src/app'); //importo l'applicazione da testare

//dati fittizi per simulare il database (usati dalla funzione di ricerca)
//la search route interroga tutte le collezioni: users, bars, roasters, posts
const mockData = {
    users: [ //dati utente fittizi
        {
            id: 'user1',
            data: () => ({
                name: 'Espresso Lover',
                nickname: 'espresso_fan',
                email: 'user1@test.com'
            })
        },
        {
            id: 'user2',
            data: () => ({
                name: 'Coffee Master',
                nickname: 'coffee_master',
                email: 'user2@test.com'
            })
        }
    ],
    bars: [ //dati bar fittizi
        {
            id: 'bar1',
            data: () => ({
                name: 'Espresso Bar',
                address: 'Via Roma 1'
            })
        }
    ],
    roasters: [ //dati torrefazione fittizi
        {
            id: 'roaster1',
            data: () => ({
                name: 'Best Espresso Roastery',
                address: 'Via Torino 5'
            })
        }
    ],
    posts: [ //dati post fittizi
        {
            id: 'post1',
            data: () => ({
                text: 'I love espresso coffee!',
                uid: 'user123'
            })
        }
    ]
};

//mock di Firebase: sostituisce il vero database con uno fittizio controllabile
jest.mock('../../../src/config/firebase', () => ({ //quando un file importa Firebase, riceve questo oggetto finto
    db: { //simula l'oggetto database di Firestore
        collection: jest.fn((collectionName) => ({ //simula db.collection() - accesso dinamico alle collezioni
            get: jest.fn(() => Promise.resolve({ //simula .get() - recupero di tutti i dati
                docs: mockData[collectionName] || [] //restituisce i dati mockati per la collezione richiesta
            }))
        }))
    }
}));

describe('Search API - GET /api/search?q=term', () => { //gruppo di test per l'endpoint di ricerca
    it('dovrebbe ritornare risultati per query valida', async () => {
        const res = await request(app).get('/api/search?q=espresso'); //invia richiesta GET con query 'espresso'
        expect(res.status).toBe(200); //verifica che il server risponda con status 200 (successo)
        expect(Array.isArray(res.body)).toBe(true); //verifica che la risposta sia un array
        expect(res.body.length).toBeGreaterThan(0); //verifica che ci siano risultati
        //dovrebbe trovare utenti, bar, roasters e posts che contengono "espresso"
    });

    it('dovrebbe gestire query senza risultati', async () => {
        const res = await request(app).get('/api/search?q=nonexistent_xyz_123'); //invia richiesta GET con query inesistente
        expect(res.status).toBe(200); //verifica status 200 (la richiesta è valida anche se non trova nulla)
        expect(Array.isArray(res.body)).toBe(true); //verifica che la risposta sia un array
        //potrebbe essere vuoto o contenere pochi risultati
    });

    it('dovrebbe ritornare 400 se manca il parametro q', async () => {
        const res = await request(app).get('/api/search'); //invia richiesta GET senza parametro query
        expect(res.status).toBe(400); //verifica che il server risponda con errore 400 (bad request)
        expect(res.body).toHaveProperty('error'); //verifica che la risposta contenga il messaggio di errore
    });
});
