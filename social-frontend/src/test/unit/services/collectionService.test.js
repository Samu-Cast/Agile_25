
import {
    getCollections,
    createCollection,
    updateCollection,
    deleteCollection
} from '../../../services/collectionService';



describe('collectionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockRoasterId = 'roaster123';
    const mockCollectionId = 'col123';
    const mockUid = 'user123';

    describe('getCollections', () => {
        it('should fetch collections for a roastery', async () => {
            const mockCollections = [{ id: '1', name: 'Summer' }];
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCollections
            });

            const result = await getCollections(mockRoasterId);

            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/roasters/${mockRoasterId}/collections`));
            expect(result).toEqual(mockCollections);
        });

        it('should return empty array on failure', async () => {
            global.fetch.mockResolvedValueOnce({ ok: false });
            const result = await getCollections(mockRoasterId);
            expect(result).toEqual([]);
        });
    });

    describe('createCollection', () => {
        it('should create a collection', async () => {
            const newCollection = { name: 'Winter', uid: mockUid };
            const mockResponse = { id: 'newId', ...newCollection };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await createCollection(mockRoasterId, newCollection);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/roasters/${mockRoasterId}/collections`),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(newCollection)
                })
            );
            expect(result).toEqual(mockResponse);
        });

        it('should throw error on creation failure', async () => {
            global.fetch.mockResolvedValueOnce({ ok: false });
            await expect(createCollection(mockRoasterId, {})).rejects.toThrow('Create collection failed');
        });
    });

    describe('updateCollection', () => {
        it('should update a collection', async () => {
            const updates = { name: 'Updated Name', uid: mockUid };
            const mockResponse = { id: mockCollectionId, ...updates };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await updateCollection(mockRoasterId, mockCollectionId, updates);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/roasters/${mockRoasterId}/collections/${mockCollectionId}`),
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(updates)
                })
            );
            expect(result).toEqual(mockResponse);
        });

        it('should throw error on update failure', async () => {
            global.fetch.mockResolvedValueOnce({ ok: false });
            await expect(updateCollection(mockRoasterId, mockCollectionId, {})).rejects.toThrow('Update collection failed');
        });
    });

    describe('deleteCollection', () => {
        it('should delete a collection', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

            const result = await deleteCollection(mockRoasterId, mockCollectionId, mockUid);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/roasters/${mockRoasterId}/collections/${mockCollectionId}`),
                expect.objectContaining({
                    method: 'DELETE',
                    body: JSON.stringify({ uid: mockUid })
                })
            );
            expect(result).toEqual({ success: true });
        });

        it('should throw error on delete failure', async () => {
            global.fetch.mockResolvedValueOnce({ ok: false });
            await expect(deleteCollection(mockRoasterId, mockCollectionId, mockUid)).rejects.toThrow('Delete collection failed');
        });
    });

    describe('getUserSavedCollections', () => {
        it('should fetch saved collections for a user', async () => {
            const { getUserSavedCollections } = require('../../../services/collectionService');
            const mockSavedCollections = [{ id: 'col1', name: 'My Saved', roasterName: 'Test Roaster' }];
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSavedCollections
            });

            const result = await getUserSavedCollections(mockUid);

            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/users/${mockUid}/savedCollections`));
            expect(result).toEqual(mockSavedCollections);
        });

        it('should return empty array on failure', async () => {
            const { getUserSavedCollections } = require('../../../services/collectionService');
            global.fetch.mockResolvedValueOnce({ ok: false });
            const result = await getUserSavedCollections(mockUid);
            expect(result).toEqual([]);
        });
    });

    describe('saveCollection', () => {
        it('should save a collection', async () => {
            const { saveCollection } = require('../../../services/collectionService');
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Collection saved successfully' })
            });

            const result = await saveCollection(mockUid, mockRoasterId, mockCollectionId);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/users/${mockUid}/savedCollections`),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ roasterId: mockRoasterId, collectionId: mockCollectionId })
                })
            );
            expect(result).toEqual({ message: 'Collection saved successfully' });
        });

        it('should throw error on save failure', async () => {
            const { saveCollection } = require('../../../services/collectionService');
            global.fetch.mockResolvedValueOnce({ ok: false });
            await expect(saveCollection(mockUid, mockRoasterId, mockCollectionId)).rejects.toThrow('Save collection failed');
        });
    });

    describe('unsaveCollection', () => {
        it('should unsave a collection', async () => {
            const { unsaveCollection } = require('../../../services/collectionService');
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Collection unsaved successfully' })
            });

            const result = await unsaveCollection(mockUid, mockCollectionId);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/users/${mockUid}/savedCollections/${mockCollectionId}`),
                expect.objectContaining({
                    method: 'DELETE'
                })
            );
            expect(result).toEqual({ message: 'Collection unsaved successfully' });
        });

        it('should throw error on unsave failure', async () => {
            const { unsaveCollection } = require('../../../services/collectionService');
            global.fetch.mockResolvedValueOnce({ ok: false });
            await expect(unsaveCollection(mockUid, mockCollectionId)).rejects.toThrow('Unsave collection failed');
        });
    });
});

