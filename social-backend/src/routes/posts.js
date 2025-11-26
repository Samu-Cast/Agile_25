const express = require('express');
const router = express.Router();
const { db, admin } = require('../firebase');

// GET /api/posts
router.get('/', async (req, res) => {
    try {
        const postsSnapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();

        const posts = postsSnapshot.docs.map(doc => {
            const postData = doc.data();
            return {
                id: doc.id,
                ...postData,
                // Ensure createdAt is a string for frontend
                createdAt: postData.createdAt ? postData.createdAt.toDate().toISOString() : null
            };
        });

        res.json(posts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

// POST /api/posts
router.post('/', async (req, res) => {
    try {
        const { title, content, image, uid, authorName, createdAt } = req.body;

        if (!content || !uid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newPost = {
            title: title || "",
            content,
            image: image || null,
            uid,
            authorName: authorName || "Anonymous",
            likes: 0,
            comments: 0,
            createdAt: createdAt ? new Date(createdAt) : new Date()
        };

        const ref = await db.collection('posts').add(newPost);

        res.json({ id: ref.id, ...newPost });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ error: "Failed to create post" });
    }
});

// GET /api/posts/:postId/comments
router.get('/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        const commentsSnapshot = await db.collection('posts').doc(postId).collection('comments').orderBy('createdAt', 'asc').get();

        const comments = commentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt ? doc.data().createdAt.toDate().toISOString() : null
        }));

        res.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});

// POST /api/posts/:postId/comments
router.post('/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        const { text, uid, author } = req.body; // Assuming frontend sends these

        if (!text || !uid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newComment = {
            text,
            uid,
            author: author || "Unknown", // Optional if we want to store name directly
            createdAt: new Date()
        };

        const ref = await db.collection('posts').doc(postId).collection('comments').add(newComment);

        // Increment comment count on the post
        await db.collection('posts').doc(postId).update({
            comments: admin.firestore.FieldValue.increment(1)
        });

        res.json({ id: ref.id, ...newComment });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ error: "Failed to add comment" });
    }
});

module.exports = router;
