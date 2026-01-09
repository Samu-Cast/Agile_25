const express = require('express');
const router = express.Router();
const multer = require('multer');
const { admin } = require('../config/firebase');

// Multer config - store in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB to support videos
    },
    fileFilter: (req, file, cb) => {
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
        const validTypes = [...validImageTypes, ...validVideoTypes];

        if (validTypes.includes(file.mimetype)) {
            // Additional size check based on file type
            if (file.mimetype.startsWith('image/') && req.headers['content-length'] > 5 * 1024 * 1024) {
                cb(new Error('Image file too large. Maximum 5MB for images.'));
            } else if (file.mimetype.startsWith('video/') && req.headers['content-length'] > 50 * 1024 * 1024) {
                cb(new Error('Video file too large. Maximum 50MB for videos.'));
            } else {
                cb(null, true);
            }
        } else {
            cb(new Error('Invalid file type. Only images (JPG, PNG, GIF, WebP) and videos (MP4, MOV, WebM) are allowed.'));
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

        // Generate Signed URL
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Far future
        });

        res.json({ url });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

module.exports = router;
