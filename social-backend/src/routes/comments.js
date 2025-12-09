const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/comments?uid=USER_ID
router.get('/', async (req, res) => {
    try {
        const { uid } = req.query;

        if (!uid) {
            return res.status(400).json({ error: "Missing uid query parameter" });
        }

        // Collection Group Query to find all comments by this user across all posts
        // Removed orderBy to avoid index requirement for now. Sorting in memory.
        const commentsSnapshot = await db.collectionGroup('comments')
            .where('uid', '==', uid)
            .get();

        const comments = commentsSnapshot.docs.map(doc => ({
            id: doc.id,
            postId: doc.ref.parent.parent.id, // Get the ID of the post this comment belongs to
            ...doc.data(),
            createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
        }));

        // Fetch post titles
        const postIds = [...new Set(comments.map(c => c.postId))];
        if (postIds.length > 0) {
            const postsRefs = postIds.map(id => db.collection('posts').doc(id));
            const postsSnapshots = await db.getAll(...postsRefs);
            const postsMap = {};
            postsSnapshots.forEach(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    // Use title if exists, otherwise truncate text
                    let title = data.title;
                    if (!title && data.text) {
                        title = data.text.substring(0, 50) + (data.text.length > 50 ? "..." : "");
                    }
                    postsMap[doc.id] = title || "No Title";
                }
            });

            comments.forEach(c => {
                c.postTitle = postsMap[c.postId] || "Unknown Post";
            });
        }

        // Sort in memory
        comments.sort((a, b) => b.createdAt - a.createdAt);

        res.json(comments);
    } catch (error) {
        console.error("Error fetching user comments:", error);
        res.status(500).json({ error: "Failed to fetch user comments" });
    }
});

module.exports = router;
