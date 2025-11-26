const admin = require("firebase-admin");
const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, "firebase-key.json");

let serviceAccount;

if (fs.existsSync(keyPath)) {
  try {
    serviceAccount = require(keyPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "brewhub-bd760.firebasestorage.app"
    });
    console.log("Firebase Admin initialized successfully with firebase-key.json");
  } catch (e) {
    console.error("Error loading firebase-key.json:", e);
  }
} else {
  console.warn("WARNING: firebase-key.json not found in " + keyPath);
  console.warn("Backend will use IN-MEMORY MOCK DB.");
}

let db;
let bucket;

try {
  if (admin.apps.length === 0) {
    // Fallback if init failed in the previous block or wasn't called
    console.warn("Firebase Admin not initialized. DB access will fail.");
  } else {
    db = admin.firestore();
    bucket = admin.storage().bucket();
  }
} catch (error) {
  console.error("Error initializing Firestore/Storage:", error);
}

// Mock db if undefined to prevent immediate crash on require
if (!db) {
  console.warn("Using IN-MEMORY MOCK DB. Data will be lost on restart.");

  const mockData = {
    posts: [
      { id: 'mock-1', text: 'Welcome to BrewHub! (Mock Mode)', uid: 'System', createdAt: { toDate: () => new Date() }, likesCount: 5, commentsCount: 0 }
    ],
    users: [],
    bars: [],
    roasteries: []
  };

  const createMockCollection = (name) => ({
    get: async () => ({
      docs: (mockData[name] || []).map(d => ({
        id: d.id,
        data: () => d
      }))
    }),
    add: async (data) => {
      const id = 'mock-' + Date.now();
      const newItem = { id, ...data };
      if (!mockData[name]) mockData[name] = [];
      mockData[name].push(newItem);
      return { id };
    },
    orderBy: () => createMockCollection(name), // Ignore sort for mock
    where: () => createMockCollection(name),   // Ignore filter for mock
    doc: (docId) => ({
      get: async () => {
        const item = (mockData[name] || []).find(d => d.id === docId);
        return {
          exists: !!item,
          data: () => item
        };
      },
      set: async (data) => {
        if (!mockData[name]) mockData[name] = [];
        const idx = mockData[name].findIndex(d => d.id === docId);
        if (idx >= 0) mockData[name][idx] = { ...mockData[name][idx], ...data };
        else mockData[name].push({ id: docId, ...data });
      },
      update: async (data) => {
        if (!mockData[name]) mockData[name] = [];
        const idx = mockData[name].findIndex(d => d.id === docId);
        if (idx >= 0) {
          // Handle Firestore FieldValue.increment
          const updated = { ...mockData[name][idx] };
          for (const [key, val] of Object.entries(data)) {
            if (val && val.constructor && val.constructor.name === 'NumericIncrementTransform') {
              // This is a hacky check for FieldValue.increment, might fail if class name differs
              // For simplicity in mock, let's assume if it's an object with operand it's increment
              updated[key] = (updated[key] || 0) + (val.operand || 1);
            } else {
              updated[key] = val;
            }
          }
          mockData[name][idx] = updated;
        }
      },
      collection: (subColName) => {
        // Handle subcollections like posts/ID/comments
        // We'll flatten them into a key "posts/ID/comments" in mockData for simplicity
        const flatName = `${name}/${docId}/${subColName}`;
        return createMockCollection(flatName);
      }
    })
  });

  db = {
    collection: (name) => createMockCollection(name),
    collectionGroup: (name) => createMockCollection(name) // Simplified: return all of that name? No, too complex. Return empty for now.
  };

  // Mock Admin SDK parts used
  admin.firestore.FieldValue = {
    increment: (n) => ({ operand: n, constructor: { name: 'NumericIncrementTransform' } }),
    serverTimestamp: () => new Date()
  };
}

module.exports = { admin, db, bucket };
