const fetch = require('node-fetch');

async function testVideoVote() {
    // We need a UID that has saved posts and voted on them.
    // Since I don't know the exact UIDs in the DB, I'll first search for a user or use a hardcoded one if I knew it.
    // I'll try to use a test user flow:
    // 1. Create a user (or use existing)
    // 2. Create a post
    // 3. Vote on the post
    // 4. Save the post
    // 5. Call getSavedPostsDetails

    const API_URL = 'http://localhost:3001/api';

    try {
        // 1. Create user
        const testUid = 'testUser_' + Date.now();
        console.log("Creating user:", testUid);
        await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: testUid, name: 'Test User', email: 'test@test.com' })
        });

        // 2. Create post
        console.log("Creating post...");
        const postRes = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: testUid, text: 'Test Post', authorUid: testUid })
        });
        const postData = await postRes.json();
        const postId = postData.id;
        console.log("Post created:", postId);

        // 3. Vote on post (Upvote)
        console.log("Voting on post...");
        await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: testUid, value: 1 })
        });

        // 4. Save post
        console.log("Saving post...");
        await fetch(`${API_URL}/posts/${postId}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: testUid })
        });

        // 5. Check saved posts details
        console.log("Checking saved posts details...");
        const response = await fetch(`${API_URL}/users/${testUid}/savedPosts/details`);
        const savedPosts = await response.json();

        console.log("Saved Posts Response:", JSON.stringify(savedPosts, null, 2));

        const targetPost = savedPosts.find(p => p.id === postId);
        if (targetPost && targetPost.userVote === 1) {
            console.log("SUCCESS: User vote is correctly returned as 1.");
        } else {
            console.log("FAILURE: User vote is missing or incorrect.", targetPost?.userVote);
        }

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testVideoVote();
