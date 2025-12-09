const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/bars/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const barDoc = await db.collection('bars').doc(id).get();

        if (!barDoc.exists) {
            return res.status(404).json({ error: "Bar not found" });
        }

        res.json({ id: barDoc.id, ...barDoc.data() });
    } catch (error) {
        console.error("Error fetching bar:", error);
        res.status(500).json({ error: "Failed to fetch bar" });
    }
});

// GET /api/bars
router.get('/', async (req, res) => {
    try {
        const { ownerUid } = req.query;
        let query = db.collection('bars');

        if (ownerUid) {
            query = query.where('ownerUid', '==', ownerUid);
        }

        const snapshot = await query.limit(20).get();
        const bars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(bars);
    } catch (error) {
        console.error("Error fetching bars:", error);
        res.status(500).json({ error: "Failed to fetch bars" });
    }
});

// POST /api/bars
router.post('/', async (req, res) => {
    try {
        const barData = req.body;
        const ref = await db.collection('bars').add(barData);
        res.json({ id: ref.id, ...barData });
    } catch (error) {
        console.error("Error creating bar:", error);
        res.status(500).json({ error: "Failed to create bar" });
    }
});

// PUT /api/bars/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        await db.collection('bars').doc(id).update(updates);
        res.json({ message: "Bar updated successfully" });
    } catch (error) {
        console.error("Error updating bar:", error);
        res.status(500).json({ error: "Failed to update bar" });
    }
});

module.exports = router;
