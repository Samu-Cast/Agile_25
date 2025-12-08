const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

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
        const { uid, entityType, entityId, text, imageUrl, createdAt, likesCount, commentsCount } = req.body;

        if (!text || !uid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newPost = {
            uid,
            entityType: entityType || "user",
            entityId: entityId || uid,
            text,
            imageUrl: imageUrl || null,
            createdAt: createdAt ? new Date(createdAt) : new Date(),
            likesCount: likesCount || 0,
            commentsCount: commentsCount || 0
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
        const { text, uid, parentComment } = req.body;

        if (!text || !uid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newComment = {
            text,
            uid,
            parentComment: parentComment || null,
            createdAt: new Date()
        };

        const ref = await db.collection('posts').doc(postId).collection('comments').add(newComment);

        // Increment comment count on the post
        await db.collection('posts').doc(postId).update({
            commentsCount: admin.firestore.FieldValue.increment(1)
        });

        res.json({ id: ref.id, ...newComment });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ error: "Failed to add comment" });
    }
});

// POST /api/posts/:postId/like
router.post('/:postId/like', async (req, res) => {
    try {
        const { postId } = req.params;
        const { uid } = req.body;

        if (!uid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const likeRef = db.collection('posts').doc(postId).collection('likes').doc(uid);
        const doc = await likeRef.get();

        if (doc.exists) {
            return res.status(400).json({ error: "Post already liked" });
        }

        await likeRef.set({
            likedAt: new Date()
        });

        await db.collection('posts').doc(postId).update({
            likesCount: admin.firestore.FieldValue.increment(1)
        });

        res.json({ message: "Post liked" });
    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).json({ error: "Failed to like post" });
    }
});

// DELETE /api/posts/:postId/like
router.delete('/:postId/like', async (req, res) => {
    try {
        const { postId } = req.params;
        const { uid } = req.body;

        if (!uid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const likeRef = db.collection('posts').doc(postId).collection('likes').doc(uid);
        const doc = await likeRef.get();

        if (!doc.exists) {
            return res.status(400).json({ error: "Post not liked" });
        }

        await likeRef.delete();

        await db.collection('posts').doc(postId).update({
            likesCount: admin.firestore.FieldValue.increment(-1)
        });

        res.json({ message: "Post unliked" });
    } catch (error) {
        console.error("Error unliking post:", error);
        res.status(500).json({ error: "Failed to unlike post" });
    }
});

module.exports = router;
