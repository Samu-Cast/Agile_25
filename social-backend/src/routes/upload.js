const express = require('express');
const router = express.Router();
const multer = require('multer');
const { admin } = require('../config/firebase');

// Multer config - store in memory
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

// POST /api/upload
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const folder = req.body.folder || 'posts';
        const timestamp = Date.now();
        const fileName = `${timestamp}_${req.file.originalname}`;
        const filePath = `${folder}/${fileName}`;

        // Upload to Firebase Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(filePath);

        await file.save(req.file.buffer, {
            metadata: {
                contentType: req.file.mimetype
            }
        });

        // Make file public
        await file.makePublic();

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        res.json({ url: publicUrl });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

module.exports = router;
