import { getUserVotedPosts, getUserSavedPostsDetails } from './userService';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Crea un nuovo post tramite API
 * @param {Object} postData - Dati del post
 * @returns {Promise<string>} - ID del post creato
 */
export const createPost = async (postData) => {
    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: postData.uid || postData.authorUid,
                text: postData.text || postData.content,
                imageUrl: postData.imageUrl,
                entityType: postData.entityType || 'user',
                entityId: postData.entityId || postData.authorUid || postData.uid,
                communityId: postData.communityId, // Include communityId if present
                taggedUsers: postData.taggedUsers || [],
                type: postData.type || 'post',
                eventDetails: postData.eventDetails,
                hosts: postData.hosts,
                reviewData: postData.reviewData,
                comparisonData: postData.comparisonData,
                mediaUrls: postData.mediaUrls || (postData.imageUrl ? [postData.imageUrl] : [])
            })
        });
        if (!response.ok) throw new Error('Create post failed');
        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error('Errore nella creazione del post:', error);
        throw error;
    }
};

/**
 * Recupera i post per il feed con filtri e paginazione
 * @param {Object} params - Filtri (uid, filter, sort, limit, lastCreatedAt, communityId)
 * @returns {Promise<Array>} - Array di post
 */
export const getFeedPosts = async (params = {}) => {
    try {
        const urlParams = new URLSearchParams();
        if (params.uid) urlParams.append('uid', params.uid);
        if (params.filter) urlParams.append('filter', params.filter);
        if (params.sort) urlParams.append('sort', params.sort);
        if (params.limit) urlParams.append('limit', params.limit);
        if (params.lastCreatedAt) urlParams.append('lastCreatedAt', params.lastCreatedAt);
        if (params.communityId) urlParams.append('communityId', params.communityId);
        if (params.type) urlParams.append('type', params.type);

        const queryString = urlParams.toString();
        const url = `${API_URL}/posts${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch feed posts failed');
        // We return raw data here because frontend maps it. 
        // Ideally service should do mapping but Home.js has complex mapping logic with users/communities.
        // For now, let's return raw JSON.
        return await response.json();
    } catch (error) {
        console.error('Errore nel recupero dei post del feed:', error);
        throw error;
    }
};

/**
 * Recupera tutti i post tramite API
 * @returns {Promise<Array>} - Array di post
 */
export const getPosts = async () => {
    try {
        const response = await fetch(`${API_URL}/posts`);
        if (!response.ok) throw new Error('Fetch posts failed');
        const posts = await response.json();
        return posts.map(p => ({
            ...p,
            content: p.text, // Map backend 'text' to frontend 'content'
            author: p.uid,   // Map backend 'uid' to frontend 'author' (or authorUid)
            time: p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Just now'
        }));
    } catch (error) {
        console.error('Errore nel recupero dei post:', error);
        throw error;
    }
};

/**
 * Aggiorna i voti di un post
 */
export const updateVotes = async (postId, userId, value) => {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: userId, value })
        });
        if (!response.ok) throw new Error('Update votes failed');
        return await response.json();
    } catch (error) {
        console.error('Errore nell\'aggiornamento dei voti:', error);
        throw error;
    }
};

/**
 * Aggiungi o rimuovi un caffè
 */
export const toggleCoffee = async (postId, userId) => {
    try {
        let response = await fetch(`${API_URL}/posts/${postId}/coffee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: userId })
        });

        if (!response.ok) {
            const err = await response.json();
            if (err.error === "User already gave coffee") {
                // Remove coffee
                response = await fetch(`${API_URL}/posts/${postId}/coffee`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: userId })
                });
                if (!response.ok) throw new Error('Remove coffee failed');
                return { success: true, hasGivenCoffee: false };
            }
            throw new Error('Add coffee failed');
        }
        return { success: true, hasGivenCoffee: true };
    } catch (error) {
        console.error('Errore nel toggle del caffè:', error);
        throw error;
    }
};

export const updateRating = async (postId, userId, rating) => {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/rating`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: userId, rating })
        });
        if (!response.ok) throw new Error('Update rating failed');
        return await response.json();
    } catch (error) {
        console.error('Error updating rating:', error);
        throw error;
    }
};

export const addComment = async (postId, commentData) => {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: commentData.text,
                uid: commentData.authorUid,
                parentComment: commentData.parentComment || null,
                mediaUrls: commentData.mediaUrls || []
            })
        });
        if (!response.ok) throw new Error('Add comment failed');
        return await response.json();
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

export const getComments = async (postId) => {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`);
        if (!response.ok) throw new Error('Get comments failed');
        return await response.json();
    } catch (error) {
        console.error("Error getting comments:", error);
        return [];
    }
};

export const getUserComments = async (userId) => {
    try {
        const response = await fetch(`${API_URL}/comments?uid=${userId}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("Error getting user comments:", error);
        return [];
    }
};

export { getUserVotedPosts };

export const getUserPosts = async (userId) => {
    try {
        const response = await fetch(`${API_URL}/posts?authorUid=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user posts');
        const posts = await response.json();
        return posts.map(p => ({
            ...p,
            content: p.text,
            time: p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Just now'
        }));
    } catch (error) {
        console.error("Error getting user posts:", error);
        return [];
    }
};

export const getUserSavedPosts = async (userId) => {
    try {
        const posts = await getUserSavedPostsDetails(userId);
        return posts.map(p => ({
            ...p,
            content: p.text,
            time: p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Just now'
        }));
    } catch (error) {
        console.error("Error getting saved posts:", error);
        return [];
    }
};

export const toggleSavePost = async (postId, userId, isSaved) => {
    try {
        const methodToUse = isSaved ? 'DELETE' : 'POST';

        const response = await fetch(`${API_URL}/posts/${postId}/save`, {
            method: methodToUse,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: userId })
        });
        if (!response.ok) throw new Error('Toggle save failed');
        return await response.json();
    } catch (error) {
        console.error("Error toggling save:", error);
        throw error;
    }
};

export const getUserSavedGuides = async (userId) => {
    // Mock for now
    return [];
};

export const deletePost = async (postId, userId) => {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: userId })
        });
        if (!response.ok) throw new Error('Delete post failed');
        return await response.json();
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
};

export const getUserEvents = async (uid) => {
    try {
        // Fetch events created by user
        const createdResponse = await fetch(`${API_URL}/posts?authorUid=${uid}&type=event`);
        if (!createdResponse.ok) throw new Error('Failed to fetch user created events');
        const createdEvents = await createdResponse.json();

        // Fetch events participating in
        const participatingResponse = await fetch(`${API_URL}/posts?participatingUid=${uid}&type=event`);
        if (!participatingResponse.ok) throw new Error('Failed to fetch participating events');
        const participatingEvents = await participatingResponse.json();

        // Merge and deduplicate (by id)
        const eventMap = new Map();
        createdEvents.forEach(e => eventMap.set(e.id, { ...e, isHost: true }));
        participatingEvents.forEach(e => {
            if (!eventMap.has(e.id)) {
                eventMap.set(e.id, { ...e, isHost: false });
            }
        });

        // Sort by date (nearest future first, then past) or just creation?
        // Let's sort created desc for now, or maybe event date?
        const events = Array.from(eventMap.values());

        // Fetch author details
        const authorUids = [...new Set(events.map(e => e.uid))];
        const authorMap = {};

        if (authorUids.length > 0) {
            try {
                const usersResponse = await fetch(`${API_URL}/users/batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uids: authorUids })
                });

                if (usersResponse.ok) {
                    const users = await usersResponse.json();
                    users.forEach(u => authorMap[u.uid] = u);
                }
            } catch (err) {
                console.error("Error fetching event authors:", err);
            }
        }

        return events.map(p => {
            const authorData = authorMap[p.uid];
            return {
                ...p,
                content: p.text,
                time: p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Just now',
                author: authorData ? (authorData.nickname || authorData.name) : 'Unknown',
                authorAvatar: authorData ? (authorData.profilePic || authorData.photoURL) : null,
                authorId: p.uid
            };
        });
    } catch (error) {
        console.error("Error getting user events:", error);
        return [];
    }
};

export const joinEvent = async (postId, userId) => {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: userId })
        });
        if (!response.ok) throw new Error('Join event failed');
        return await response.json();
    } catch (error) {
        console.error("Error joining event:", error);
        throw error;
    }
};

export const leaveEvent = async (postId, userId) => {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/join`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: userId })
        });
        if (!response.ok) throw new Error('Leave event failed');
        return await response.json();
    } catch (error) {
        console.error("Error leaving event:", error);
        throw error;
    }
};

const postService = { createPost, getPosts, getFeedPosts, updateVotes, toggleCoffee, updateRating, addComment, getComments, getUserComments, getUserVotedPosts, getUserPosts, getUserSavedPosts, getUserSavedGuides, toggleSavePost, deletePost, joinEvent, leaveEvent };
export default postService;
