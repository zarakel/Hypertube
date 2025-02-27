const express = require('express');
const path = require('path');

const router = express.Router();

// Endpoint pour tester la récupération d'une vidéo
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../videos/testvideo/testvideo.mp4'));
});

// TODO: Ajouter d'autres routes pour la gestion des vidéos

module.exports = router;
