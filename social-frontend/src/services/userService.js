const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Search users by nickname or email.
 * @param {string} queryText - The search text.
 * @param {string} role - Optional role filter.
 * @returns {Promise<Array>} - List of found users.
 */
export const searchUsers = async (queryText, role = null) => {
    try {
        const params = new URLSearchParams({ q: queryText });
        if (role) params.append('role', role);

        const response = await fetch(`${API_URL}/users/search?${params.toString()}`);
        if (!response.ok) throw new Error('Search failed');
        return await response.json();
    } catch (error) {
        console.error("Error searching users:", error);
        return [];
    }
};

// In-memory cache for user profiles to reduce read operations
const userCache = new Map();

/**
 * Get user details for a list of UIDs.
 * @param {Array<string>} uids - List of user IDs.
 * @returns {Promise<Array>} - List of user details.
 */
export const getUsersByUids = async (uids) => {
    try {
        const uniqueUids = [...new Set(uids)];
        const missingUids = uniqueUids.filter(uid => !userCache.has(uid));

        if (missingUids.length > 0) {
            const response = await fetch(`${API_URL}/users/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uids: missingUids })
            });
            if (!response.ok) throw new Error('Batch fetch failed');
            const newUsers = await response.json();

            // Update cache
            newUsers.forEach(user => {
                if (user && user.uid) {
                    userCache.set(user.uid, user);
                }
            });
        }

        // Return users from cache in the order requested (or just all found)
        return uniqueUids.map(uid => userCache.get(uid)).filter(u => u !== undefined);
    } catch (error) {
        console.error("Error fetching users by UIDs:", error);
        return [];
    }
};

export const createUserProfile = async (uid, userData) => {
    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, ...userData })
        });
        if (!response.ok) throw new Error('Create profile failed');
        return await response.json();
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
};

export const updateUserProfile = async (uid, updates) => {
    try {
        const response = await fetch(`${API_URL}/users/${uid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Update profile failed');
        return await response.json();
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

export const getUserVotedPosts = async (uid, type) => {
    try {
        const response = await fetch(`${API_URL}/users/${uid}/votedPosts?type=${type}`);
        if (!response.ok) throw new Error('Fetch voted posts failed');
        return await response.json();
    } catch (error) {
        console.error("Error fetching voted posts:", error);
        return [];
    }
};

export const getUserSavedPostsDetails = async (uid) => {
    try {
        const response = await fetch(`${API_URL}/users/${uid}/savedPosts/details`);
        if (!response.ok) throw new Error('Fetch saved posts failed');
        return await response.json();
    } catch (error) {
        console.error("Error fetching saved posts:", error);
        return [];
    }
};

export const getUserSavedPostIds = async (uid) => {
    try {
        const response = await fetch(`${API_URL}/users/${uid}/savedPosts`);
        if (!response.ok) throw new Error('Fetch saved posts IDs failed');
        return await response.json();
    } catch (error) {
        console.error("Error fetching saved posts IDs:", error);
        return [];
    }
};

export const getUser = async (uid) => {
    try {
        const response = await fetch(`${API_URL}/users/${uid}`);
        if (!response.ok) throw new Error('Fetch user failed');
        return await response.json();
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
};

export const createRoleProfile = async (collectionName, data) => {
    try {
        // Map collection name to endpoint
        // collectionName comes from Profile.js: 'bars' or 'roasteries' (or 'roasters'?)
        // Profile.js uses 'bars' and 'roasteries'.
        // Backend routes: /api/bars and /api/roasters (which points to roasteries collection).
        // So if collectionName is 'roasteries', we map to 'roasters'.
        const endpoint = collectionName === 'bars' ? 'bars' : 'roasters';

        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Create role profile failed');
        return await response.json();
    } catch (error) {
        console.error("Error creating role profile:", error);
        throw error;
    }
};

export const updateRoleProfile = async (collectionName, id, updates) => {
    try {
        const endpoint = collectionName === 'bars' ? 'bars' : 'roasters';
        const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Update role profile failed');
        return await response.json();
    } catch (error) {
        console.error("Error updating role profile:", error);
        throw error;
    }
};

export const getRoleProfile = async (collectionName, ownerUid) => {
    try {
        const endpoint = collectionName === 'bars' ? 'bars' : 'roasters';
        const response = await fetch(`${API_URL}/${endpoint}?ownerUid=${ownerUid}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error("Error fetching role profile:", error);
        return null;
    }
};

export const followUser = async (targetUid, currentUid) => {
    try {
        const response = await fetch(`${API_URL}/users/${targetUid}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentUid })
        });
        if (!response.ok) throw new Error('Follow failed');
        return await response.json();
    } catch (error) {
        console.error("Error following user:", error);
        throw error;
    }
};

export const unfollowUser = async (targetUid, currentUid) => {
    try {
        const response = await fetch(`${API_URL}/users/${targetUid}/unfollow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentUid })
        });
        if (!response.ok) throw new Error('Unfollow failed');
        return await response.json();
    } catch (error) {
        console.error("Error unfollowing user:", error);
        throw error;
    }
};

export const checkFollowStatus = async (currentUid, targetUid) => {
    try {
        const response = await fetch(`${API_URL}/users/${currentUid}/checkFollow/${targetUid}`);
        if (!response.ok) throw new Error('Check follow status failed');
        return await response.json();
    } catch (error) {
        console.error("Error checking follow status:", error);
        return { isFollowing: false };
    }
};

export const getFollowers = async (uid) => {
    try {
        const response = await fetch(`${API_URL}/users/${uid}/followers`);
        if (!response.ok) throw new Error('Fetch followers failed');
        return await response.json();
    } catch (error) {
        console.error("Error fetching followers:", error);
        return [];
    }
};

export const getFollowing = async (uid) => {
    try {
        const response = await fetch(`${API_URL}/users/${uid}/following`);
        if (!response.ok) throw new Error('Fetch following failed');
        return await response.json();
    } catch (error) {
        console.error("Error fetching following:", error);
        return [];
    }
};

export const getRoasteryProducts = async (roasteryId) => {
    try {
        const response = await fetch(`${API_URL}/roasters/${roasteryId}/products`);
        if (!response.ok) throw new Error('Fetch products failed');
        return await response.json();
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
};

export const createProduct = async (roasteryId, productData) => {
    try {
        let body;
        let headers = {};

        // Check if we need to send FormData (file upload)
        if (productData.image instanceof File) {
            const formData = new FormData();
            formData.append('image', productData.image);
            formData.append('name', productData.name);
            formData.append('description', productData.description);
            formData.append('price', productData.price);
            // Add other fields as needed
            body = formData;
            // Let browser set Content-Type with boundary
        } else {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(productData);
        }

        const response = await fetch(`${API_URL}/roasters/${roasteryId}/products`, {
            method: 'POST',
            headers: headers,
            body: body
        });
        if (!response.ok) throw new Error('Create product failed');
        return await response.json();
    } catch (error) {
        console.error("Error creating product:", error);
        throw error;
    }
};
