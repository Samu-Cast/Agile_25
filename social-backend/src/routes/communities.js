const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// GET /api/communities - List all communities
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('communities').get();
        const communities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(communities);
    } catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/communities/:id - Get details
router.get('/:id', async (req, res) => {
    try {
        const docRef = db.collection('communities').doc(req.params.id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Community not found' });
        }

        res.json({ id: docSnap.id, ...docSnap.data() });
    } catch (error) {
        console.error('Error fetching community:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/communities - Create new community
router.post('/', async (req, res) => {
    try {
        console.log("Received POST /communities request body:", req.body);
        const { name, description, creatorId, avatar } = req.body;

        if (!name || !creatorId) {
            return res.status(400).json({ error: 'Name and Creator ID are required' });
        }

        const newCommunity = {
            name,
            description: description || '',
            creatorId,
            avatar: avatar || null,
            members: [creatorId],
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('communities').add(newCommunity);
        res.status(201).json({ id: docRef.id, ...newCommunity });
    } catch (error) {
        console.error('Error creating community:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/communities/:id - Update community details
router.put('/:id', async (req, res) => {
    try {
        const { name, description, avatar, banner, updaterId, rules } = req.body;
        const communityRef = db.collection('communities').doc(req.params.id);
        const docSnap = await communityRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Community not found' });
        }

        const communityData = docSnap.data();

        // Security Check: Only creator can update
        if (communityData.creatorId !== updaterId) {
            console.warn(`Unauthorized update attempt by ${updaterId} on community ${req.params.id}`);
            return res.status(403).json({ error: 'Unauthorized: Only the creator can edit this community' });
        }

        const updates = {};
        if (name) updates.name = name;
        if (description) updates.description = description;
        if (avatar) updates.avatar = avatar;
        if (banner) updates.banner = banner;
        if (rules) updates.rules = rules;

        await communityRef.update(updates);
        res.json({ success: true, ...communityData, ...updates });
    } catch (error) {
        console.error('Error updating community:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/communities/:id/join - Toggle join/leave
router.post('/:id/join', async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) return res.status(400).json({ error: 'User ID required' });

        const communityRef = db.collection('communities').doc(req.params.id);
        const docSnap = await communityRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Community not found' });
        }

        const data = docSnap.data();
        const isMember = data.members && data.members.includes(uid);

        if (isMember) {
            // Leave
            await communityRef.update({
                members: admin.firestore.FieldValue.arrayRemove(uid)
            });
            res.json({ success: true, joined: false });
        } else {
            // Join
            await communityRef.update({
                members: admin.firestore.FieldValue.arrayUnion(uid)
            });
            res.json({ success: true, joined: true });
        }
    } catch (error) {
        console.error('Error toggling membership:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
