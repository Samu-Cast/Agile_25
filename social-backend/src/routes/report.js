const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/reports (Fetch all reports for moderators)
// GET /api/reports (Fetch all reports for moderators)
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('reports').orderBy('createdAt', 'desc').get();

        const reportsWithUsers = await Promise.all(snapshot.docs.map(async (doc) => {
            const reportData = doc.data();
            let userName = reportData.uid; // Default to UID if user not found

            if (reportData.uid) {
                try {
                    const userSnap = await db.collection('users').doc(reportData.uid).get();
                    if (userSnap.exists) {
                        const userData = userSnap.data();
                        userName = userData.name || userData.nickname || reportData.uid;
                    }
                } catch (err) {
                    console.error(`Error fetching user ${reportData.uid} for report ${doc.id}:`, err);
                }
            }

            return {
                id: doc.id,
                ...reportData,
                userName,
                createdAt: reportData.createdAt ? reportData.createdAt.toDate().toISOString() : null
            };
        }));

        res.json(reportsWithUsers);
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ error: "Failed to fetch reports" });
    }
});

//PUT /api/reports/:id - Update report status
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: "Missing status" });
        }

        await db.collection('reports').doc(id).update({ status });
        res.json({ message: "Report updated successfully", id, status });
    } catch (error) {
        console.error("Error updating report:", error);
        res.status(500).json({ error: "Failed to update report" });
    }
});

//POST per andare a salvare nel db la richiesta di report
router.post('/', async (req, res) => {
    try {
        const { uid, description, title } = req.body;

        if (!uid || !description || !title) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newReport = {
            uid,
            title,
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
