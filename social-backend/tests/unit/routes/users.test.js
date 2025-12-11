// ============================================================================
// TEST FILE: users.test.js
// ============================================================================
// Questo file contiene i test unitari per tutte le API degli utenti (users.js)
// Utilizza Jest come framework di testing e Supertest per simulare richieste HTTP
// ============================================================================

// Importa 'supertest' - libreria per testare API HTTP senza avviare un server reale
const request = require('supertest');

// Importa l'applicazione Express da testare (contiene tutte le route)
const app = require('../../../src/app');

// ============================================================================
// MOCK DATA STORE - Simulazione del database in memoria
// ============================================================================
// Questi oggetti simulano le collezioni Firebase durante i test
// Vengono resettati prima di ogni test per garantire isolamento

// Memorizza i dati degli utenti (collezione 'users')
// Struttura: { 'uid': { uid, nickname, email, role, stats, ... } }
let mockUsersData = {};

// Memorizza i follower di ogni utente (subcollection 'users/{uid}/followers')
// Struttura: { 'uid': { 'followerId': { followedAt: Date } } }
let mockFollowersData = {};

// Memorizza chi segue ogni utente (subcollection 'users/{uid}/following')
// Struttura: { 'uid': { 'followingId': { followedAt: Date } } }
let mockFollowingData = {};

// Memorizza i post salvati da ogni utente (subcollection 'users/{uid}/savedPosts')
// Struttura: { 'uid': { 'postId': { savedAt: Date, postId } } }
let mockSavedPostsData = {};

// Memorizza i post (collezione 'posts') - usato per test di relazioni
// Struttura: { 'postId': { id, uid, text, votes, votedBy, ... } }
let mockPostsData = {};

// ============================================================================
// MOCK FIREBASE - Simulazione completa di Firebase Admin SDK
// ============================================================================
// Jest sostituisce il vero modulo Firebase con questo mock durante i test
// Questo permette di testare la logica senza connettersi a un database reale
jest.mock('../../../src/config/firebase', () => {
    // ========================================================================
    // Mock di Firebase Admin - Simula le funzionalità di admin.firestore
    // ========================================================================
    const mockAdmin = {
        firestore: {
            // FieldValue.increment(n) - Usato per incrementare contatori atomicamente
            // Esempio: stats.followers: admin.firestore.FieldValue.increment(1)
            // Restituisce un oggetto con _increment per identificarlo nei test
            FieldValue: {
                increment: jest.fn((value) => ({ _increment: value }))
            },
            // FieldPath.documentId() - Usato per query sul document ID
            // Esempio: where(admin.firestore.FieldPath.documentId(), 'in', ['uid1', 'uid2'])
            // Restituisce '__name__' che è il campo speciale per l'ID del documento
            FieldPath: {
                documentId: () => '__name__'
            }
        }
    };

    return {
        // Esporta il mock di admin (già commentato sopra)
        admin: mockAdmin,

        // ====================================================================
        // Mock di Firebase Storage Bucket - Per upload di file (es: immagini profilo)
        // ====================================================================
        bucket: {
            name: 'test-bucket',  // Nome del bucket fittizio
            // file(path) - Crea un riferimento a un file
            file: jest.fn(() => ({
                // save(buffer) - Simula il salvataggio di un file
                // Nel codice reale carica il file su Google Cloud Storage
                // Nei test ritorna semplicemente una Promise risolta
                save: jest.fn(() => Promise.resolve())
            }))
        },

        // ====================================================================
        // Mock di Firestore Database - Cuore del mock
        // ====================================================================
        db: {
            // collection(name) - Accede a una collezione (tabella) del database
            // Esempio: db.collection('users') accede alla collezione utenti
            collection: jest.fn((collectionName) => {
                // ============================================================
                // COLLEZIONE 'users' - Gestisce tutti i dati degli utenti
                // ============================================================
                if (collectionName === 'users') {
                    return {
                        // --------------------------------------------------------
                        // GET - Recupera TUTTI gli utenti dalla collezione
                        // Uso: db.collection('users').get()
                        // --------------------------------------------------------
                        get: jest.fn(() => {
                            // Converte mockUsersData (oggetto) in array di documenti
                            const docs = Object.values(mockUsersData).map(data => ({
                                id: data.uid,        // ID del documento
                                data: () => data     // Funzione che restituisce i dati
                            }));
                            // Restituisce una Promise con i documenti
                            return Promise.resolve({ docs });
                        }),

                        // --------------------------------------------------------
                        // LIMIT - Limita il numero di risultati
                        // Uso: db.collection('users').limit(20).get()
                        // --------------------------------------------------------
                        limit: jest.fn(() => ({
                            get: jest.fn(() => {
                                // Prende solo i primi 20 utenti
                                const docs = Object.values(mockUsersData).slice(0, 20).map(data => ({
                                    id: data.uid,
                                    data: () => data
                                }));
                                return Promise.resolve({ docs });
                            })
                        })),

                        // --------------------------------------------------------
                        // WHERE - Filtra i documenti in base a condizioni
                        // Uso: db.collection('users').where('email', '==', 'test@example.com')
                        // --------------------------------------------------------
                        where: jest.fn((field, op, value) => {
                            const filterDocs = () => {
                                return Object.values(mockUsersData)
                                    .filter(u => {
                                        if (field === '__name__' && op === 'in') {
                                            return value.includes(u.uid);
                                        }
                                        if (field === 'email' && op === '==') {
                                            return u.email === value;
                                        }
                                        if (op === '>=') {
                                            const fieldValue = (u[field] || '').toString().toLowerCase();
                                            const searchValue = value.toString().toLowerCase();
                                            return fieldValue >= searchValue;
                                        }
                                        if (op === '<=') {
                                            const fieldValue = (u[field] || '').toString().toLowerCase();
                                            const searchValue = value.toString().toLowerCase();
                                            return fieldValue <= searchValue + '\uf8ff';
                                        }
                                        return false;
                                    })
                                    .map(data => ({
                                        id: data.uid,
                                        data: () => data
                                    }));
                            };

                            return {
                                where: jest.fn((field2, op2, value2) => ({
                                    get: jest.fn(() => {
                                        const docs = filterDocs();
                                        return Promise.resolve({
                                            docs,
                                            forEach: (callback) => docs.forEach(callback)
                                        });
                                    })
                                })),
                                get: jest.fn(() => {
                                    const docs = filterDocs();
                                    return Promise.resolve({
                                        docs,
                                        forEach: (callback) => docs.forEach(callback)
                                    });
                                })
                            };
                        }),
                        doc: jest.fn((uid) => {
                            const docRef = {
                                _docId: uid, // Store the doc ID for transaction access
                                _path: uid,
                                get: jest.fn(() => {
                                    const data = mockUsersData[uid];
                                    return Promise.resolve({
                                        exists: !!data,
                                        id: uid,
                                        data: () => data,
                                        ref: { _path: uid, _docId: uid }
                                    });
                                }),
                                set: jest.fn((data, options) => {
                                    if (options?.merge) {
                                        mockUsersData[uid] = { ...mockUsersData[uid], ...data, uid };
                                    } else {
                                        mockUsersData[uid] = { ...data, uid };
                                    }
                                    return Promise.resolve();
                                }),
                                update: jest.fn((updates) => {
                                    if (mockUsersData[uid]) {
                                        mockUsersData[uid] = { ...mockUsersData[uid], ...updates };
                                    }
                                    return Promise.resolve();
                                }),
                                collection: jest.fn((subCol) => {
                                    if (subCol === 'followers') {
                                        return {
                                            get: jest.fn(() => {
                                                const followers = mockFollowersData[uid] || {};
                                                const docs = Object.keys(followers).map(fid => ({
                                                    id: fid,
                                                    data: () => followers[fid]
                                                }));
                                                return Promise.resolve({ docs });
                                            }),
                                            doc: jest.fn((followerId) => ({
                                                get: jest.fn(() => {
                                                    const data = mockFollowersData[uid]?.[followerId];
                                                    return Promise.resolve({
                                                        exists: !!data,
                                                        data: () => data
                                                    });
                                                }),
                                                set: jest.fn((data) => {
                                                    if (!mockFollowersData[uid]) mockFollowersData[uid] = {};
                                                    mockFollowersData[uid][followerId] = data;
                                                    return Promise.resolve();
                                                }),
                                                delete: jest.fn(() => {
                                                    if (mockFollowersData[uid]) {
                                                        delete mockFollowersData[uid][followerId];
                                                    }
                                                    return Promise.resolve();
                                                })
                                            }))
                                        };
                                    }
                                    if (subCol === 'following') {
                                        return {
                                            get: jest.fn(() => {
                                                const following = mockFollowingData[uid] || {};
                                                const docs = Object.keys(following).map(fid => ({
                                                    id: fid,
                                                    data: () => following[fid]
                                                }));
                                                return Promise.resolve({ docs });
                                            }),
                                            doc: jest.fn((followingId) => ({
                                                get: jest.fn(() => {
                                                    const data = mockFollowingData[uid]?.[followingId];
                                                    return Promise.resolve({
                                                        exists: !!data,
                                                        data: () => data
                                                    });
                                                }),
                                                set: jest.fn((data) => {
                                                    if (!mockFollowingData[uid]) mockFollowingData[uid] = {};
                                                    mockFollowingData[uid][followingId] = data;
                                                    return Promise.resolve();
                                                }),
                                                delete: jest.fn(() => {
                                                    if (mockFollowingData[uid]) {
                                                        delete mockFollowingData[uid][followingId];
                                                    }
                                                    return Promise.resolve();
                                                })
                                            }))
                                        };
                                    }
                                    if (subCol === 'savedPosts') {
                                        return {
                                            get: jest.fn(() => {
                                                const saved = mockSavedPostsData[uid] || {};
                                                const docs = Object.keys(saved).map(pid => ({
                                                    id: pid,
                                                    data: () => saved[pid]
                                                }));
                                                return Promise.resolve({ docs });
                                            }),
                                            orderBy: jest.fn(() => ({
                                                get: jest.fn(() => {
                                                    const saved = mockSavedPostsData[uid] || {};
                                                    const docs = Object.keys(saved).map(pid => ({
                                                        id: pid,
                                                        data: () => saved[pid]
                                                    }));
                                                    return Promise.resolve({ docs });
                                                })
                                            }))
                                        };
                                    }
                                    return {};
                                })
                            };
                            return docRef;
                        })
                    };
                }
                if (collectionName === 'posts') {
                    return {
                        get: jest.fn(() => {
                            const docs = Object.values(mockPostsData).map(data => ({
                                id: data.id,
                                data: () => data
                            }));
                            return Promise.resolve({ docs });
                        }),
                        doc: jest.fn((postId) => ({
                            get: jest.fn(() => {
                                const data = mockPostsData[postId];
                                return Promise.resolve({
                                    exists: !!data,
                                    id: postId,
                                    data: () => data
                                });
                            }),
                            collection: jest.fn((subCol) => {
                                if (subCol === 'likes') {
                                    return {
                                        doc: jest.fn((userId) => ({
                                            get: jest.fn(() => Promise.resolve({ exists: false }))
                                        }))
                                    };
                                }
                                return {};
                            })
                        }))
                    };
                }
                return {};
            }),
            runTransaction: jest.fn(async (callback) => {
                const transaction = {
                    get: jest.fn((ref) => {
                        // Extract uid from DocumentReference
                        const uid = ref._docId || ref._path || ref.id || 'user123';
                        const data = mockUsersData[uid];
                        return Promise.resolve({
                            exists: !!data,
                            id: uid,
                            data: () => data || {}
                        });
                    }),
                    set: jest.fn((ref, data) => {
                        // Handle subcollection sets
                        return Promise.resolve();
                    }),
                    update: jest.fn((ref, updates) => {
                        const uid = ref._docId || ref._path || ref.id;
                        if (mockUsersData[uid]) {
                            // Handle stats.followers increment
                            if (updates['stats.followers']) {
                                const increment = updates['stats.followers']._increment || 0;
                                if (!mockUsersData[uid].stats) mockUsersData[uid].stats = {};
                                mockUsersData[uid].stats.followers = (mockUsersData[uid].stats.followers || 0) + increment;
                            }
                            if (updates['stats.following']) {
                                const increment = updates['stats.following']._increment || 0;
                                if (!mockUsersData[uid].stats) mockUsersData[uid].stats = {};
                                mockUsersData[uid].stats.following = (mockUsersData[uid].stats.following || 0) + increment;
                            }
                        }
                        return Promise.resolve();
                    }),
                    delete: jest.fn(() => Promise.resolve())
                };
                return callback(transaction);
            }),
            getAll: jest.fn((...refs) => {
                return Promise.resolve(refs.map(ref => {
                    const postId = ref._postId || ref.id || 'post1';
                    const data = mockPostsData[postId];
                    return {
                        exists: !!data,
                        id: postId,
                        data: () => data || {}
                    };
                }));
            })
        }
    };
});

describe('Users API - GET /api/users/:uid', () => {
    beforeEach(() => {
        mockUsersData = {
            'user123': {
                uid: 'user123',
                name: 'Test User',
                email: 'test@test.com',
                nickname: 'testuser',
                role: 'Appassionato',
                stats: { followers: 10, following: 5, posts: 3 }
            }
        };
    });

    it('dovrebbe ritornare utente quando UID esiste', async () => {
        const res = await request(app).get('/api/users/user123');
        expect(res.status).toBe(200);
        expect(res.body.uid).toBe('user123');
        expect(res.body.name).toBe('Test User');
    });

    it('dovrebbe ritornare 404 per utente non esistente', async () => {
        const res = await request(app).get('/api/users/nonexistent');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('User not found');
    });
});

describe('Users API - GET /api/users (lista)', () => {
    beforeEach(() => {
        mockUsersData = {
            'user1': { uid: 'user1', name: 'User One', email: 'user1@test.com' },
            'user2': { uid: 'user2', name: 'User Two', email: 'user2@test.com' }
        };
    });

    it('dovrebbe ritornare array di utenti', async () => {
        const res = await request(app).get('/api/users');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
    });
});

describe('Users API - POST /api/users (Create)', () => {
    beforeEach(() => {
        mockUsersData = {};
    });

    it('dovrebbe creare utente con dati validi', async () => {
        const res = await request(app)
            .post('/api/users')
            .send({
                uid: 'newuser',
                name: 'New User',
                email: 'new@test.com',
                role: 'Appassionato'
            });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User created/updated successfully');
        expect(mockUsersData['newuser']).toBeDefined();
    });

    it('dovrebbe ritornare 400 se manca uid', async () => {
        const res = await request(app)
            .post('/api/users')
            .send({ name: 'No UID User' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Missing uid');
    });
});

describe('Users API - PUT /api/users/:uid (Update)', () => {
    beforeEach(() => {
        mockUsersData = {
            'user123': {
                uid: 'user123',
                name: 'Old Name',
                email: 'old@test.com',
                profilePic: 'https://old.com/pic.jpg'
            }
        };
    });

    it('dovrebbe aggiornare profilo utente', async () => {
        const res = await request(app)
            .put('/api/users/user123')
            .send({ name: 'Updated Name', bio: 'New bio' });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User updated successfully');
        expect(mockUsersData['user123'].name).toBe('Updated Name');
    });

    it('dovrebbe gestire URL profilePic', async () => {
        const res = await request(app)
            .put('/api/users/user123')
            .send({ profilePic: 'https://new.com/pic.jpg' });
        expect(res.status).toBe(200);
        expect(mockUsersData['user123'].profilePic).toBe('https://new.com/pic.jpg');
    });
});

describe('Users API - POST /api/users/batch', () => {
    beforeEach(() => {
        mockUsersData = {
            'user1': { uid: 'user1', name: 'User One' },
            'user2': { uid: 'user2', name: 'User Two' },
            'user3': { uid: 'user3', name: 'User Three' }
        };
    });

    it('dovrebbe ritornare utenti per UIDs validi', async () => {
        const res = await request(app)
            .post('/api/users/batch')
            .send({ uids: ['user1', 'user2'] });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
    });

    it('dovrebbe ritornare array vuoto se uids è vuoto', async () => {
        const res = await request(app)
            .post('/api/users/batch')
            .send({ uids: [] });
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('dovrebbe ritornare array vuoto se uids manca', async () => {
        const res = await request(app)
            .post('/api/users/batch')
            .send({});
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

describe('Users API - POST /api/users/:uid/follow', () => {
    beforeEach(() => {
        mockUsersData = {
            'user1': { uid: 'user1', stats: { followers: 0, following: 0 } },
            'user2': { uid: 'user2', stats: { followers: 0, following: 0 } }
        };
        mockFollowersData = {};
        mockFollowingData = {};
    });

    it('dovrebbe seguire utente con successo', async () => {
        const res = await request(app)
            .post('/api/users/user2/follow')
            .send({ currentUid: 'user1' });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Followed successfully');
    });

    it('dovrebbe ritornare 400 se si tenta di seguire se stessi', async () => {
        const res = await request(app)
            .post('/api/users/user1/follow')
            .send({ currentUid: 'user1' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Cannot follow yourself');
    });

    it('dovrebbe ritornare 400 se manca currentUid', async () => {
        const res = await request(app)
            .post('/api/users/user2/follow')
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Missing uid or currentUid');
    });
});

describe('Users API - POST /api/users/:uid/unfollow', () => {
    beforeEach(() => {
        mockUsersData = {
            'user1': { uid: 'user1', stats: { followers: 0, following: 1 } },
            'user2': { uid: 'user2', stats: { followers: 1, following: 0 } }
        };
        mockFollowersData = { 'user2': { 'user1': { uid: 'user1' } } };
        mockFollowingData = { 'user1': { 'user2': { uid: 'user2' } } };
    });

    it('dovrebbe smettere di seguire utente con successo', async () => {
        const res = await request(app)
            .post('/api/users/user2/unfollow')
            .send({ currentUid: 'user1' });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Unfollowed successfully');
    });

    it('dovrebbe ritornare 400 se manca currentUid', async () => {
        const res = await request(app)
            .post('/api/users/user2/unfollow')
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Missing uid or currentUid');
    });
});

describe('Users API - GET /api/users/:uid/checkFollow/:targetUid', () => {
    beforeEach(() => {
        mockFollowingData = {
            'user1': { 'user2': { uid: 'user2' } }
        };
    });

    it('dovrebbe ritornare true se sta seguendo', async () => {
        const res = await request(app).get('/api/users/user1/checkFollow/user2');
        expect(res.status).toBe(200);
        expect(res.body.isFollowing).toBe(true);
    });

    it('dovrebbe ritornare false se non sta seguendo', async () => {
        const res = await request(app).get('/api/users/user1/checkFollow/user3');
        expect(res.status).toBe(200);
        expect(res.body.isFollowing).toBe(false);
    });
});

describe('Users API - GET /api/users/:uid/followers', () => {
    beforeEach(() => {
        mockFollowersData = {
            'user1': {
                'follower1': { uid: 'follower1' },
                'follower2': { uid: 'follower2' }
            }
        };
    });

    it('dovrebbe ritornare array di follower IDs', async () => {
        const res = await request(app).get('/api/users/user1/followers');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body).toContain('follower1');
    });
});

describe('Users API - GET /api/users/:uid/following', () => {
    beforeEach(() => {
        mockFollowingData = {
            'user1': {
                'following1': { uid: 'following1' },
                'following2': { uid: 'following2' }
            }
        };
    });

    it('dovrebbe ritornare array di following IDs', async () => {
        const res = await request(app).get('/api/users/user1/following');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body).toContain('following1');
    });
});

describe('Users API - GET /api/users/:uid/votedPosts', () => {
    beforeEach(() => {
        mockPostsData = {
            'post1': {
                id: 'post1',
                text: 'Post 1',
                votedBy: { 'user1': 1 },
                createdAt: { toDate: () => new Date() }
            },
            'post2': {
                id: 'post2',
                text: 'Post 2',
                votedBy: { 'user1': -1 },
                createdAt: { toDate: () => new Date() }
            },
            'post3': {
                id: 'post3',
                text: 'Post 3',
                votedBy: { 'user2': 1 },
                createdAt: { toDate: () => new Date() }
            }
        };
    });

    it('dovrebbe ritornare post con upvote (type=1)', async () => {
        const res = await request(app).get('/api/users/user1/votedPosts?type=1');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].id).toBe('post1');
    });

    it('dovrebbe ritornare post con downvote (type=-1)', async () => {
        const res = await request(app).get('/api/users/user1/votedPosts?type=-1');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].id).toBe('post2');
    });

    it('dovrebbe ritornare 400 per type invalido', async () => {
        const res = await request(app).get('/api/users/user1/votedPosts?type=invalid');
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid vote type');
    });
});

describe('Users API - GET /api/users/:uid/savedPosts', () => {
    beforeEach(() => {
        mockSavedPostsData = {
            'user1': {
                'post1': { savedAt: new Date() },
                'post2': { savedAt: new Date() }
            }
        };
    });

    it('dovrebbe ritornare array di post IDs salvati', async () => {
        const res = await request(app).get('/api/users/user1/savedPosts');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body).toContain('post1');
    });
});

describe('Users API - GET /api/users/:uid/savedPosts/details', () => {
    beforeEach(() => {
        mockSavedPostsData = {
            'user1': {
                'post1': { savedAt: new Date() }
            }
        };
        mockPostsData = {
            'post1': {
                id: 'post1',
                text: 'Saved Post',
                uid: 'author1',
                createdAt: { toDate: () => new Date() }
            }
        };
    });

    it('dovrebbe ritornare dettagli dei post salvati', async () => {
        const res = await request(app).get('/api/users/user1/savedPosts/details');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].id).toBe('post1');
        expect(res.body[0]).toHaveProperty('userVote');
    });
});

describe('Users API - GET /api/users/search', () => {
    beforeEach(() => {
        mockUsersData = {
            'user1': { uid: 'user1', name: 'John Doe', nickname: 'johndoe', email: 'john@test.com', role: 'Appassionato' },
            'user2': { uid: 'user2', name: 'Jane Smith', nickname: 'janesmith', email: 'jane@test.com', role: 'Barista' }
        };
    });

    it('dovrebbe cercare utenti per nickname', async () => {
        const res = await request(app).get('/api/users/search?q=john');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('dovrebbe ritornare array vuoto per query troppo corta', async () => {
        const res = await request(app).get('/api/users/search?q=j');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('dovrebbe filtrare per ruolo', async () => {
        const res = await request(app).get('/api/users/search?q=jane&role=Barista');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
