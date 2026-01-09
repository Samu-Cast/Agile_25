const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/search?q=query
router.get('/', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: "Missing query parameter 'q'" });
        }

        const searchTerm = q.toLowerCase();
        const results = [];

        // Search in users collection
        const usersSnapshot = await db.collection('users').get();
        usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // Include location in searchable text
            const searchableText = `${data.name || ''} ${data.nickname || ''} ${data.email || ''} ${data.location || ''}`.toLowerCase();
            if (searchableText.includes(searchTerm)) {
                results.push({
                    id: doc.id,
                    uid: doc.id, // Ensure uid is available for tagging
                    type: 'user',
                    ...data
                });
            }
        });

        // Search in bars collection
        const barsSnapshot = await db.collection('bars').get();
        barsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // Include city in searchable text
            const searchableText = `${data.name || ''} ${data.address || ''} ${data.city || ''}`.toLowerCase();
            if (searchableText.includes(searchTerm)) {
                results.push({
                    id: doc.id,
                    uid: data.ownerUid || doc.id, // Use ownerUid for bars
                    type: 'bar',
                    ...data
                });
            }
        });

        // Search in roasters collection
        const roastersSnapshot = await db.collection('roasters').get();
        roastersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // Include city in searchable text
            const searchableText = `${data.name || ''} ${data.address || ''} ${data.city || ''}`.toLowerCase();
            if (searchableText.includes(searchTerm)) {
                results.push({
                    id: doc.id,
                    uid: data.ownerUid || doc.id, // Use ownerUid for roasters
                    type: 'roaster',
                    ...data
                });
            }
        });

        // Search in posts collection (by text content)
        const postsSnapshot = await db.collection('posts').get();
        postsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const searchableText = `${data.text || ''}`.toLowerCase();
            if (searchableText.includes(searchTerm)) {
                results.push({ id: doc.id, type: 'post', ...data });
            }
        });

        res.json(results);
    } catch (error) {
        console.error("Error searching:", error);
        res.status(500).json({ error: "Failed to search" });
    }
});

module.exports = router;
