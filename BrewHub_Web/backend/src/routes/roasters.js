const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/roasters/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const roasterDoc = await db.collection('roasters').doc(id).get();

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
        const snapshot = await db.collection('roasters').limit(20).get();
        const roasters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(roasters);
    } catch (error) {
        console.error("Error fetching roasters:", error);
        res.status(500).json({ error: "Failed to fetch roasters" });
    }
});

module.exports = router;
