const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function test() {
    try {
        console.log("Running Comments Title Test...");
        const uid = 'Ow5hPSJBAYPLXdrvMe4YBaicXin1'; // User from previous logs

        const commentsSnapshot = await db.collectionGroup('comments')
            .where('uid', '==', uid)
            .get();

        console.log(`Found ${commentsSnapshot.size} comments.`);

        const comments = commentsSnapshot.docs.map(doc => {
            // Check if parent.parent exists
            const parent = doc.ref.parent;
            const grandParent = parent.parent;

            return {
                id: doc.id,
                postId: grandParent ? grandParent.id : "NULL_PARENT",
                path: doc.ref.path,
                ...doc.data()
            };
        });

        console.log("Extracted Post IDs:", comments.map(c => c.postId));

        // Fetch post titles
        const postIds = [...new Set(comments.map(c => c.postId).filter(id => id !== "NULL_PARENT"))];

        if (postIds.length > 0) {
            console.log("Fetching titles for Post IDs:", postIds);
            const postsRefs = postIds.map(id => db.collection('posts').doc(id));
            const postsSnapshots = await db.getAll(...postsRefs);

            const postsMap = {};
            postsSnapshots.forEach(doc => {
                if (doc.exists) {
                    postsMap[doc.id] = doc.data().title || "No Title";
                    console.log(`Post ${doc.id} found. Title: ${doc.data().title}`);
                } else {
                    console.log(`Post ${doc.id} does NOT exist.`);
                    postsMap[doc.id] = "Unknown Post";
                }
            });

            comments.forEach(c => {
                c.postTitle = postsMap[c.postId] || "Unknown Post";
            });
        }

        console.log("Final Comments Data (First 3):");
        console.log(JSON.stringify(comments.slice(0, 3), null, 2));

    } catch (error) {
        console.error("ERROR:", error);
    }
}

test();
