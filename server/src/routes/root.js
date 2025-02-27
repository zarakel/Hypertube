const express = require('express');

const router = express.Router();

// Route de test pour récupérer les utilisateurs
router.get('/', (req, res) => {
    res.send('Welcome to the Hypertube API!')
});

// TODO: Ajouter les routes pour l'inscription, la connexion, etc.

module.exports = router;
