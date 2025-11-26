const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// GET /api/search?q=query
router.get('/', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: "Missing query parameter 'q'" });
        }

        const searchTerm = q.toLowerCase();

        // Note: Firestore does not support native full-text search or "contains" queries easily.
        // The seed data includes `searchableKeywords` array which is perfect for `array-contains`.
        // However, `array-contains` matches exact elements.
        // For a simple implementation, we will try to match exact keywords if possible, 
        // or fetch all and filter (not scalable but works for small datasets).
        // Given the seed structure: searchableKeywords: ["sam", "appassionato", "castellani"]

        // Let's try array-contains first for exact keyword match
        const snapshot = await db.collection('searchIndex')
            .where('searchableKeywords', 'array-contains', searchTerm)
            .get();

        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json(results);
    } catch (error) {
        console.error("Error searching:", error);
        res.status(500).json({ error: "Failed to search" });
    }
});

module.exports = router;
