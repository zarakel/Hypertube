const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/profile', verifyToken, async (req, res) => {
    // Logique pour récupérer le profil de l'utilisateur connecté
});

module.exports = router;
