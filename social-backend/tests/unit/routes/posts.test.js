// backend/tests/unit/routes/posts.test.js
const request = require('supertest');
const app = require('../../../src/app');

// Mock Data Store to simulate DB state across tests
let mockPostsData = {};

// Mock Firebase
jest.mock('../../../src/config/firebase', () => {
    const mockAdmin = {
        firestore: {
            FieldValue: {
                increment: jest.fn((value) => ({ _increment: value }))
            }
        }
    };

    return {
        admin: mockAdmin,
        db: {
            collection: jest.fn((collectionName) => {
                if (collectionName === 'posts') {
                    return {
                        // For GET /api/posts (no filters)
                        get: jest.fn(() => {
                            const docs = Object.values(mockPostsData).map(data => ({
                                id: data.id,
                                data: () => data
                            }));
                            return Promise.resolve({ docs });
                        }),
                        // For GET /api/posts (with orderBy)
                        orderBy: jest.fn(() => ({
                            get: jest.fn(() => {
                                const docs = Object.values(mockPostsData).map(data => ({
                                    id: data.id,
                                    data: () => data
                                }));
                                return Promise.resolve({ docs });
                            })
                        })),
                        // Access specific post
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
                                    // Simple merge for simulation
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
                return {};
            })
        }
    };
});

describe('Posts API - GET /api/posts', () => {
    beforeEach(() => {
        // Reset mock data
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
        const res = await request(app).get('/api/posts');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
    });
});

describe('Posts API - POST /api/posts/:postId/comments', () => {
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

describe('Posts API - POST /api/posts/:postId/like', () => {
    beforeEach(() => {
        mockPostsData = {
            'post1': { id: 'post1', uid: 'user123', votedBy: {}, votes: 0 }
        };
    });

    it('dovrebbe aggiungere like se non esiste', async () => {
        const res = await request(app)
            .post('/api/posts/post1/like')
            // FIX: Added 'value' which is required by the backend
            .send({ uid: 'user123', value: 1 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Vote updated');
    });
});

describe('Posts API - DELETE /api/posts/:postId/like', () => {
    it('dovrebbe rimuovere like da post', async () => {
        // Setup: User has already voted
        mockPostsData = {
            'post1': {
                id: 'post1',
                uid: 'author123',
                votedBy: { 'user123': 1 },
                votes: 1
            }
        };

        const res = await request(app)
            .delete('/api/posts/post1/like')
            .send({ uid: 'user123' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Vote removed');
    });
});
