const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Connexion à la DB
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const register = async (req, res) => {
    const { username, password, email, firstname, lastname } = req.body;
    try {
        const result = await db.pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            return res.status(400).json({ message: "Username already exists" });
        }
        if (username == null | password == null | email == null | firstname == null | lastname == null) {
            return res.status(400).json({ message: "One of the field is empty" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertQuery = 'INSERT INTO users (username, password, email, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        const insertResult = await db.pool.query(insertQuery, [username, hashedPassword, email, firstname, lastname]);

        const newUser = insertResult.rows[0];
        console.log("New user created:", newUser);
        res.status(201).json({ id: newUser.id, username: newUser.username });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: error });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET_KEY, {
            expiresIn: '1h',
        });

        res.json({ token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Vérifier si l'utilisateur existe
        const result = await db.pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // Générer un token de réinitialisation
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // Expire dans 1 heure

        // Enregistrer le token dans la base de données
        await db.pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
            [resetToken, expiresAt, email]
        );

        // Configuration de l'envoi d'email
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              type: "OAuth2",
              user: process.env.EMAIL_USER,
              accessToken: "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",
            },
          });

        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset Request",
            html: `<p>Click the link below to reset your password:</p>
                   <a href="${resetLink}">Reset Password</a>
                   <p>This link will expire in 1 hour.</p>`
        });

        res.json({ message: "Password reset link sent to your email." });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = { register, login, forgotPassword };
