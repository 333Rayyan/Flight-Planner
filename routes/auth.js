const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const axios = require('axios');
const db = require('../db');

const router = express.Router();

router.get('/register', (req, res) => {
    res.render("register", { errorMessages: [], formData: {}, oldData: {} });
});

router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
        body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long').trim().escape(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
            .matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
            .withMessage('Password must include one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).'),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),
        body('h-captcha-response').notEmpty().withMessage('Captcha verification failed'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        const { email, username, password, 'h-captcha-response': captchaToken } = req.body;

        if (!errors.isEmpty()) {
            return res.status(400).render('register', {
                errorMessages: errors.array(),
                oldData: { email, username },
            });
        }

        try {
            const captchaSecret = process.env.HCAPTCHA_SECRET_KEY;
            const captchaVerifyURL = 'https://hcaptcha.com/siteverify';

            const captchaResponse = await axios.post(captchaVerifyURL, null, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: {
                    secret: captchaSecret,
                    response: captchaToken,
                },
            });

            if (!captchaResponse.data.success) {
                console.error('Captcha verification failed:', captchaResponse.data['error-codes']);
                return res.status(400).render('register', {
                    errorMessages: [{ msg: 'Captcha verification failed. Please try again.' }],
                    oldData: { email, username },
                });
            }
        } catch (captchaError) {
            console.error('Captcha verification error:', captchaError.message);
            return res.status(500).render('register', {
                errorMessages: [{ msg: 'Internal error during captcha verification.' }],
                oldData: { email, username },
            });
        }

        // If captcha is verified, continue with registration
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const [result] = await db.pool.query(
                'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                [username, hashedPassword, email]
            );

            if (result.affectedRows) {
                return res.redirect('/login');
            } else {
                return res.status(500).render('register', {
                    errorMessages: [{ msg: 'Error registering user.' }],
                    oldData: { email, username },
                });
            }
        } catch (err) {
            console.error(err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).render('register', {
                    errorMessages: [{ msg: 'Username or email already exists.' }],
                    oldData: { email, username },
                });
            } else {
                return res.status(500).render('register', {
                    errorMessages: [{ msg: 'Internal server error.' }],
                    oldData: { email, username },
                });
            }
        }
    }
);

router.get('/login', (req, res) => {
    res.render("login", { errorMessages: [], oldData: {} });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const errorMessages = [];
    const oldData = { username };

    try {
        if (!username || !password) {
            if (!username) errorMessages.push({ msg: 'Username is required.' });
            if (!password) errorMessages.push({ msg: 'Password is required.' });
            return res.render('login', { errorMessages, oldData });
        }

        const [rows] = await db.pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            errorMessages.push({ msg: 'Invalid username or password.' });
            return res.render('login', { errorMessages, oldData });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            errorMessages.push({ msg: 'Invalid username or password.' });
            return res.render('login', { errorMessages, oldData });
        }

        req.session.user = { id: user.id, username: user.username };
        res.redirect(req.session.returnTo || '/');
        delete req.session.returnTo;
    } catch (err) {
        console.error(err);
        errorMessages.push({ msg: 'Internal server error. Please try again later.' });
        res.render('login', { errorMessages, oldData });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Unable to log out.');
        }
        res.redirect('/login');
    });
});

module.exports = router;