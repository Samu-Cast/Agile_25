const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

// GET /api/roasters/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const roasterDoc = await db.collection('roasters').doc(id).get();

        if (!roasterDoc.exists) {
            return res.status(404).json({ error: "Roaster not found" });
        }

        res.json({ id: roasterDoc.id, ...roasterDoc.data() });
    } catch (error) {
        console.error("Error fetching roaster:", error);
        res.status(500).json({ error: "Failed to fetch roaster" });
    }
});

// GET /api/roasters
router.get('/', async (req, res) => {
    try {
        const { ownerUid } = req.query;
        let query = db.collection('roasters');

        if (ownerUid) {
            query = query.where('ownerUid', '==', ownerUid);
        }

        const snapshot = await query.limit(20).get();
        const roasters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(roasters);
    } catch (error) {
        console.error("Error fetching roasters:", error);
        res.status(500).json({ error: "Failed to fetch roasters" });
    }
});

// POST /api/roasteries
router.post('/', async (req, res) => {
    try {
        const roasteryData = req.body;

        // Basic validation
        if (!roasteryData.name) {
            return res.status(400).json({ error: "Missing required fields: name" });
        }

        // Ensure stats are initialized if not provided
        const finalData = {
            ...roasteryData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            stats: roasteryData.stats || {
                products: 0,
                followers: 0,
                rating: 0,
                reviews: 0
            }
        };

        let ref;
        if (roasteryData.id) {
            // FIXED: use 'roasters' instead of 'roasteries'
            await db.collection('roasters').doc(roasteryData.id).set(finalData);
            ref = db.collection('roasters').doc(roasteryData.id);
        } else {
            // FIXED: use 'roasters' instead of 'roasteries'
            ref = await db.collection('roasters').add(finalData);
        }

        res.json({ id: ref.id, ...finalData });
    } catch (error) {
        console.error("Error creating roastery:", error);
        res.status(500).json({ error: "Failed to create roastery" });
    }
});

// GET /api/roasters/:id/products
router.get('/:id/products', async (req, res) => {
    try {
        const { id } = req.params;
        const snapshot = await db.collection('roasters').doc(id).collection('products').get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

// Configure multer
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (validTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.'));
        }
    }
});

// POST /api/roasters/:id/products
router.post('/:id/products', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const productData = req.body; // text fields
        const file = req.file;

        if (!productData.name) {
            return res.status(400).json({ error: "Product name is required" });
        }

        let imageUrl = productData.imageUrl || '';

        // Handle File Upload if present
        if (file) {
            const folder = 'products';
            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.originalname}`;
            const filePath = `${folder}/${fileName}`;

            const bucket = admin.storage().bucket();
            const storageFile = bucket.file(filePath);

            await storageFile.save(file.buffer, {
                metadata: { contentType: file.mimetype }
            });
            await storageFile.makePublic();
            imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        }

        const newProduct = {
            ...productData,
            imageUrl: imageUrl,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const roasterRef = db.collection('roasters').doc(id);
        const roasterDoc = await roasterRef.get();

        if (!roasterDoc.exists || !roasterDoc.data().stats) {
            console.log("Stats missing for roaster:", id, "Initializing...");
            await roasterRef.set({
                stats: { products: 0, followers: 0, rating: 0, reviews: 0 }
            }, { merge: true });
        }

        const productRef = await roasterRef.collection('products').add(newProduct);

        // Update product count in stats
        await roasterRef.update({
            'stats.products': admin.firestore.FieldValue.increment(1)
        });

        res.json({ id: productRef.id, ...newProduct });
    } catch (error) {
        console.error("Error adding product:", error.message, error.stack);
        res.status(500).json({ error: "Failed to add product: " + error.message });
    }
});

// PUT /api/roasteries/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        await db.collection('roasters').doc(id).update(updates);
        res.json({ message: "Roastery updated successfully" });
    } catch (error) {
        console.error("Error updating roastery:", error);
        res.status(500).json({ error: "Failed to update roastery" });
    }
});

module.exports = router;
