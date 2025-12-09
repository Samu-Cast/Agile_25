require('dotenv').config();
const { db, admin } = require('./config/firebase');

console.log("DB keys:", Object.keys(db));
console.log("Is Mock?", db.collection('posts').add.toString().includes('mock'));

async function test() {
    try {
        const mockDoc = await db.collection('posts').doc('mock-1').get();
        console.log("Does mock-1 exist?", mockDoc.exists);
        if (mockDoc.exists) console.log("Mock-1 data:", mockDoc.data());

    } catch (e) {
        console.error("Error fetching posts:", e);
    }
}

test();
