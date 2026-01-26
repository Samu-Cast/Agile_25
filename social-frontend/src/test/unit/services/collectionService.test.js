
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
});
