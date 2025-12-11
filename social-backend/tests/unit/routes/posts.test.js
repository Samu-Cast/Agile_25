// backend/tests/unit/routes/posts.test.js
const request = require('supertest'); //libreria per simulare richieste HTTP all'app Express
const app = require('../../../src/app'); //importo l'applicazione Express da testare

// Mock Data Store - Simulazione database in memoria
let mockPostsData = {}; //memorizza i post di test - struttura: { 'postId': { id, uid, text, votes, votedBy, ... } }
let mockUsersData = {}; //memorizza gli utenti di test
let mockSavedPostsData = {}; //memorizza i post salvati per utente - struttura: { 'uid': { 'postId': { savedAt, postId } } }

// Mock Firebase - Sostituisce il vero database con uno fittizio controllabile
jest.mock('../../../src/config/firebase', () => { //quando un file importa Firebase, riceve questo oggetto finto
    const mockAdmin = {
        firestore: {
            FieldValue: { //funzioni speciali di Firestore
                increment: jest.fn((value) => ({ _increment: value })) //incrementa contatori atomicamente
            }
        }
    };

    return {
        admin: mockAdmin,
        db: {
            collection: jest.fn((collectionName) => {
                if (collectionName === 'posts') {
                    return {
                        get: jest.fn(() => {
                            const docs = Object.values(mockPostsData).map(data => ({
                                id: data.id,
                                data: () => data
                            }));
                            return Promise.resolve({ docs });
                        }),
                        orderBy: jest.fn(() => ({
                            get: jest.fn(() => {
                                const docs = Object.values(mockPostsData).map(data => ({
                                    id: data.id,
                                    data: () => data
                                }));
                                return Promise.resolve({ docs });
                            })
                        })),
                        doc: jest.fn((postId) => ({
                            get: jest.fn(() => {
                                const data = mockPostsData[postId];
                                return Promise.resolve({
                                    exists: !!data,
                                    id: postId,
                                    data: () => data
                                });
                            }),
                            update: jest.fn((updates) => {
                                if (mockPostsData[postId]) {
                                    mockPostsData[postId] = { ...mockPostsData[postId], ...updates };
                                }
                                return Promise.resolve();
                            }),
                            collection: jest.fn((subCol) => {
                                if (subCol === 'comments') {
                                    return {
                                        orderBy: jest.fn(() => ({
                                            get: jest.fn(() => Promise.resolve({ docs: [] }))
                                        })),
                                        add: jest.fn((comment) => {
                                            return Promise.resolve({ id: 'new-comment-id' });
                                        })
                                    };
                                }
                                return {};
                            })
                        })),
                        add: jest.fn((data) => Promise.resolve({ id: 'new-post-id' }))
                    };
                }
                if (collectionName === 'users') {
                    return {
                        doc: jest.fn((uid) => ({
                            collection: jest.fn((subCol) => {
                                if (subCol === 'savedPosts') {
                                    return {
                                        doc: jest.fn((postId) => ({
                                            get: jest.fn(() => {
                                                const saved = mockSavedPostsData[uid] || {};
                                                return Promise.resolve({
                                                    exists: !!saved[postId],
                                                    data: () => saved[postId] || {}
                                                });
                                            }),
                                            set: jest.fn((data) => {
                                                if (!mockSavedPostsData[uid]) mockSavedPostsData[uid] = {};
                                                mockSavedPostsData[uid][postId] = data;
                                                return Promise.resolve();
                                            }),
                                            delete: jest.fn(() => {
                                                if (mockSavedPostsData[uid]) {
                                                    delete mockSavedPostsData[uid][postId];
                                                }
                                                return Promise.resolve();
                                            })
                                        }))
                                    };
                                }
                                return {};
                            })
                        }))
                    };
                }
                return {};
            })
        }
    };
});

describe('Posts API - GET /api/posts', () => { //gruppo di test per recuperare lista di post
    beforeEach(() => { //prepara 2 post di test
        mockPostsData = {
            'post1': {
                id: 'post1',
                uid: 'user123',
                text: 'First test post',
                likesCount: 0,
                commentsCount: 0,
                votedBy: {},
                createdAt: { toDate: () => new Date('2024-01-01') }
            },
            'post2': {
                id: 'post2',
                uid: 'user456',
                text: 'Second test post',
                likesCount: 5,
                commentsCount: 2,
                votedBy: {},
                createdAt: { toDate: () => new Date('2024-01-02') }
            }
        };
    });

    it('dovrebbe ritornare tutti i post', async () => {
        const res = await request(app).get('/api/posts'); //invia GET
        expect(res.status).toBe(200); //verifica status 200
        expect(Array.isArray(res.body)).toBe(true); //verifica che sia un array
        expect(res.body.length).toBe(2); //verifica 2 post
    });
});

describe('Posts API - POST /api/posts', () => { //gruppo di test per creare un nuovo post
    beforeEach(() => {
        mockPostsData = {};
    });

    it('dovrebbe creare post con dati validi', async () => {
        const res = await request(app)
            .post('/api/posts') //invia POST per creare post
            .send({
                uid: 'user123',
                text: 'New post content',
                entityType: 'user',
                entityId: 'user123'
            });
        expect(res.status).toBe(200); //verifica successo
        expect(res.body).toHaveProperty('id'); //verifica che abbia un ID
    });

    it('dovrebbe fallire se manca text', async () => {
        const res = await request(app)
            .post('/api/posts') //invia POST senza text
            .send({ uid: 'user123' });
        expect(res.status).toBe(400); //verifica errore 400
    });

    it('dovrebbe fallire se manca uid', async () => {
        const res = await request(app)
            .post('/api/posts') //invia POST senza uid
            .send({ text: 'Post without uid' });
        expect(res.status).toBe(400);
    });
});

describe('Posts API - POST /api/posts/:postId/comments', () => { //gruppo di test per aggiungere commenti ai post
    beforeEach(() => {
        mockPostsData = {
            'post1': { id: 'post1', uid: 'user123', commentsCount: 0 }
        };
    });

    it('dovrebbe aggiungere commento con dati validi', async () => {
        const res = await request(app)
            .post('/api/posts/post1/comments')
            .send({ uid: 'user123', text: 'Nuovo commento' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id');
    });

    it('dovrebbe fallire se mancano uid o text', async () => {
        const res = await request(app)
            .post('/api/posts/post1/comments')
            .send({ text: 'Manca uid' });
        expect(res.status).toBe(400);
    });
});

describe('Posts API - POST /api/posts/:postId/like', () => { //gruppo di test per votare post (upvote/downvote)
    beforeEach(() => {
        mockPostsData = {
            'post1': { id: 'post1', uid: 'user123', votedBy: {}, votes: 0 }
        };
    });

    it('dovrebbe aggiungere upvote', async () => {
        const res = await request(app)
            .post('/api/posts/post1/like') //invia POST per upvote
            .send({ uid: 'user123', value: 1 });
        expect(res.status).toBe(200); //verifica successo
        expect(res.body.message).toBe('Vote updated');
    });

    it('dovrebbe aggiungere downvote', async () => {
        const res = await request(app)
            .post('/api/posts/post1/like') //invia POST per downvote
            .send({ uid: 'user123', value: -1 });
        expect(res.status).toBe(200); //verifica successo
        expect(res.body.message).toBe('Vote updated');
    });

    it('dovrebbe fallire se manca value', async () => {
        const res = await request(app)
            .post('/api/posts/post1/like') //invia POST senza value
            .send({ uid: 'user123' });
        expect(res.status).toBe(400); //verifica errore 400
    });
});

describe('Posts API - DELETE /api/posts/:postId/like', () => { //gruppo di test per rimuovere voto da post
    it('dovrebbe rimuovere like da post', async () => {
        mockPostsData = {
            'post1': {
                id: 'post1',
                uid: 'author123',
                votedBy: { 'user123': 1 },
                votes: 1
            }
        };

        const res = await request(app)
            .delete('/api/posts/post1/like') //invia DELETE per rimuovere voto
            .send({ uid: 'user123' });

        expect(res.status).toBe(200); //verifica successo
        expect(res.body.message).toBe('Vote removed'); //verifica messaggio
    });
});

describe('Posts API - POST /api/posts/:postId/save', () => { //gruppo di test per salvare post
    beforeEach(() => {
        mockPostsData = {
            'post1': { id: 'post1', uid: 'author123', text: 'Post to save' }
        };
    });

    it('dovrebbe salvare post con successo', async () => {
        const res = await request(app)
            .post('/api/posts/post1/save') //invia POST per salvare post
            .send({ uid: 'user123' });
        expect(res.status).toBe(200); //verifica successo
        expect(res.body.message).toBe('Post saved successfully');
    });

    it('dovrebbe fallire se manca uid', async () => {
        const res = await request(app)
            .post('/api/posts/post1/save') //invia POST senza uid
            .send({});
        expect(res.status).toBe(400); //verifica errore 400
    });
});

describe('Posts API - DELETE /api/posts/:postId/save', () => { //gruppo di test per rimuovere post salvato
    beforeEach(() => {
        mockPostsData = {
            'post1': { id: 'post1', uid: 'author123' }
        };
        // User has already saved this post
        mockSavedPostsData = {
            'user123': {
                'post1': { savedAt: new Date(), postId: 'post1' }
            }
        };
    });

    it('dovrebbe rimuovere post salvato', async () => {
        const res = await request(app)
            .delete('/api/posts/post1/save') //invia DELETE per rimuovere
            .send({ uid: 'user123' });
        expect(res.status).toBe(200); //verifica successo
        expect(res.body.message).toBe('Post unsaved successfully'); //verifica messaggio
    });

    it('dovrebbe fallire se manca uid', async () => {
        const res = await request(app)
            .delete('/api/posts/post1/save')
            .send({});
        expect(res.status).toBe(400);
    });
});

describe('Posts API - POST /api/posts/:postId/coffee', () => { //gruppo di test per offrire caffè virtuale
    beforeEach(() => {
        mockPostsData = {
            'post1': {
                id: 'post1',
                uid: 'author123',
                coffeeBy: [], // Array, not object!
                coffeeCount: 0
            }
        };
    });

    it('dovrebbe aggiungere coffee con successo', async () => {
        const res = await request(app)
            .post('/api/posts/post1/coffee') //invia POST per offrire caffè
            .send({ uid: 'user123' });
        expect(res.status).toBe(200); //verifica successo
        expect(res.body.message).toBe('Coffee added');
    });

    it('dovrebbe fallire se manca uid', async () => {
        const res = await request(app)
            .post('/api/posts/post1/coffee')
            .send({});
        expect(res.status).toBe(400);
    });
});

describe('Posts API - DELETE /api/posts/:postId/coffee', () => { //gruppo di test per rimuovere caffè
    beforeEach(() => {
        mockPostsData = {
            'post1': {
                id: 'post1',
                uid: 'author123',
                coffeeBy: ['user123'], // Array with user already present
                coffeeCount: 1
            }
        };
    });

    it('dovrebbe rimuovere coffee', async () => {
        const res = await request(app)
            .delete('/api/posts/post1/coffee')
            .send({ uid: 'user123' });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Coffee removed');
    });

    it('dovrebbe fallire se manca uid', async () => {
        const res = await request(app)
            .delete('/api/posts/post1/coffee')
            .send({});
        expect(res.status).toBe(400);
    });
});

describe('Posts API - POST /api/posts/:postId/rating', () => { //gruppo di test per aggiungere/aggiornare rating post
    beforeEach(() => {
        mockPostsData = {
            'post1': {
                id: 'post1',
                uid: 'author123',
                ratingBy: {},
                averageRating: 0,
                ratingCount: 0
            }
        };
    });

    it('dovrebbe aggiungere rating (1-5)', async () => {
        const res = await request(app)
            .post('/api/posts/post1/rating') //invia POST per aggiungere rating
            .send({ uid: 'user123', rating: 5 });
        expect(res.status).toBe(200); //verifica successo
        expect(res.body.message).toBe('Rating updated'); //verifica messaggio
    });

    it('dovrebbe aggiornare rating esistente', async () => {
        mockPostsData['post1'].ratingBy = { 'user123': 3 };
        const res = await request(app)
            .post('/api/posts/post1/rating')
            .send({ uid: 'user123', rating: 5 });
        expect(res.status).toBe(200);
    });

    it('dovrebbe fallire se manca rating', async () => {
        const res = await request(app)
            .post('/api/posts/post1/rating')
            .send({ uid: 'user123' });
        expect(res.status).toBe(400);
    });

    it('dovrebbe fallire se manca uid', async () => {
        const res = await request(app)
            .post('/api/posts/post1/rating')
            .send({ rating: 5 });
        expect(res.status).toBe(400);
    });
});
