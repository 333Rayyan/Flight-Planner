const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
}

router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const [user] = await db.pool.query(
            'SELECT id, username, email FROM users WHERE id = ?',
            [req.session.user.id]
        );

        if (user.length === 0) {
            return res.redirect('/logout');
        }

        res.render('profile', {
            user: user[0],
            message: req.session.message || null,
            error: req.session.error || null
        });

        delete req.session.message;
        delete req.session.error;
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).send('Failed to load profile.');
    }
});

router.post('/profile/change-password', isAuthenticated, async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    try {
        if (newPassword !== confirmNewPassword) {
            req.session.error = 'Passwords do not match.';
            return res.redirect('/profile');
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/;
        if (!passwordRegex.test(newPassword)) {
            req.session.error = `Password must:
                - Be at least 6 characters long
                - Include at least one uppercase letter
                - Include at least one lowercase letter
                - Include at least one number
                - Include at least one special character (!@#$%^&*)`;
            return res.redirect('/profile');
        }

        const [rows] = await db.pool.query('SELECT password FROM users WHERE id = ?', [req.session.user.id]);
        if (rows.length === 0) {
            req.session.error = 'User not found.';
            return res.redirect('/logout');
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            req.session.error = 'Current password is incorrect.';
            return res.redirect('/profile');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.session.user.id]);

        req.session.message = 'Password successfully updated.';
        res.redirect('/profile');
    } catch (err) {
        console.error('Error changing password:', err);
        req.session.error = 'Failed to change password. Please try again.';
        res.redirect('/profile');
    }
});

router.post('/profile/delete', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;

    try {
        await db.pool.query('DELETE FROM users WHERE id = ?', [userId]);

        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err.message);
                return res.status(500).send('An error occurred while deleting your account.');
            }
            res.redirect('/');
        });
    } catch (error) {
        console.error('Error deleting account:', error.message);
        res.status(500).send('Failed to delete account.');
    }
});

module.exports = router;