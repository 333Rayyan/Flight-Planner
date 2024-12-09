const express = require('express');
const axios = require('axios');
const router = express.Router();
const db = require('../db');

// Function to generate an access token
async function getAccessToken() {
    try {
        const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token',
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: 'hgLnJgnec1qsOZjH4jiBC5UJMqf1r0hA',
                client_secret: 'mBf6GiYz7iIoTj17',
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error generating access token:', error.response?.data || error.message);
        throw new Error('Failed to get access token');
    }
}

// Search flights route
router.get('/search', async (req, res) => {
    let {
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        adults,
        children,
        maxPrice,
    } = req.query;

    originLocationCode = originLocationCode || 'LON';
    returnDate = returnDate || null;
    children = children ? parseInt(children) : 0;
    maxPrice = maxPrice ? parseInt(maxPrice) : 0;

    if (!departureDate) {
        return res.render('search', {
            query: {
                destinationLocationCode: destinationLocationCode || '',
                originLocationCode: originLocationCode || '',
            },
            cities: req.app.locals.cities,
        });
    }

    try {
        const accessToken = await getAccessToken();

        let bookmarks = [];
        if (req.session.user) {
            const userId = req.session.user.id;
            [bookmarks] = await db.query(
                `SELECT origin, destination, departure_date, return_date FROM bookmarks WHERE user_id = ?`,
                [userId]
            );
        }

        const bookmarkedOffers = bookmarks.map(b => JSON.stringify({
            origin: b.origin,
            destination: b.destination,
            departureDate: b.departure_date.toISOString().split('T')[0],
            returnDate: b.return_date ? b.return_date.toISOString().split('T')[0] : '',
        }));

        const response = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                originLocationCode,
                destinationLocationCode: destinationLocationCode || undefined,
                departureDate,
                returnDate,
                adults: parseInt(adults),
                children: parseInt(children),
                currencyCode: "GBP",
                maxPrice: maxPrice || undefined,
                max: 50,
            },
        });

        const offers = response.data.data || [];
        const dictionaries = response.data.dictionaries || {};

        res.render('flights', {
            cities: req.app.locals.citiesDict,
            offers: offers,
            startingLocation: originLocationCode,
            carriers: dictionaries.carriers || {},
            aircraft: dictionaries.aircraft || {},
            bookmarkedOffers,
            user: req.session.user || null,
        });
    } catch (error) {
        console.error('Error fetching flight offers:', error.response?.data || error.message);
        res.status(500).send('Failed to fetch flight offers');
    }
});

module.exports = router;