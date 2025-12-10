const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

// GET /api/roasters/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const roasterDoc = await db.collection('roasteries').doc(id).get();

        if (!roasterDoc.exists) {
            return res.status(404).json({ error: "Roaster not found" });
        }

        res.json({ id: roasterDoc.id, ...roasterDoc.data() });
    } catch (error) {
        console.error("Error fetching roaster:", error);
        res.status(500).json({ error: "Failed to fetch roaster" });
    }
});

// GET /api/roasters
router.get('/', async (req, res) => {
    try {
        const { ownerUid } = req.query;
        let query = db.collection('roasteries');

        if (ownerUid) {
            query = query.where('ownerUid', '==', ownerUid);
        }

        const snapshot = await query.limit(20).get();
        const roasters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(roasters);
    } catch (error) {
        console.error("Error fetching roasters:", error);
        res.status(500).json({ error: "Failed to fetch roasters" });
    }
});

// POST /api/roasteries
router.post('/', async (req, res) => {
    try {
        const roasteryData = req.body;

        // Basic validation
        if (!roasteryData.name) {
            return res.status(400).json({ error: "Missing required fields: name" });
        }

        // Ensure stats are initialized if not provided
        const finalData = {
            ...roasteryData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            stats: roasteryData.stats || {
                products: 0,
                followers: 0,
                rating: 0,
                reviews: 0
            }
        };

        // If we want to enforce 1:1 mapping, we could use ownerUid as doc ID, 
        // but let's stick to auto-id or let frontend decide. 
        // If frontend sends 'id', use it (e.g. if we want id == ownerUid).
        // However, standard add() creates auto-id. 
        // Let's check if we want to support setting ID manually (e.g. to match ownerUid).

        let ref;
        if (roasteryData.id) {
            await db.collection('roasters').doc(roasteryData.id).set(finalData);
            ref = db.collection('roasters').doc(roasteryData.id);
        } else {
            ref = await db.collection('roasters').add(finalData);
        }

        res.json({ id: ref.id, ...finalData });
    } catch (error) {
        console.error("Error creating roastery:", error);
        res.status(500).json({ error: "Failed to create roastery" });
    }
});

// PUT /api/roasteries/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        await db.collection('roasteries').doc(id).update(updates);
        res.json({ message: "Roastery updated successfully" });
    } catch (error) {
        console.error("Error updating roastery:", error);
        res.status(500).json({ error: "Failed to update roastery" });
    }
});

module.exports = router;
