
import { getCommunitiesByIds, getCommunity, getAllCommunities } from '../../../services/communityService';



describe('communityService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset cache if possible, but since it's a module level variable, ensures tests mock fetch responses correctly
        // Note: Module level cache persists across tests in the same file unless reset. 
        // For clean tests we might need to rely on mocking fetch or assume cache is empty initially.
        // Actually, since we can't easily reset the module-scope variable `communityCache` without exporting it or a reset function,
        // we should write tests understanding that subsequent calls might hit cache.
        // Ideally we would add a resetCache function to the service for testing, but let's try to write tests that are robust first.
    });

    describe('getCommunity', () => {
        it('should fetch community if not in cache', async () => {
            const mockCommunity = { id: 'c1', name: 'Coffee Lovers' };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCommunity
            });

            // Use a unique ID to avoid cache from other tests if order matters
            const result = await getCommunity('c1');

            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/communities/c1'));
            expect(result).toEqual(mockCommunity);
        });

        it('should return null on error', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false
            });

            const result = await getCommunity('invalid');
            expect(result).toBeNull();
        });
    });

    describe('getAllCommunities', () => {
        it('should fetch all communities', async () => {
            const mockCommunities = [{ id: 'c1', name: 'Coffee' }, { id: 'c2', name: 'Tea' }];
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCommunities
            });

            const result = await getAllCommunities();
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/communities'));
            expect(result).toEqual(mockCommunities);
        });

        it('should return empty array on error', async () => {
            global.fetch.mockResolvedValueOnce({ ok: false });
            const result = await getAllCommunities();
            expect(result).toEqual([]);
        });
    });

    describe('getCommunitiesByIds', () => {
        it('should fetch missing communities individually', async () => {
            const mockCommunity1 = { id: 'new1', name: 'New 1' };
            const mockCommunity2 = { id: 'new2', name: 'New 2' };

            // Mock sequential calls
            global.fetch
                .mockResolvedValueOnce({ ok: true, json: async () => mockCommunity1 })
                .mockResolvedValueOnce({ ok: true, json: async () => mockCommunity2 });

            const result = await getCommunitiesByIds(['new1', 'new2']);

            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(result).toContainEqual(mockCommunity1);
            expect(result).toContainEqual(mockCommunity2);
        });

        it('should handle partial failures', async () => {
            const mockCommunity = { id: 'valid', name: 'Valid' };

            global.fetch
                .mockResolvedValueOnce({ ok: true, json: async () => mockCommunity }) // for 'valid'
                .mockResolvedValueOnce({ ok: false }); // for 'invalid'

            const result = await getCommunitiesByIds(['valid', 'invalid']);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockCommunity);
        });
    });
});
