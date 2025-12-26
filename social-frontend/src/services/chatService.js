const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Initialize a chat with a user.
 * Returns the chat object (new or existing).
 */
export const initChat = async (currentUid, targetUid) => {
    try {
        const response = await fetch(`${API_URL}/chats/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentUid, targetUid })
        });
        if (!response.ok) throw new Error('Failed to init chat');
        return await response.json();
    } catch (error) {
        console.error('Error initiating chat:', error);
        throw error;
    }
};

/**
 * Get all chats for the current user.
 */
export const getUserChats = async (uid) => {
    try {
        const response = await fetch(`${API_URL}/chats/user/${uid}`);
        if (!response.ok) throw new Error('Failed to fetch chats');
        return await response.json();
    } catch (error) {
        console.error('Error fetching chats:', error);
        throw error;
    }
};

/**
 * Get messages for a specific chat.
 */
export const getChatMessages = async (chatId) => {
    try {
        const response = await fetch(`${API_URL}/chats/${chatId}/messages?limit=50`); // Fetch reasonable amount
        if (!response.ok) throw new Error('Failed to fetch messages');
        return await response.json();
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
};

/**
 * Send a message to a chat.
 */
export const sendMessage = async (chatId, senderId, text) => {
    try {
        const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId, text })
        });
        if (!response.ok) throw new Error('Failed to send message');
        return await response.json();
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};
