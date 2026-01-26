const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');

// Middleware to checking auth
// In a real app we'd decode the token. For now we trust the body or header, 
// but assuming there's some auth context or we pass uid in body.
// Based on existing code (e.g. communities.js), we often pass { uid } in the body for identification.

/**
 * POST /init
 * Start a chat with a user.
 * Body: { currentUid, targetUid }
 */
router.post('/init', async (req, res) => {
    try {
        const { currentUid, targetUid } = req.body;
        if (!currentUid || !targetUid) return res.status(400).json({ error: 'Missing UIDs' });

        // Query for existing chat between these two
        // Firestore doesn't support array-contains-all perfectly for this without composite indexes sometimes,
        // but 'participants' array check is standard. 
        // We can check if a chat exists where participants includes both.
        // Actually, easier: query where 'participants' array-contains 'currentUid', then filter in code.
        // OR: Generate a unique ID from sorted UIDs: `chat_${uid1}_${uid2}` to ensure uniqueness without query!

        const participants = [currentUid, targetUid].sort();
        const chatId = `${participants[0]}_${participants[1]}`;
        const chatRef = db.collection('chats').doc(chatId);

        const doc = await chatRef.get();

        if (!doc.exists) {
            // Create new chat
            // We fetch user details to cache them in the chat doc for "minimized reads" later
            const [user1, user2] = await Promise.all([
                db.collection('users').doc(participants[0]).get(),
                db.collection('users').doc(participants[1]).get()
            ]);

            const chatData = {
                participants,
                participantDetails: {
                    [participants[0]]: user1.exists ? {
                        name: user1.data().name || 'User',
                        nickname: user1.data().nickname || '',
                        photoURL: user1.data().profilePic || null
                    } : {},
                    [participants[1]]: user2.exists ? {
                        name: user2.data().name || 'User',
                        nickname: user2.data().nickname || '',
                        photoURL: user2.data().profilePic || null
                    } : {}
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                lastMessage: null
            };

            await chatRef.set(chatData);
            return res.json({ id: chatId, ...chatData });
        } else {
            return res.json({ id: doc.id, ...doc.data() });
        }

    } catch (error) {
        console.error('Error initiating chat:', error);
        res.status(500).json({ error: error.message });
    }
});

const convertTimestamps = (data) => {
    const newData = { ...data };
    if (newData.createdAt && typeof newData.createdAt.toDate === 'function') {
        newData.createdAt = newData.createdAt.toDate().toISOString();
    }
    if (newData.updatedAt && typeof newData.updatedAt.toDate === 'function') {
        newData.updatedAt = newData.updatedAt.toDate().toISOString();
    }
    if (newData.lastMessage && newData.lastMessage.createdAt && typeof newData.lastMessage.createdAt.toDate === 'function') {
        newData.lastMessage.createdAt = newData.lastMessage.createdAt.toDate().toISOString();
    }
    return newData;
};

/**
 * GET /user/:uid
 * Get all chats for a user
 */
router.get('/user/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        // Removed orderBy to avoid index requirement for now. Sorting in memory.
        const snapshot = await db.collection('chats')
            .where('participants', 'array-contains', uid)
            .get();

        let chats = [];
        snapshot.forEach(doc => {
            chats.push(convertTimestamps({ id: doc.id, ...doc.data() }));
        });

        // Sort in memory (Newest updated first)
        chats.sort((a, b) => {
            const dateA = new Date(a.updatedAt || 0);
            const dateB = new Date(b.updatedAt || 0);
            return dateB - dateA;
        });

        res.json(chats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /:chatId/messages
 * Get messages for a chat
 * Query: ?limit=20&startAfter=...
 */
router.get('/:chatId/messages', async (req, res) => {
    try {
        const { chatId } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        // Basic query
        let query = db.collection('chats').doc(chatId).collection('messages')
            .orderBy('createdAt', 'desc')
            .limit(limit);

        // Pagination could go here if we pass a timestamp or doc snapshot, 
        // but for now simple limit is enough for v1.

        const snapshot = await query.get();
        const messages = [];
        snapshot.forEach(doc => {
            messages.push(convertTimestamps({ id: doc.id, ...doc.data() }));
        });

        // Return reversed so they display chronologically (if frontend wants that)
        // or let frontend reverse. Usually API returns desc, frontend reverses.
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /:chatId/messages
 * Send a message
 * Body: { senderId, text }
 */
router.post('/:chatId/messages', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { senderId, text } = req.body;

        if (!text || !senderId) return res.status(400).json({ error: 'Missing text or sender' });

        const now = admin.firestore.FieldValue.serverTimestamp();

        const messageData = {
            senderId,
            text,
            createdAt: now,
            readBy: [senderId] // Reader tracking
        };

        const chatRef = db.collection('chats').doc(chatId);

        // Run as transaction / batch to update parent chat too
        const batch = db.batch();
        const messageRef = chatRef.collection('messages').doc(); // Auto-ID

        batch.set(messageRef, messageData);

        // Update last message on parent for list view
        batch.update(chatRef, {
            lastMessage: {
                text,
                senderId,
                createdAt: now
            },
            updatedAt: now
        });

        await batch.commit();

        // Use new Date() for response since serverTimestamp is provisional
        res.json({
            id: messageRef.id,
            ...messageData,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Middleware to checking auth
// In a real app we'd decode the token. For now we trust the body or header, 
// but assuming there's some auth context or we pass uid in body.
// Based on existing code (e.g. communities.js), we often pass { uid } in the body for identification.

/**
 * POST /init
 * Start a chat with a user.
 * Body: { currentUid, targetUid }
 */
router.post('/init', async (req, res) => {
    try {
        const { currentUid, targetUid } = req.body;
        if (!currentUid || !targetUid) return res.status(400).json({ error: 'Missing UIDs' });

        // Query for existing chat between these two
        // Firestore doesn't support array-contains-all perfectly for this without composite indexes sometimes,
        // but 'participants' array check is standard. 
        // We can check if a chat exists where participants includes both.
        // Actually, easier: query where 'participants' array-contains 'currentUid', then filter in code.
        // OR: Generate a unique ID from sorted UIDs: `chat_${uid1}_${uid2}` to ensure uniqueness without query!

        const participants = [currentUid, targetUid].sort();
        const chatId = `${participants[0]}_${participants[1]}`;
        const chatRef = db.collection('chats').doc(chatId);

        const doc = await chatRef.get();

        if (!doc.exists) {
            // Create new chat
            // We fetch user details to cache them in the chat doc for "minimized reads" later
            const [user1, user2] = await Promise.all([
                db.collection('users').doc(participants[0]).get(),
                db.collection('users').doc(participants[1]).get()
            ]);

            const chatData = {
                participants,
                participantDetails: {
                    [participants[0]]: user1.exists ? {
                        name: user1.data().name || 'User',
                        nickname: user1.data().nickname || '',
                        photoURL: user1.data().profilePic || null
                    } : {},
                    [participants[1]]: user2.exists ? {
                        name: user2.data().name || 'User',
                        nickname: user2.data().nickname || '',
                        photoURL: user2.data().profilePic || null
                    } : {}
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                lastMessage: null
            };

            await chatRef.set(chatData);
            return res.json({ id: chatId, ...chatData });
        } else {
            return res.json({ id: doc.id, ...doc.data() });
        }

    } catch (error) {
        console.error('Error initiating chat:', error);
        res.status(500).json({ error: error.message });
    }
});

const convertTimestamps = (data) => {
    const newData = { ...data };
    if (newData.createdAt && typeof newData.createdAt.toDate === 'function') {
        newData.createdAt = newData.createdAt.toDate().toISOString();
    }
    if (newData.updatedAt && typeof newData.updatedAt.toDate === 'function') {
        newData.updatedAt = newData.updatedAt.toDate().toISOString();
    }
    if (newData.lastMessage && newData.lastMessage.createdAt && typeof newData.lastMessage.createdAt.toDate === 'function') {
        newData.lastMessage.createdAt = newData.lastMessage.createdAt.toDate().toISOString();
    }
    return newData;
};

/**
 * GET /user/:uid
 * Get all chats for a user
 */
router.get('/user/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        // Removed orderBy to avoid index requirement for now. Sorting in memory.
        const snapshot = await db.collection('chats')
            .where('participants', 'array-contains', uid)
            .get();

        let chats = [];
        snapshot.forEach(doc => {
            chats.push(convertTimestamps({ id: doc.id, ...doc.data() }));
        });

        // Sort in memory (Newest updated first)
        chats.sort((a, b) => {
            const dateA = new Date(a.updatedAt || 0);
            const dateB = new Date(b.updatedAt || 0);
            return dateB - dateA;
        });

        res.json(chats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /:chatId/messages
 * Get messages for a chat
 * Query: ?limit=20&startAfter=...
 */
router.get('/:chatId/messages', async (req, res) => {
    try {
        const { chatId } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        // Basic query
        let query = db.collection('chats').doc(chatId).collection('messages')
            .orderBy('createdAt', 'desc')
            .limit(limit);

        // Pagination could go here if we pass a timestamp or doc snapshot, 
        // but for now simple limit is enough for v1.

        const snapshot = await query.get();
        const messages = [];
        snapshot.forEach(doc => {
            messages.push(convertTimestamps({ id: doc.id, ...doc.data() }));
        });

        // Return reversed so they display chronologically (if frontend wants that)
        // or let frontend reverse. Usually API returns desc, frontend reverses.
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /:chatId/messages
 * Send a message
 * Body: { senderId, text }
 */
router.post('/:chatId/messages', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { senderId, text } = req.body;

        if (!text || !senderId) return res.status(400).json({ error: 'Missing text or sender' });

        const now = admin.firestore.FieldValue.serverTimestamp();

        const messageData = {
            senderId,
            text,
            createdAt: now,
            readBy: [senderId] // Reader tracking
        };

        const chatRef = db.collection('chats').doc(chatId);

        // Run as transaction / batch to update parent chat too
        const batch = db.batch();
        const messageRef = chatRef.collection('messages').doc(); // Auto-ID

        batch.set(messageRef, messageData);

        // Update last message on parent for list view
        batch.update(chatRef, {
            lastMessage: {
                text,
                senderId,
                createdAt: now
            },
            updatedAt: now
        });

        await batch.commit();

        // Use new Date() for response since serverTimestamp is provisional
        res.json({
            id: messageRef.id,
            ...messageData,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
