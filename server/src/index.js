require('dotenv').config();  // Charger les variables d'environnement
const express = require('express');
const cors = require('cors');
const { initDB } = require('./config/db');  // Fonction pour initier la connexion à la base de données
const { initServer } = require('./config/server');  // Fonction pour initialiser le serveur (si séparé)
const authRoutes = require('./routes/auth');  // Routes liées à l'authentification
const videosRoutes = require('./routes/videos');  // Routes liées aux vidéos
const rootRoutes = require('./routes/root');  // Route d'accueil de l'API
const protectedRoutes = require('./routes/protectedRoute');  // Exemple de routes protégées

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware pour CORS et JSON
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Initialisation de la base de données
initDB();

// Routes
app.use('/auth', authRoutes);  // Routes pour l'authentification (register, login)
app.use('/videos', videosRoutes);  // Routes pour gérer les vidéos
app.use('/', rootRoutes);  // Route d'accueil pour vérifier l'API
app.use('/protected', protectedRoutes);  // Exemple de route protégée

// Lancer le serveur
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
