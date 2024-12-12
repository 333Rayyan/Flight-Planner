const express = require('express');
const { callStoredProcedure } = require('../db');

const router = express.Router();

// Middleware to check user authentication
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
}

// Utility function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
}

// Fetch all bookmarks for the authenticated user
router.get('/bookmarks', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;

    try {
        const bookmarks = await callStoredProcedure('GetBookmarksByUser', [userId]);

        // Format dates for display
        bookmarks.forEach(bookmark => {
            bookmark.departure_date = formatDate(bookmark.departure_date);
            bookmark.return_date = formatDate(bookmark.return_date);
        });

        res.render('bookmarks', {
            bookmarks,
            query: null, // No search query
        });
    } catch (error) {
        console.error('Error fetching bookmarks:', error.message);
        res.status(500).send('Failed to fetch bookmarks.');
    }
});

// Search bookmarks based on user query
router.get('/bookmarks/search', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const query = req.query.query || '';

    try {
        const bookmarks = await callStoredProcedure('GetBookmarksByUser', [userId]);

        // Filter bookmarks based on search query
        const filteredBookmarks = bookmarks.filter(bookmark =>
            [bookmark.origin, bookmark.destination, bookmark.start_location, bookmark.end_location]
                .some(field => field.toLowerCase().includes(query.toLowerCase()))
        );

        // Format dates for display
        filteredBookmarks.forEach(bookmark => {
            bookmark.departure_date = formatDate(bookmark.departure_date);
            bookmark.return_date = formatDate(bookmark.return_date);
        });

        res.render('bookmarks', {
            bookmarks: filteredBookmarks,
            query, // Preserve search query in input
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
        // Convert dates to MySQL format
        const formattedDepartureDate = new Date(departureDate).toISOString().slice(0, 19).replace('T', ' ');
        const formattedReturnDate = returnDate ? new Date(returnDate).toISOString().slice(0, 19).replace('T', ' ') : null;


        // Check if the bookmark already exists
        const existingBookmarks = await callStoredProcedure('GetBookmarksByUser', [userId]);
        const existingBookmark = existingBookmarks.find(
            bookmark =>
                bookmark.origin === origin &&
                bookmark.start_location === startLocation &&
                bookmark.destination === destination &&
                bookmark.end_location === endLocation &&
                bookmark.departure_date === formattedDepartureDate &&
                bookmark.return_date === formattedReturnDate &&
                parseFloat(bookmark.price) === parseFloat(price)
        );

        if (existingBookmark) {


            await callStoredProcedure('DeleteBookmark', [existingBookmark.id]);

            return res.json({ success: true, bookmarked: false });
        } else {


            await callStoredProcedure('AddBookmark', [
                userId,
                origin,
                startLocation,
                destination,
                endLocation,
                formattedDepartureDate,
                formattedReturnDate,
                price,
            ]);
  
            return res.json({ success: true, bookmarked: true });
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
    }
});


// Delete a bookmark by ID
router.delete('/bookmarks/:id', isAuthenticated, async (req, res) => {
    const bookmarkId = req.params.id;

    try {
        await callStoredProcedure('DeleteBookmark', [bookmarkId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting bookmark:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete bookmark.' });
    }
});

module.exports = router;
