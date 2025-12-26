const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// In-memory cache for community details
const communityCache = new Map();

/**
 * Get community details for a list of IDs.
 * @param {Array<string>} ids - List of community IDs.
 * @returns {Promise<Array>} - List of community details.
 */
export const getCommunitiesByIds = async (ids) => {
    try {
        const uniqueIds = [...new Set(ids)];
        const missingIds = uniqueIds.filter(id => !communityCache.has(id));

        // Since we don't have a batch endpoint for communities yet, we might have to fetch individually
        // OR fetch all if not too many (Sidebar does this).
        // For efficiency in this specific social app context (usually few hundred communities max initially),
        // we could just fetch ALL if cache is empty, or fetch individually.
        // Let's implement individual fetch for missing ones for now, parallelized.

        if (missingIds.length > 0) {
            const fetchPromises = missingIds.map(async (id) => {
                try {
                    const response = await fetch(`${API_URL}/communities/${id}`);
                    if (response.ok) {
                        const data = await response.json();
                        communityCache.set(id, data);
                        return data;
                    }
                } catch (e) {
                    console.error(`Failed to fetch community ${id}`, e);
                }
                return null;
            });
            await Promise.all(fetchPromises);
        }

        // Return from cache
        return uniqueIds.map(id => communityCache.get(id)).filter(c => c !== undefined);
    } catch (error) {
        console.error("Error fetching communities by IDs:", error);
        return [];
    }
};

/**
 * Get a single community from cache or API
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
export const getCommunity = async (id) => {
    if (communityCache.has(id)) return communityCache.get(id);
    try {
        const response = await fetch(`${API_URL}/communities/${id}`);
        if (response.ok) {
            const data = await response.json();
            communityCache.set(id, data);
            return data;
        }
    } catch (error) {
        console.error(`Error fetching community ${id}:`, error);
    }
    return null;
};

export const getAllCommunities = async () => {
    try {
        const response = await fetch(`${API_URL}/communities`);
        if (response.ok) {
            const data = await response.json();
            data.forEach(c => communityCache.set(c.id, c));
            return data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching all communities:", error);
        return [];
    }
};

export default { getCommunitiesByIds, getCommunity, getAllCommunities };
