const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const mysql = require("mysql2");
const session = require("express-session");
const bcrypt = require('bcrypt');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { error } = require("console");

const app = express();
app.use(express.json());
const PORT = 8000;

// Amadeus API credentials
const CLIENT_ID = 'hgLnJgnec1qsOZjH4jiBC5UJMqf1r0hA'; // Replace with your client ID
const CLIENT_SECRET = 'mBf6GiYz7iIoTj17'; // Replace with your client secret

// Predefined list of cities with IATA codes
const cities = [
    { name: "Amsterdam", code: "AMS" },
    { name: "Barcelona", code: "BCN" },
    { name: "Beijing", code: "PEK" },
    { name: "Berlin", code: "BER" },
    { name: "Bogota", code: "BOG" },
    { name: "Buenos Aires", code: "EZE" },
    { name: "Brussels", code: "BRU" },
    { name: "Cairo", code: "CAI" },
    { name: "Cape Town", code: "CPT" },
    { name: "Chicago", code: "ORD" },
    { name: "Copenhagen", code: "CPH" },
    { name: "Delhi", code: "DEL" },
    { name: "Dhaka", code: "DAC" },
    { name: "Dubai", code: "DXB" },
    { name: "Frankfurt", code: "FRA" },
    { name: "Guangzhou", code: "CAN" },
    { name: "Helsinki", code: "HEL" },
    { name: "Hong Kong", code: "HKG" },
    { name: "Istanbul", code: "IST" },
    { name: "Johannesburg", code: "JNB" },
    { name: "Lisbon", code: "LIS" },
    { name: "London", code: "LON" },
    { name: "Los Angeles", code: "LAX" },
    { name: "Madrid", code: "MAD" },
    { name: "Melbourne", code: "MEL" },
    { name: "Mexico City", code: "MEX" },
    { name: "Mumbai", code: "BOM" },
    { name: "New York", code: "NYC" },
    { name: "Oslo", code: "OSL" },
    { name: "Paris", code: "PAR" },
    { name: "Prague", code: "PRG" },
    { name: "Rio de Janeiro", code: "GIG" },
    { name: "Rome", code: "FCO" },
    { name: "Santiago", code: "SCL" },
    { name: "Sao Paulo", code: "GRU" },
    { name: "Seoul", code: "ICN" },
    { name: "Shanghai", code: "PVG" },
    { name: "Singapore", code: "SIN" },
    { name: "Stockholm", code: "ARN" },
    { name: "Sydney", code: "SYD" },
    { name: "Tokyo", code: "TYO" },
    { name: "Toronto", code: "YYZ" },
    { name: "Vienna", code: "VIE" },
    { name: "Warsaw", code: "WAW" },
    { name: "Zurich", code: "ZRH" }
];





// Function to generate an access token
async function getAccessToken() {
    try {
        const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token',
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );
        return response.data.access_token; // Return the access token
    } catch (error) {
        console.error('Error generating access token:', error.response?.data || error.message);
        throw new Error('Failed to get access token');
    }
}




// Database connection
const pool = mysql.createPool({
    host: "localhost",
    user: "flightPlannerApp",
    password: "password",
    database: "flightPlanner",
});

// Middleware to make database available in routes
app.use((req, res, next) => {
    req.db = pool.promise();
    next();
});

// Middleware setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Middleware to make the user session available in all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use(express.json());

// Middleware to protect routes
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    req.session.returnTo = req.originalUrl; // Save requested URL for after login
    res.redirect('/login');
}

// Routes

// Home route
app.get("/", (req, res) => {
    pool.query("SELECT name, description FROM destinations", (error, results) => {
        if (error) {
            return res.status(500).send("Error retrieving destinations from database.");
        }
        res.render("home", { title: "Flight Planner", destinations: results });
    });
});

// About route
app.get("/about", (req, res) => {
    res.render("about");
});

// Register route
app.get('/register', (req, res) => {
    res.render("register", { errorMessages: [], formData: {} , oldData: {}});
});


app.post(
    '/register',
    [
        // Validation and sanitization
        body('email')
            .isEmail()
            .withMessage('Enter a valid email address')
            .normalizeEmail(),
        body('username')
            .isLength({ min: 3 })
            .withMessage('Username must be at least 3 characters long')
            .trim()
            .escape(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
            .matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
            .withMessage('Password must include one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).'),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords do not match');
                }
                return true;
            }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        const { email, username, password } = req.body;

        if (!errors.isEmpty()) {
            // Render the form again with error messages and old input
            return res.status(400).render('register', {
                errorMessages: errors.array(),
                oldData: { email, username },
            });
        }

        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into the database
            const [result] = await req.db.query(
                'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                [username, hashedPassword, email]
            );

            if (result.affectedRows) {
                return res.redirect('/login'); // Redirect to login page
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




// Login route
app.get('/login', (req, res) => {
    res.render("login", { errorMessages: [], oldData: {} });
});



app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const errorMessages = [];
    const oldData = { username };

    try {
        // Check if username and password are provided
        if (!username || !password) {
            if (!username) errorMessages.push({ msg: 'Username is required.' });
            if (!password) errorMessages.push({ msg: 'Password is required.' });
            return res.render('login', { errorMessages, oldData });
        }

        // Query the database for the user
        const [rows] = await req.db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            errorMessages.push({ msg: 'Invalid username or password.' });
            return res.render('login', { errorMessages, oldData });
        }

        const user = rows[0];

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            errorMessages.push({ msg: 'Invalid username or password.' });
            return res.render('login', { errorMessages, oldData });
        }

        // If login is successful, set the session
        req.session.user = { id: user.id, username: user.username };
        res.redirect(req.session.returnTo || '/');
        delete req.session.returnTo;
    } catch (err) {
        console.error(err);
        errorMessages.push({ msg: 'Internal server error. Please try again later.' });
        res.render('login', { errorMessages, oldData });
    }
});


// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Unable to log out.');
        }
        res.redirect('/login');
    });
});

// Route: Profile Page
app.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const [user] = await req.db.query(
            'SELECT id, username, email FROM users WHERE id = ?',
            [req.session.user.id]
        );

        if (user.length === 0) {
            return res.redirect('/logout');
        }

        res.render('profile', {
            user: user[0],
            message: req.session.message || null, // Use a message if set
            error: req.session.error || null // Use an error if set
        });

        // Clear session variables after rendering
        delete req.session.message;
        delete req.session.error;
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).send('Failed to load profile.');
    }
});



app.post('/profile/change-password', isAuthenticated, async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    try {
        // Validate new password matches confirmation
        if (newPassword !== confirmNewPassword) {
            req.session.error = 'Passwords do not match.';
            return res.redirect('/profile');
        }

        // Validate password strength
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

        // Fetch user's current password
        const [rows] = await req.db.query('SELECT password FROM users WHERE id = ?', [req.session.user.id]);
        if (rows.length === 0) {
            req.session.error = 'User not found.';
            return res.redirect('/logout');
        }

        const user = rows[0];

        // Check if the current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            req.session.error = 'Current password is incorrect.';
            return res.redirect('/profile');
        }

        // Hash and update the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await req.db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.session.user.id]);

        // Set a success message and redirect
        req.session.message = 'Password successfully updated.';
        res.redirect('/profile');
    } catch (err) {
        console.error('Error changing password:', err);
        req.session.error = 'Failed to change password. Please try again.';
        res.redirect('/profile');
    }
});




app.post('/profile/delete', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id; // Get user ID from session

    try {
        // Delete the user from the database
        await req.db.query('DELETE FROM users WHERE id = ?', [userId]);

        // Destroy the session
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




// Convert the cities array to a dictionary
const citiesDict = cities.reduce((acc, city) => {
    acc[city.code] = city.name;
    return acc;
}, {});



// Flight destinations route
app.get('/flight-destinations', async (req, res) => {
    let {
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        adults,
        children,
        maxPrice,
    } = req.query;

    // Default values
    originLocationCode = originLocationCode || 'LON'; // Default to London if not provided
    returnDate = returnDate || null; // Default to null if not provided
    children = children ? parseInt(children) : 0; // Default to 0 if not provided
    maxPrice = maxPrice ? parseInt(maxPrice) : 0; // Default to 0 if not provided

    try {
        // Get access token
        const accessToken = await getAccessToken();

        // Fetch user's bookmarked flights
        let bookmarks = [];
        if (req.session.user) {
            const userId = req.session.user.id;
            [bookmarks] = await req.db.query(
                `SELECT origin, destination, departure_date, return_date FROM bookmarks WHERE user_id = ?`,
                [userId]
            );
        };

        // Prepare bookmarked flight data for comparison
        const bookmarkedOffers = bookmarks.map(b => JSON.stringify({
            origin: b.origin,
            destination: b.destination,
            departureDate: b.departure_date.toISOString().split('T')[0],
            returnDate: b.return_date ? b.return_date.toISOString().split('T')[0] : '',
        }));

        // Fetch flight offers
        const response = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                originLocationCode,
                destinationLocationCode: destinationLocationCode || undefined, // Only add destination if provided
                departureDate,
                returnDate,
                adults: parseInt(adults),
                children: parseInt(children),
                currencyCode: "GBP", // Default currency
                maxPrice: maxPrice || undefined,
                max: 50,
            },
        });

        const offers = response.data.data || [];
        const dictionaries = response.data.dictionaries || {};

        const offer = offers[0];
        const itinerary = offer.itineraries[0];
        itinerary.segments.forEach(segment => {
            console.log(segment)
        })

        // Render the flight-destinations template
        res.render('flight-destinations', {
            cities: citiesDict,
            offers: offers,
            startingLocation: originLocationCode,
            carriers: dictionaries.carriers || {},
            aircraft: dictionaries.aircraft || {},
            bookmarkedOffers, // Pass this to the template for comparison
            user: req.session.user || null,
        });
    } catch (error) {
        console.error('Error fetching flight offers:', error.response?.data || error.message);
        res.status(500).send('Failed to fetch flight offers');
    }
});



// Search page route
app.get('/search', (req, res) => {
    const { destinationLocationCode, originLocationCode } = req.query;

    res.render('search', {
        query: {
            destinationLocationCode: destinationLocationCode || '',
            originLocationCode: originLocationCode || '',
        },
        cities,
    });
});

// Test route to generate an access token
app.get('/test-token', async (req, res) => {
    try {
        const token = await getAccessToken();
        res.send(`Access Token: ${token}`);
    } catch (error) {
        res.status(500).send('Failed to get access token');
    }
});

app.get('/bookmarks', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;

    try {
        const [bookmarks] = await req.db.query(
            'SELECT id, origin, destination, departure_date, return_date, price FROM bookmarks WHERE user_id = ?',
            [userId]
        );

        res.render('bookmarks', { bookmarks });
    } catch (error) {
        console.error('Error fetching bookmarks:', error.message);
        res.status(500).send('Failed to fetch bookmarks.');
    }
});


app.post('/bookmark', isAuthenticated, async (req, res) => {
    const { origin, destination, departureDate, returnDate, price } = req.body;
    const userId = req.session.user.id;

    try {
        // Save the full datetime to the database
        await req.db.query(
            'INSERT INTO bookmarks (user_id, origin, destination, departure_date, return_date, price) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, origin, destination, departureDate, returnDate || null, price]
        );

        res.redirect('/bookmarks');
    } catch (error) {
        console.error('Error saving bookmark:', error.message);
        res.status(500).send('Failed to bookmark flight.');
    }
});

app.post('/toggle-bookmark', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    const { origin, destination, departureDate, returnDate, price } = req.body;
    const userId = req.session.user.id;

    try {
        const [existing] = await req.db.query(
            'SELECT id FROM bookmarks WHERE user_id = ? AND origin = ? AND destination = ? AND departure_date = ? AND return_date = ?',
            [userId, origin, destination, departureDate, returnDate || null]
        );

        if (existing.length > 0) {
            await req.db.query('DELETE FROM bookmarks WHERE id = ?', [existing[0].id]);
            return res.json({ success: true, bookmarked: false });
        } else {
            await req.db.query(
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




app.post('/remove-bookmark', isAuthenticated, async (req, res) => {
    const { bookmarkId } = req.body;
    const userId = req.session.user.id;

    try {
        // Delete the bookmark from the database
        const [result] = await req.db.query(
            'DELETE FROM bookmarks WHERE id = ? AND user_id = ?',
            [bookmarkId, userId]
        );

        if (result.affectedRows === 0) {
            console.error('Bookmark not found or does not belong to the user.');
        }

        // Redirect back to the bookmarks page after deletion
        res.redirect('/bookmarks');
    } catch (error) {
        console.error('Error removing bookmark:', error.message);
        res.status(500).send('Failed to remove bookmark.');
    }
});








// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
