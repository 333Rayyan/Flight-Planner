const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to protect routes
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
}

// Bookmarks route
router.get('/bookmarks', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;

    try {
        const [bookmarks] = await db.query(
            'SELECT id, origin, destination, departure_date, return_date, price FROM bookmarks WHERE user_id = ?',
            [userId]
        );

        res.render('bookmarks', { bookmarks });
    } catch (error) {
        console.error('Error fetching bookmarks:', error.message);
        res.status(500).send('Failed to fetch bookmarks.');
    }
});

router.post('/bookmark', isAuthenticated, async (req, res) => {
    const { origin, destination, departureDate, returnDate, price } = req.body;
    const userId = req.session.user.id;

    try {
        await db.query(
            'INSERT INTO bookmarks (user_id, origin, destination, departure_date, return_date, price) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, origin, destination, departureDate, returnDate || null, price]
        );

        res.redirect('/bookmarks');
    } catch (error) {
        console.error('Error saving bookmark:', error.message);
        res.status(500).send('Failed to bookmark flight.');
    }
});

router.post('/toggle-bookmark', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { origin, destination, departureDate, returnDate, price } = req.body;
    const userId = req.session.user.id;

    try {
        const [existing] = await db.query(
            'SELECT id FROM bookmarks WHERE user_id = ? AND origin = ? AND destination = ? AND departure_date = ? AND return_date = ?',
            [userId, origin, destination, departureDate, returnDate || null]
        );

        if (existing.length > 0) {
            await db.query('DELETE FROM bookmarks WHERE id = ?', [existing[0].id]);
            return res.json({ success: true, bookmarked: false });
        } else {
            await db.query(
                'INSERT INTO bookmarks (user_id, origin, destination, departure_date, return_date, price) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, origin, destination, departureDate, returnDate || null, price]
            );
            return res.json({ success: true, bookmarked: true });
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error.message);
        res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
    }
});

router.post('/remove-bookmark', isAuthenticated, async (req, res) => {
    const { bookmarkId } = req.body;
    const userId = req.session.user.id;

    try {
        const [result] = await db.query(
            'DELETE FROM bookmarks WHERE id = ? AND user_id = ?',
            [bookmarkId, userId]
        );

        if (result.affectedRows === 0) {
            console.error('Bookmark not found or does not belong to the user.');
        }

        res.redirect('/bookmarks');
    } catch (error) {
        console.error('Error removing bookmark:', error.message);
        res.status(500).send('Failed to remove bookmark.');
    }
});

module.exports = router;