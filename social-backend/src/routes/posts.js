const express = require('express');
const router = express.Router();
const { db, admin } = require('../firebase');

// GET /api/posts
router.get('/', async (req, res) => {
    try {
        const { uid } = req.query;
        const postsSnapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();

        const posts = await Promise.all(postsSnapshot.docs.map(async doc => {
            const postData = doc.data();
            let userVote = 0;

            if (uid) {
                const likeDoc = await db.collection('posts').doc(doc.id).collection('likes').doc(uid).get();
                if (likeDoc.exists) {
                    const data = likeDoc.data();
                    userVote = data.value !== undefined ? data.value : 1; // Default to 1 ONLY if value is missing
                }
            }

            return {
                id: doc.id,
                ...postData,
                userVote,
                // Ensure createdAt is a string for frontend
                createdAt: postData.createdAt ? postData.createdAt.toDate().toISOString() : null
            };
        }));

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
        const { uid, value } = req.body; // value: 1 (up) or -1 (down)

        if (!uid || !value) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const likeRef = db.collection('posts').doc(postId).collection('likes').doc(uid);
        const doc = await likeRef.get();
        let voteChange = 0;

        if (doc.exists) {
            const currentVote = doc.data().value || 1; // Default to 1 if old schema
            console.log(`[DEBUG] Existing vote for user ${uid} on post ${postId}: ${currentVote}`);

            if (currentVote === value) {
                // User clicked same vote -> remove it (toggle)
                await likeRef.delete();
                voteChange = -value;
            } else {
                // User changed vote -> update it
                await likeRef.set({ value, likedAt: new Date() });
                voteChange = value - currentVote; // e.g., -1 - 1 = -2
            }
        } else {
            // New vote
            await likeRef.set({ value, likedAt: new Date() });
            voteChange = value;
        }

        await db.collection('posts').doc(postId).update({
            likesCount: admin.firestore.FieldValue.increment(voteChange)
        });

        res.json({ message: "Vote updated", voteChange });
    } catch (error) {
        console.error("Error updating vote:", error);
        res.status(500).json({ error: "Failed to update vote" });
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
            return res.status(400).json({ error: "Post not voted" });
        }

        const currentVote = doc.data().value || 1;
        await likeRef.delete();

        await db.collection('posts').doc(postId).update({
            likesCount: admin.firestore.FieldValue.increment(-currentVote)
        });

        res.json({ message: "Vote removed" });
    } catch (error) {
        console.error("Error removing vote:", error);
        res.status(500).json({ error: "Failed to remove vote" });
    }
});

// POST /api/posts/:postId/save
router.post('/:postId/save', async (req, res) => {
    try {
        const { postId } = req.params;
        const { uid } = req.body;

        if (!uid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Get post data to save reference
        const postDoc = await db.collection('posts').doc(postId).get();
        if (!postDoc.exists) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Save to user's savedPosts subcollection
        const savedPostRef = db.collection('users').doc(uid).collection('savedPosts').doc(postId);
        await savedPostRef.set({
            savedAt: new Date(),
            postId: postId
        });

        res.json({ message: "Post saved successfully" });
    } catch (error) {
        console.error("Error saving post:", error);
        res.status(500).json({ error: "Failed to save post" });
    }
});

// DELETE /api/posts/:postId/save
router.delete('/:postId/save', async (req, res) => {
    try {
        const { postId } = req.params;
        const { uid } = req.body;

        if (!uid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Remove from user's savedPosts subcollection
        const savedPostRef = db.collection('users').doc(uid).collection('savedPosts').doc(postId);
        const doc = await savedPostRef.get();

        if (!doc.exists) {
            return res.status(400).json({ error: "Post not saved" });
        }

        await savedPostRef.delete();

        res.json({ message: "Post unsaved successfully" });
    } catch (error) {
        console.error("Error unsaving post:", error);
        res.status(500).json({ error: "Failed to unsave post" });
    }
});

// POST /api/posts/:postId/coffee
router.post('/:postId/coffee', async (req, res) => {
    try {
        const { postId } = req.params;
        const { uid } = req.body;

        if (!uid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const postRef = db.collection('posts').doc(postId);
        const doc = await postRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Post not found" });
        }

        const postData = doc.data();
        const coffeeBy = postData.coffeeBy || [];

        if (coffeeBy.includes(uid)) {
            return res.status(400).json({ error: "User already gave coffee" });
        }

        coffeeBy.push(uid);

        await postRef.update({
            coffees: admin.firestore.FieldValue.increment(1),
            coffeeBy: coffeeBy
        });

        res.json({ message: "Coffee added", coffees: (postData.coffees || 0) + 1 });
    } catch (error) {
        console.error("Error adding coffee:", error);
        res.status(500).json({ error: "Failed to add coffee" });
    }
});

// DELETE /api/posts/:postId/coffee
router.delete('/:postId/coffee', async (req, res) => {
    try {
        const { postId } = req.params;
        const { uid } = req.body;

        if (!uid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const postRef = db.collection('posts').doc(postId);
        const doc = await postRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Post not found" });
        }

        const postData = doc.data();
        const coffeeBy = postData.coffeeBy || [];

        if (!coffeeBy.includes(uid)) {
            return res.status(400).json({ error: "User has not given coffee" });
        }

        const updatedCoffeeBy = coffeeBy.filter(id => id !== uid);

        await postRef.update({
            coffees: admin.firestore.FieldValue.increment(-1),
            coffeeBy: updatedCoffeeBy
        });

        res.json({ message: "Coffee removed", coffees: Math.max(0, (postData.coffees || 1) - 1) });
    } catch (error) {
        console.error("Error removing coffee:", error);
        res.status(500).json({ error: "Failed to remove coffee" });
    }
});

module.exports = router;
