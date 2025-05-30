const express = require('express');
const axios = require('axios');
const db = require('../db');
const { body, validationResult } = require('express-validator');

const router = express.Router();

async function getAccessToken() {
    try {
        const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token',
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: process.env.API_CLIENT_ID,
                client_secret: process.env.API_CLIENT_SECRET,
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

    originLocationCode = originLocationCode;
    returnDate = returnDate || null;
    children = children ? parseInt(children) : 0;
    maxPrice = maxPrice ? parseInt(maxPrice) : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    // Check if departureDate is invalid or in the past
    if (departureDate) {
        const parsedDepartureDate = new Date(departureDate);
        if (parsedDepartureDate < today) {
            return res.render('search', {
                query: req.query,
                cities: req.app.locals.cities,
                errorMessage: 'Please select a valid departure date in the future.',
            });
        }
    }

    // Check if returnDate is earlier than departureDate
    if (returnDate && departureDate) {
        const parsedDepartureDate = new Date(departureDate);
        const parsedReturnDate = new Date(returnDate);
        if (parsedReturnDate < parsedDepartureDate) {
            return res.render('search', {
                query: req.query,
                cities: req.app.locals.cities,
                errorMessage: 'Return date cannot be earlier than the departure date.',
            });
        }
    }

    if (!departureDate) {
        return res.render('search', {
            query: {
                destinationLocationCode: destinationLocationCode || '',
                originLocationCode: originLocationCode || '',
            },
            cities: req.app.locals.cities,
            errorMessage: null,
        });
    }

    try {
        const accessToken = await getAccessToken();

        let bookmarks = [];
        if (req.session.user) {
            const userId = req.session.user.id;
            bookmarks = await db.callStoredProcedure('GetBookmarksByUser', [userId]);
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
                destinationLocationCode,
                departureDate,
                returnDate,
                adults: parseInt(adults),
                children: parseInt(children),
                currencyCode: "GBP",
                maxPrice: maxPrice || null,
                max: 50,
            },
        });

        const offers = response.data.data || [];
        const dictionaries = response.data.dictionaries || {};

        res.render('flights', {
            cities: req.app.locals.citiesDict,
            offers: offers,
            startLocation: originLocationCode,
            endLocation: destinationLocationCode,
            carriers: dictionaries.carriers || {},
            aircraft: dictionaries.aircraft || {},
            bookmarkedOffers,
            user: req.session.user || null,
        });
    } catch (error) {
        console.error('Error fetching flight offers:', error.response?.data || error.message);
        res.status(500).render('search', {
            query: req.query,
            cities: req.app.locals.cities,
            errorMessage: 'Failed to fetch flight offers. Please try again later.',
        });
    }
});

module.exports = router;