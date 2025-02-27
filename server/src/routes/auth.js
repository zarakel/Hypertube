const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// Route d'inscription
router.post('/register', authController.register);

// Route de connexion
router.post('/login', authController.login);

// Route de demande de réinitialisation de mot de passe
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;
