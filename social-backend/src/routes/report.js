const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// POST per andare a salvare nel db la richiesta di report
router.post('/', async (req, res) => {
    try {
        const { uid, description } = req.body;

        if (!uid || !description) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newReport = {
            uid,
            description,
            status: 'open',
            createdAt: new Date(),
        };

        const reportRef = await db.collection('reports').add(newReport);
        res.json({ id: reportRef.id, ...newReport });
    } catch (error) {
        console.error("Error creating report:", error);
        res.status(500).json({ error: "Failed to create report" });
    }
});

module.exports = router;
