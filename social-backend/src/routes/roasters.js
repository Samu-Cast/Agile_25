const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

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
        const ref = await db.collection('roasteries').add(roasteryData);
        res.json({ id: ref.id, ...roasteryData });
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
