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
        const snapshot = await db.collection('bars').limit(20).get();
        const bars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(bars);
    } catch (error) {
        console.error("Error fetching bars:", error);
        res.status(500).json({ error: "Failed to fetch bars" });
    }
});

module.exports = router;
