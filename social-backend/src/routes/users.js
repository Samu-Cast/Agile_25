const express = require('express');
const router = express.Router();
const { db, admin } = require('../firebase');

// GET /api/users/search
router.get('/search', async (req, res) => {
    try {
        const { q, role } = req.query;
        if (!q || q.length < 2) return res.json([]);

        const usersRef = db.collection('users');
        const results = [];
        const seenUids = new Set();

        const executeQuery = async (field, value) => {
            const queryRef = usersRef
                .where(field, '>=', value)
                .where(field, '<=', value + '\uf8ff');

            const snap = await queryRef.get();
            snap.forEach(doc => {
                if (!seenUids.has(doc.id)) {
                    const userData = doc.data();
                    if (!role || userData.role === role) {
                        results.push({ uid: doc.id, ...userData });
                        seenUids.add(doc.id);
                    }
                }
            });
        };

        // Search strategies (similar to frontend implementation)
        await executeQuery('nickname', q);

        const capitalized = q.charAt(0).toUpperCase() + q.slice(1).toLowerCase();
        if (capitalized !== q) await executeQuery('nickname', capitalized);

        const lower = q.toLowerCase();
        if (lower !== q && lower !== capitalized) await executeQuery('nickname', lower);

        await executeQuery('name', q);
        if (capitalized !== q) await executeQuery('name', capitalized);
        if (lower !== q && lower !== capitalized) await executeQuery('name', lower);

        // Email exact match
        const emailSnap = await usersRef.where('email', '==', q).get();
        emailSnap.forEach(doc => {
            if (!seenUids.has(doc.id)) {
                const userData = doc.data();
                if (!role || userData.role === role) {
                    results.push({ uid: doc.id, ...userData });
                    seenUids.add(doc.id);
                }
            }
        });

        res.json(results);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ error: "Failed to search users" });
    }
});

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

// GET /api/users/search
router.get('/search', async (req, res) => {
    try {
        const { q, role } = req.query;
        if (!q || q.length < 2) return res.json([]);

        const usersRef = db.collection('users');
        const results = [];
        const seenUids = new Set();

        const executeQuery = async (field, value) => {
            const queryRef = usersRef
                .where(field, '>=', value)
                .where(field, '<=', value + '\uf8ff');

            const snap = await queryRef.get();
            snap.forEach(doc => {
                if (!seenUids.has(doc.id)) {
                    const userData = doc.data();
                    if (!role || userData.role === role) {
                        results.push({ uid: doc.id, ...userData });
                        seenUids.add(doc.id);
                    }
                }
            });
        };

        // Search strategies (similar to frontend implementation)
        await executeQuery('nickname', q);

        const capitalized = q.charAt(0).toUpperCase() + q.slice(1).toLowerCase();
        if (capitalized !== q) await executeQuery('nickname', capitalized);

        const lower = q.toLowerCase();
        if (lower !== q && lower !== capitalized) await executeQuery('nickname', lower);

        await executeQuery('name', q);
        if (capitalized !== q) await executeQuery('name', capitalized);
        if (lower !== q && lower !== capitalized) await executeQuery('name', lower);

        // Email exact match
        const emailSnap = await usersRef.where('email', '==', q).get();
        emailSnap.forEach(doc => {
            if (!seenUids.has(doc.id)) {
                const userData = doc.data();
                if (!role || userData.role === role) {
                    results.push({ uid: doc.id, ...userData });
                    seenUids.add(doc.id);
                }
            }
        });

        res.json(results);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ error: "Failed to search users" });
    }
});

// POST /api/users/batch (Get users by UIDs)
router.post('/batch', async (req, res) => {
    try {
        const { uids } = req.body;
        if (!uids || !Array.isArray(uids) || uids.length === 0) {
            return res.json([]);
        }

        const users = [];
        const chunks = [];
        for (let i = 0; i < uids.length; i += 10) {
            chunks.push(uids.slice(i, i + 10));
        }

        for (const chunk of chunks) {
            const snap = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
            snap.forEach(doc => {
                users.push({ uid: doc.id, ...doc.data() });
            });
        }

        res.json(users);
    } catch (error) {
        console.error("Error fetching batch users:", error);
        res.status(500).json({ error: "Failed to fetch batch users" });
    }
});

module.exports = router;

// POST /api/users (Create user profile)
router.post('/', async (req, res) => {
    try {
        const { uid, ...userData } = req.body;

        if (!uid) {
            return res.status(400).json({ error: "Missing uid" });
        }

        await db.collection('users').doc(uid).set(userData, { merge: true });
        res.json({ message: "User created/updated successfully" });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
});

// PUT /api/users/:uid (Update user profile)
router.put('/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const updates = req.body;

        await db.collection('users').doc(uid).update(updates);
        res.json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
});

// GET /api/users/:uid/votedPosts
router.get('/:uid/votedPosts', async (req, res) => {
    try {
        const { uid } = req.params;
        const { type } = req.query; // 1 (up) or -1 (down)
        const voteValue = parseInt(type);

        if (isNaN(voteValue)) {
            return res.status(400).json({ error: "Invalid vote type" });
        }

        // Collection Group Query for likes
        const likesSnapshot = await db.collectionGroup('likes')
            .where('uid', '==', uid)
            .where('value', '==', voteValue)
            .get();

        const postPromises = likesSnapshot.docs.map(doc => doc.ref.parent.parent.get());
        const postDocs = await Promise.all(postPromises);

        const posts = postDocs
            .filter(doc => doc.exists)
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt ? doc.data().createdAt.toDate().toISOString() : null
            }));

        res.json(posts);
    } catch (error) {
        console.error("Error fetching voted posts:", error);
        res.status(500).json({ error: "Failed to fetch voted posts" });
    }
});

// GET /api/users/:uid/savedPosts/details
router.get('/:uid/savedPosts/details', async (req, res) => {
    try {
        const { uid } = req.params;
        const savedPostsSnapshot = await db.collection('users').doc(uid).collection('savedPosts').orderBy('savedAt', 'desc').get();

        const postPromises = savedPostsSnapshot.docs.map(doc => db.collection('posts').doc(doc.id).get());
        const postDocs = await Promise.all(postPromises);

        const posts = postDocs
            .filter(doc => doc.exists)
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt ? doc.data().createdAt.toDate().toISOString() : null
            }));

        res.json(posts);
    } catch (error) {
        console.error("Error fetching saved posts details:", error);
        res.status(500).json({ error: "Failed to fetch saved posts details" });
    }
});
