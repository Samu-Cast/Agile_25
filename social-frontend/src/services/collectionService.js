const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Get all collections for a roastery
 */
export const getCollections = async (roasterId) => {
    try {
        const response = await fetch(`${API_URL}/roasters/${roasterId}/collections`);
        if (!response.ok) throw new Error('Fetch collections failed');
        return await response.json();
    } catch (error) {
        console.error("Error fetching collections:", error);
        return [];
    }
};

/**
 * Create a new collection
 * @param {string} roasterId 
 * @param {Object} collectionData { name, description, products, uid }
 */
export const createCollection = async (roasterId, collectionData) => {
    try {
        const response = await fetch(`${API_URL}/roasters/${roasterId}/collections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(collectionData)
        });
        if (!response.ok) throw new Error('Create collection failed');
        return await response.json();
    } catch (error) {
        console.error("Error creating collection:", error);
        throw error;
    }
};

/**
 * Update a collection
 * @param {string} roasterId 
 * @param {string} collectionId 
 * @param {Object} updates { name, description, products, uid, isPromoted }
 */
export const updateCollection = async (roasterId, collectionId, updates) => {
    try {
        const response = await fetch(`${API_URL}/roasters/${roasterId}/collections/${collectionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Update collection failed');
        return await response.json();
    } catch (error) {
        console.error("Error updating collection:", error);
        throw error;
    }
};

/**
 * Delete a collection
 * @param {string} roasterId 
 * @param {string} collectionId 
 * @param {string} uid - Owner uid for verification
 */
export const deleteCollection = async (roasterId, collectionId, uid) => {
    try {
        const response = await fetch(`${API_URL}/roasters/${roasterId}/collections/${collectionId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid })
        });
        if (!response.ok) throw new Error('Delete collection failed');
        return await response.json();
    } catch (error) {
        console.error("Error deleting collection:", error);
        throw error;
    }
};
