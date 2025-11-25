const express = require('express');
const router = express.Router();
const { admin, db } = require('../firebase');

router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split("Bearer ")[1];

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        const uid = decoded.uid;

        const userDoc = await db.collection('users').doc(uid).get();

        res.json({ uid, ...userDoc.data() });

    } catch (err) {
        res.status(401).json({ error: "Unauthorized" });
    }
});

module.exports = router;
