const express = require("express");
const router = express.Router();
const db = require('../db');

// Middleware to protect routes
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
}

// API route to get bookmarks
router.get('/bookmarks', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;

    try {
        const [bookmarks] = await db.query(
            'SELECT id, origin, destination, departure_date, return_date, price FROM bookmarks WHERE user_id = ?',
            [userId]
        );

        res.json({ success: true, bookmarks });
    } catch (error) {
        console.error('Error fetching bookmarks:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch bookmarks.' });
    }
});

// API route to delete a bookmark
router.delete('/bookmarks/:id', isAuthenticated, async (req, res) => {
    const bookmarkId = req.params.id;
    const userId = req.session.user.id;

    try {
        const [result] = await db.query(
            'DELETE FROM bookmarks WHERE id = ? AND user_id = ?',
            [bookmarkId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Bookmark not found or does not belong to the user.' });
        }

        res.json({ success: true, message: 'Bookmark deleted successfully.' });
    } catch (error) {
        console.error('Error deleting bookmark:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete bookmark.' });
    }
});

module.exports = router;