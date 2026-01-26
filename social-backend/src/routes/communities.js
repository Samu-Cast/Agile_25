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
        const userCommunityRef = db.collection('users').doc(uid).collection('communities').doc(req.params.id);

        await db.runTransaction(async (t) => {
            const docSnap = await t.get(communityRef);

            if (!docSnap.exists) {
                throw new Error('Community not found');
            }

            const data = docSnap.data();
            const isMember = data.members && data.members.includes(uid);

            if (isMember) {
                // Check if user is creator
                if (data.creatorId === uid) {
                    throw new Error("Creator cannot leave their own community");
                }

                // Leave
                t.update(communityRef, {
                    members: admin.firestore.FieldValue.arrayRemove(uid)
                });
                t.delete(userCommunityRef);
            } else {
                // Join
                t.update(communityRef, {
                    members: admin.firestore.FieldValue.arrayUnion(uid)
                });
                // Add denormalized community data for quick access
                t.set(userCommunityRef, {
                    id: docSnap.id,
                    name: data.name,
                    avatar: data.avatar || null,
                    joinedAt: new Date().toISOString()
                });
            }
        });

        // We can't easily return the new state from inside transaction blindly without re-fetching, 
        // but we know what we did.
        // For simplicity/speed, we'll return the success and let the frontend update UI state.

        // However, to be perfectly accurate for the response "joined" state, we need to know what we effectively did.
        // We can re-fetch or just check the logic we just ran?
        // Let's just re-fetch the 'isMember' check is actually slightly racy if we do it outside, 
        // but since we are inside a transaction, we can't communicate out easily except via throwing.
        // So we will just do a quick check again or assume success based on the code path.

        // Actually, we can check `isMember` before the transaction? No, race condition.
        // Best approach: Return the intended state.

        const freshSnap = await communityRef.get();
        const freshData = freshSnap.data();
        const nowJoined = freshData.members && freshData.members.includes(uid);

        res.json({ success: true, joined: nowJoined });

    } catch (error) {
        console.error('Error toggling membership:', error);
        res.status(error.message === 'Community not found' ? 404 : 500).json({ error: error.message || 'Internal Server Error' });
    }
});

module.exports = router;
