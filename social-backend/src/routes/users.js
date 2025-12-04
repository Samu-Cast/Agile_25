const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// GET /api/users/:uid
router.get('/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ uid: userDoc.id, ...userDoc.data() });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// GET /api/users (Optional: List all users - be careful with large datasets)
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('users').limit(20).get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// GET /api/users/:uid/savedPosts
router.get('/:uid/savedPosts', async (req, res) => {
    try {
        const { uid } = req.params;
        const savedPostsSnapshot = await db.collection('users').doc(uid).collection('savedPosts').get();

        // Return array of post IDs
        const savedPostIds = savedPostsSnapshot.docs.map(doc => doc.id);

        res.json(savedPostIds);
    } catch (error) {
        console.error("Error fetching saved posts:", error);
        res.status(500).json({ error: "Failed to fetch saved posts" });
    }
});

module.exports = router;
