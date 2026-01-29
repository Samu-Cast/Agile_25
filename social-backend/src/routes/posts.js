const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// GET /api/posts
router.get('/', async (req, res) => {
    try {
        const { uid, authorUid, filter, sort, communityId, type } = req.query;
        let query = db.collection('posts');

        // Filter by community
        if (communityId) {
            query = query.where('communityId', '==', communityId);
        }

        // Filter by type (post or review)
        if (type) {
            query = query.where('type', '==', type);
        }

        // If filtering by specific author (Profile page usage)
        if (authorUid) {
            query = query.where('uid', '==', authorUid);
        }

        // Filter by participant
        if (req.query.participatingUid) {
            query = query.where('participants', 'array-contains', req.query.participatingUid);
        }

        const postsSnapshot = await query.get();

        // Fetch user's following list if filter is 'followed'
        let followingIds = new Set();
        if (filter === 'followed' && uid) {
            const followingSnap = await db.collection('users').doc(uid).collection('following').get();
            followingSnap.forEach(doc => followingIds.add(doc.id));
            // Optional: Include self in feed?
            // followingIds.add(uid); 
        }

        let posts = postsSnapshot.docs.map(doc => {
            const postData = doc.data();
            let userVote = 0;

            // Get user's vote from votedBy map
            if (uid && postData.votedBy && postData.votedBy[uid] !== undefined) {
                userVote = postData.votedBy[uid];
            }

            return {
                id: doc.id,
                ...postData,
                userVote,
                // Ensure createdAt is a string for frontend
                createdAt: postData.createdAt ? postData.createdAt.toDate().toISOString() : null,
                createdAtObj: postData.createdAt ? postData.createdAt.toDate() : new Date(0) // For sorting
            };
        });

        // Apply filters
        if (filter === 'followed' && uid) {
            posts = posts.filter(post => followingIds.has(post.uid));
        }

        // Apply sorting
        if (sort === 'popular') {
            // Sort by votes (descending)
            posts.sort((a, b) => (b.votes || 0) - (a.votes || 0));
        } else {
            // Default: Sort by createdAt (descending) - Newest first
            posts.sort((a, b) => b.createdAtObj - a.createdAtObj);
        }

        // Remove temp sorting key
        posts = posts.map(({ createdAtObj, ...rest }) => rest);

        res.json(posts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

// POST /api/posts
router.post('/', async (req, res) => {
    try {
        const {
            uid, entityType, entityId, text, imageUrl, createdAt, commentsCount, communityId,
            type, reviewData, mediaUrls, taggedUsers
        } = req.body;

        if (!text || !uid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate review-specific fields
        if (type === 'review') {
            if (!reviewData || !reviewData.rating || !reviewData.itemName) {
                return res.status(400).json({ error: "Missing required review fields (rating, itemName)" });
            }
            if (reviewData.rating < 0.5 || reviewData.rating > 5) {
                return res.status(400).json({ error: "Rating must be between 0.5 and 5" });
            }
            // Accept half ratings (0.5, 1, 1.5, 2, 2.5, etc.)
            if ((reviewData.rating * 10) % 5 !== 0) {
                return res.status(400).json({ error: "Rating must be in 0.5 increments" });
            }
        }

        // Validate comparison-specific fields
        let comparisonData = req.body.comparisonData;
        if (type === 'comparison') {
            if (!comparisonData || !comparisonData.item1 || !comparisonData.item2 || !comparisonData.item1.name || !comparisonData.item2.name) {
                return res.status(400).json({ error: "Missing required comparison fields (two items with names)" });
            }
        }

        const newPost = {
            uid,
            entityType: entityType || "user",
            entityId: entityId || uid,
            communityId: communityId || null,
            type: type || "post", // "post", "review", "comparison"
            text,
            imageUrl: imageUrl || null, // Legacy support
            mediaUrls: mediaUrls || (imageUrl ? [imageUrl] : []), // Array of media URLs
            taggedUsers: taggedUsers || [], // Array of tagged user UIDs
            createdAt: createdAt ? new Date(createdAt) : new Date(),
            votes: 0,
            votedBy: {},
            commentsCount: commentsCount || 0
        };

        // Add review-specific data if it's a review
        if (type === 'review' && reviewData) {
            newPost.reviewData = {
                itemName: reviewData.itemName,
                itemType: reviewData.itemType || "other",
                brand: reviewData.brand || null,
                rating: reviewData.rating,
            };
        }

        // Add event-specific data if it's an event
        if (type === 'event' && req.body.eventDetails) {
            newPost.eventDetails = req.body.eventDetails;
            newPost.hosts = req.body.hosts || [];
            newPost.participants = req.body.participants || [];
        }

        // Add comparison-specific data if it's a comparison
        if (type === 'comparison' && comparisonData) {
            newPost.comparisonData = {
                item1: {
                    name: comparisonData.item1.name,
                    brand: comparisonData.item1.brand || '',
                    image: comparisonData.item1.image || null
                },
                item2: {
                    name: comparisonData.item2.name,
                    brand: comparisonData.item2.brand || '',
                    image: comparisonData.item2.image || null
                }
            };
        }

        // Add comparison-specific data if it's a comparison
        if (type === 'comparison' && comparisonData) {
            newPost.comparisonData = {
                item1: {
                    name: comparisonData.item1.name,
                    brand: comparisonData.item1.brand || '',
                    image: comparisonData.item1.image || null
                },
                item2: {
                    name: comparisonData.item2.name,
                    brand: comparisonData.item2.brand || '',
                    image: comparisonData.item2.image || null
                }
            };
        }

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
        const { text, uid, parentComment, mediaUrls } = req.body;

        if (!text || !uid) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newComment = {
            text,
            uid,
            parentComment: parentComment || null,
            mediaUrls: mediaUrls || [],
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

        const postRef = db.collection('posts').doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return res.status(404).json({ error: "Post not found" });
        }

        const postData = postDoc.data();
        const votedBy = postData.votedBy || {};
        const currentVote = votedBy[uid];
        let voteChange = 0;

        if (currentVote !== undefined) {
            if (currentVote === value) {
                // User clicked same vote -> remove it (toggle)
                delete votedBy[uid];
                voteChange = -value;
            } else {
                // User changed vote -> update it
                votedBy[uid] = value;
                voteChange = value - currentVote; // e.g., -1 - 1 = -2
            }
        } else {
            // New vote
            votedBy[uid] = value;
            voteChange = value;
        }

        await postRef.update({
            votedBy,
            votes: admin.firestore.FieldValue.increment(voteChange)
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

        const postRef = db.collection('posts').doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return res.status(404).json({ error: "Post not found" });
        }

        const postData = postDoc.data();
        const votedBy = postData.votedBy || {};
        const currentVote = votedBy[uid];

        if (currentVote === undefined) {
            return res.status(400).json({ error: "Post not voted" });
        }

        delete votedBy[uid];

        await postRef.update({
            votedBy,
            votes: admin.firestore.FieldValue.increment(-currentVote)
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

// POST /api/posts/:postId/rating
router.post('/:postId/rating', async (req, res) => {
    try {
        const { postId } = req.params;
        const { uid, rating } = req.body;

        if (!uid || rating === undefined) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (rating < 0 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 0 and 5" });
        }

        const postRef = db.collection('posts').doc(postId);
        const doc = await postRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Post not found" });
        }

        const postData = doc.data();
        const ratingBy = postData.ratingBy || {};
        ratingBy[uid] = rating;

        await postRef.update({ ratingBy });

        res.json({ message: "Rating updated", ratingBy });
    } catch (error) {
        console.error("Error updating rating:", error);
        res.status(500).json({ error: "Failed to update rating" });
    }
});

// DELETE /api/posts/:postId
router.delete('/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { uid } = req.body;

        console.log(`[DELETE] Attempting to delete post ${postId} by user ${uid}`);

        if (!uid) {
            console.warn(`[DELETE] Failed: Missing required fields (uid) for post ${postId}`);
            return res.status(400).json({ error: "Missing required fields" });
        }

        const postRef = db.collection('posts').doc(postId);
        const doc = await postRef.get();

        if (!doc.exists) {
            console.warn(`[DELETE] Failed: Post ${postId} not found`);
            return res.status(404).json({ error: "Post not found" });
        }

        const postData = doc.data();

        if (postData.uid !== uid) {
            console.warn(`[DELETE] Failed: Unauthorized deletion attempt for post ${postId} by user ${uid} (Owner: ${postData.uid})`);
            return res.status(403).json({ error: "Unauthorized" });
        }

        await postRef.delete();
        console.log(`[DELETE] Success: Post ${postId} deleted by user ${uid}`);

        res.json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error(`[DELETE] Error deleting post ${req.params.postId}:`, error);
        res.status(500).json({ error: "Failed to delete post" });
    }
});

module.exports = router;
