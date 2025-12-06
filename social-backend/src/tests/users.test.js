const request = require('supertest');
const app = require('../app');

// Mock Firebase
jest.mock('../firebase', () => {
    const mockGet = jest.fn();
    const mockDoc = jest.fn(() => ({ get: mockGet }));
    const mockCollection = jest.fn(() => ({ doc: mockDoc }));

    return {
        db: { collection: mockCollection },
        admin: { firestore: { FieldValue: { increment: jest.fn() } } },
        // Export mocks to control them in tests
        _mocks: { mockGet, mockDoc, mockCollection }
    };
});

// Import mocks after defining the mock factory
const { _mocks } = require('../firebase');
const { mockGet, mockDoc, mockCollection } = _mocks;

describe('Users API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GET /api/users/:uid returns user data when found', async () => {
        // Setup mock response
        mockGet.mockResolvedValue({
            exists: true,
            id: 'test-uid-123',
            data: () => ({
                name: 'Test User',
                email: 'test@example.com',
                role: 'user'
            })
        });

        const res = await request(app).get('/api/users/test-uid-123');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            uid: 'test-uid-123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user'
        });

        expect(mockCollection).toHaveBeenCalledWith('users');
        expect(mockDoc).toHaveBeenCalledWith('test-uid-123');
    });

    test('GET /api/users/:uid returns 404 when user does not exist', async () => {
        // Setup mock response for non-existent user
        mockGet.mockResolvedValue({ exists: false });

        const res = await request(app).get('/api/users/non-existent-uid');

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: "User not found" });
    });
});
