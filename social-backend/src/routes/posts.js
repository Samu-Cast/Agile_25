const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// GET /api/posts
router.get('/', async (req, res) => {
    try {
        const postsSnapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();

        const posts = [];

        for (const doc of postsSnapshot.docs) {
            const postData = doc.data();
            let authorName = "Unknown User";

            // Fetch author details
            if (postData.userId) {
                try {
                    const userDoc = await db.collection('users').doc(postData.userId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        authorName = userData.displayName || userData.email || "Unknown User";
                    }
                } catch (err) {
                    console.error(`Error fetching user ${postData.userId}:`, err);
                }
            }

            posts.push({
                id: doc.id,
                ...postData,
                authorName: authorName,
                // Convert Timestamp to Date object for JSON serialization if needed, 
                // or keep as is if frontend handles it. 
                // For simplicity, let's send ISO string.
                createdAt: postData.createdAt ? postData.createdAt.toDate().toISOString() : null
            });
        }

        res.json(posts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

module.exports = router;
