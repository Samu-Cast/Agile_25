const express = require('express');
const router = express.Router();
const { db, admin, bucket } = require('../config/firebase');

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

// GET /api/users/:uid/communities
router.get('/:uid/communities', async (req, res) => {
    try {
        const { uid } = req.params;
        const communitiesSnapshot = await db.collection('users').doc(uid).collection('communities').get();

        const communities = communitiesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(communities);
    } catch (error) {
        console.error("Error fetching user communities:", error);
        res.status(500).json({ error: "Failed to fetch user communities" });
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

        console.log(`[PUT /users/${uid}] Received updates:`, Object.keys(updates));

        // Handle Profile Pic Upload (Base64 -> Storage)
        if (updates.profilePic && updates.profilePic.startsWith('data:image')) {
            console.log(`[PUT /users/${uid}] Uploading profile pic to Storage...`);
            try {
                // Extract base64 data
                const matches = updates.profilePic.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const imageType = matches[1];
                    const base64Data = matches[2];
                    const buffer = Buffer.from(base64Data, 'base64');

                    const filename = `users/${uid}/profile_${Date.now()}.${imageType === 'jpeg' ? 'jpg' : imageType}`;
                    const file = bucket.file(filename);

                    await file.save(buffer, {
                        metadata: { contentType: `image/${imageType}` },
                        public: true,
                        validation: false // Disable MD5 check to avoid issues with some node versions/envs
                    });

                    // Construct public URL
                    // Note: This assumes the bucket is readable publicly or we made the file public (we did)
                    updates.profilePic = `https://storage.googleapis.com/${bucket.name}/${filename}`;
                    console.log(`[PUT /users/${uid}] Upload successful: ${updates.profilePic}`);
                }
            } catch (uploadError) {
                console.error("Error uploading to Storage:", uploadError);
                return res.status(500).json({ error: "Failed to upload profile picture" });
            }
        } else if (updates.profilePic) {
            console.log(`[PUT /users/${uid}] profilePic is not base64, assuming URL or unchanged.`);
        }

        await db.collection('users').doc(uid).update(updates);
        res.json({ message: "User updated successfully", profilePic: updates.profilePic });
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

        // Get all posts and filter where user voted with the specified value
        const postsSnapshot = await db.collection('posts').get();

        const posts = postsSnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt ? doc.data().createdAt.toDate().toISOString() : null
            }))
            .filter(post => post.votedBy && post.votedBy[uid] === voteValue);

        res.json(posts);
    } catch (error) {
        console.error("Error fetching voted posts:", error);
        res.status(500).json({ error: "Failed to fetch voted posts" });
    }
});

// GET /api/users/:uid/savedPosts/details
router.get('/:uid/savedPosts/details', async (req, res) => {
    try {
        console.log(`[DEBUG] GET /:uid/savedPosts/details hit for ${req.params.uid}`);
        const { uid } = req.params;
        const savedPostsSnapshot = await db.collection('users').doc(uid).collection('savedPosts').orderBy('savedAt', 'desc').get();

        const postPromises = savedPostsSnapshot.docs.map(doc => db.collection('posts').doc(doc.id).get());
        const postDocs = await Promise.all(postPromises);

        const posts = await Promise.all(postDocs
            .filter(doc => doc.exists)
            .map(async doc => {
                const postData = doc.data();
                let userVote = 0;

                // Check if the user (whose saved posts we are viewing) has voted on this post
                // NOTE: We typically want to know if the *viewer* has voted, but for "Saved Posts",
                // the viewer IS usually the owner of the profile (since it's a private collection typically,
                // or at least checking the "My Saved Posts" uses the same uid).
                // However, the `uid` param here is the owner of the saved playlist.
                // If we want to show if *that* user voted, we use `uid`.
                // If the requirement is "I want to see if I have already voted", and I am looking at MY saved posts,
                // then `uid` is correct.

                const likeDoc = await db.collection('posts').doc(doc.id).collection('likes').doc(uid).get();
                console.log(`[DEBUG] Checking vote for user ${uid} on post ${doc.id}`);
                if (likeDoc.exists) {
                    const data = likeDoc.data();
                    // Default to 1 if value is missing (legacy support)
                    userVote = data.value !== undefined ? data.value : 1;
                    console.log(`[DEBUG] Vote found: ${userVote}`);
                } else {
                    console.log(`[DEBUG] No vote found.`);
                }

                return {
                    id: doc.id,
                    ...postData,
                    userVote,
                    createdAt: postData.createdAt ? postData.createdAt.toDate().toISOString() : null
                };
            }));

        res.json(posts);
    } catch (error) {
        console.error("Error fetching saved posts details:", error);
        res.status(500).json({ error: "Failed to fetch saved posts details" });
    }
});

// POST /api/users/:uid/follow
router.post('/:uid/follow', async (req, res) => {
    try {
        const { uid } = req.params; // The user TO BE followed (target)
        const { currentUid } = req.body; // The user WHO is following (follower)

        if (!uid || !currentUid) {
            return res.status(400).json({ error: "Missing uid or currentUid" });
        }

        if (uid === currentUid) {
            return res.status(400).json({ error: "Cannot follow yourself" });
        }





        const targetUserRef = db.collection('users').doc(uid);
        const currentUserRef = db.collection('users').doc(currentUid);

        // Run as a transaction to ensure consistency
        await db.runTransaction(async (t) => {


            const targetDoc = await t.get(targetUserRef);
            const currentDoc = await t.get(currentUserRef);

            if (!targetDoc.exists || !currentDoc.exists) {

                throw new Error("User not found");
            }



            // 1. Add to target's followers subcollection
            const followerRef = targetUserRef.collection('followers').doc(currentUid);
            t.set(followerRef, {
                uid: currentUid,
                followedAt: new Date()
            });

            // 2. Add to current user's following subcollection
            const followingRef = currentUserRef.collection('following').doc(uid);
            t.set(followingRef, {
                uid: uid,
                followedAt: new Date()
            });



            // 3. Update counts
            // Note: Firestore increment is atomic
            const increment = admin.firestore.FieldValue.increment(1);

            t.update(targetUserRef, {
                'stats.followers': increment
            });
            t.update(currentUserRef, {
                'stats.following': increment
            });


        });



        res.json({ message: "Followed successfully" });
    } catch (error) {

        console.error("Error following user:", error);
        res.status(500).json({ error: error.message || "Failed to follow user" });
    }
});

// POST /api/users/:uid/unfollow
router.post('/:uid/unfollow', async (req, res) => {
    try {
        const { uid } = req.params; // The user TO BE unfollowed
        const { currentUid } = req.body; // The user WHO is unfollowing

        if (!uid || !currentUid) {
            return res.status(400).json({ error: "Missing uid or currentUid" });
        }

        const targetUserRef = db.collection('users').doc(uid);
        const currentUserRef = db.collection('users').doc(currentUid);

        await db.runTransaction(async (t) => {
            const targetDoc = await t.get(targetUserRef);
            const currentDoc = await t.get(currentUserRef);

            if (!targetDoc.exists || !currentDoc.exists) {
                throw new Error("User not found");
            }

            // 1. Remove from target's followers subcollection
            const followerRef = targetUserRef.collection('followers').doc(currentUid);
            t.delete(followerRef);

            // 2. Remove from current user's following subcollection
            const followingRef = currentUserRef.collection('following').doc(uid);
            t.delete(followingRef);

            // 3. Update counts (decrement)
            // We should check if count > 0 ideally, but increment(-1) is standard
            t.update(targetUserRef, {
                'stats.followers': admin.firestore.FieldValue.increment(-1)
            });
            t.update(currentUserRef, {
                'stats.following': admin.firestore.FieldValue.increment(-1)
            });
        });

        res.json({ message: "Unfollowed successfully" });
    } catch (error) {
        console.error("Error unfollowing user:", error);
        res.status(500).json({ error: error.message || "Failed to unfollow user" });
    }
});

// GET /api/users/:uid/checkFollow/:targetUid
router.get('/:uid/checkFollow/:targetUid', async (req, res) => {
    try {
        const { uid, targetUid } = req.params;
        // Check if 'uid' is following 'targetUid'
        // We can check if targetUid exists in uid's 'following' collection
        const doc = await db.collection('users').doc(uid).collection('following').doc(targetUid).get();
        res.json({ isFollowing: doc.exists });
    } catch (error) {
        console.error("Error checking follow status:", error);
        res.status(500).json({ error: "Failed to check follow status" });
    }
});

// GET /api/users/:uid/followers
router.get('/:uid/followers', async (req, res) => {
    try {
        const { uid } = req.params;
        const snapshot = await db.collection('users').doc(uid).collection('followers').get();
        const followerIds = snapshot.docs.map(doc => doc.id);
        res.json(followerIds);
    } catch (error) {
        console.error("Error fetching followers:", error);
        res.status(500).json({ error: "Failed to fetch followers" });
    }
});

// GET /api/users/:uid/following
router.get('/:uid/following', async (req, res) => {
    try {
        const { uid } = req.params;
        const snapshot = await db.collection('users').doc(uid).collection('following').get();
        const followingIds = snapshot.docs.map(doc => doc.id);
        res.json(followingIds);
    } catch (error) {
        console.error("Error fetching following:", error);
        res.status(500).json({ error: "Failed to fetch following" });
    }
});

module.exports = router;
