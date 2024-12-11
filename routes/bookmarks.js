const express = require('express');
const db = require('../db');

const router = express.Router();


function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
}

router.get('/bookmarks', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;

    try {
        const [bookmarks] = await db.query(
            'SELECT * FROM bookmarks WHERE user_id = ?',
            [userId]
        );
        
        bookmarks.forEach(bookmark => {
            bookmark.departure_date = formatDate(bookmark.departure_date);
            bookmark.return_date = formatDate(bookmark.return_date);
            console.log(bookmark.departure_date, bookmark.return_date);
        });

        res.render('bookmarks', {
            bookmarks,
            query: null, 
        });
    } catch (error) {
        console.error('Error fetching bookmarks:', error.message);
        res.status(500).send('Failed to fetch bookmarks.');
    }
});


router.get('/bookmarks/search', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const query = req.query.query;

    try {
        const [bookmarks] = await db.query(
            'SELECT * FROM bookmarks WHERE user_id = ? AND (origin LIKE ? OR destination LIKE ? OR start_location LIKE ? OR end_location LIKE ?)',
            [userId, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
        );

        bookmarks.forEach(bookmark => {
            bookmark.departure_date = formatDate(bookmark.departure_date);
            bookmark.return_date = formatDate(bookmark.return_date);
        });

        res.render('bookmarks', {
            bookmarks,
            query, 
        });
    } catch (error) {
        console.error('Error searching bookmarks:', error.message);
        res.status(500).send('Failed to search bookmarks.');
    }
});


router.post('/bookmarks/toggle', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { origin, startLocation, destination, endLocation, departureDate, returnDate, price } = req.body;
    const userId = req.session.user.id;
    
    try {
        const [existing] = await db.query(
            'SELECT id FROM bookmarks WHERE user_id = ? AND origin = ? AND start_location = ? AND destination = ? AND end_location = ? AND departure_date = ? AND return_date = ? AND price = ?',
            [userId, origin, startLocation, destination, endLocation, departureDate, returnDate, price]
        );

        if (existing.length > 0) {
            await db.query('DELETE FROM bookmarks WHERE id = ?', [existing[0].id]);
            return res.json({ success: true, bookmarked: false });
        } else {
            const departureDateTime = new Date(departureDate).toISOString().slice(0, 19).replace('T', ' ');
            const returnDateTime = new Date(returnDate).toISOString().slice(0, 19).replace('T', ' ');

            await db.query(
                'INSERT INTO bookmarks (user_id, origin, start_location, destination, end_location, departure_date, return_date, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, origin, startLocation, destination, endLocation, departureDateTime, returnDateTime, price]
            );
            return res.json({ success: true, bookmarked: true });
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error.message);
        res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
    }
});

router.delete('/bookmarks/:id', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const bookmarkId = req.params.id;

    try {
        const [deleted] = await db.query(
            'DELETE FROM bookmarks WHERE id = ? AND user_id = ?',
            [bookmarkId, userId]
        );

        if (deleted.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Bookmark not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting bookmark:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete bookmark.' });
    }
});


module.exports = router;
