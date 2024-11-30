const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const mysql = require("mysql2");
const session = require("express-session");
const bcrypt = require('bcrypt');
const axios = require('axios');

const app = express();
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
    user: "travelPlannerApp",
    password: "password",
    database: "travelPlanner",
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
            console.log(error);
            return res.status(500).send("Error retrieving destinations from database.");
        }
        res.render("home", { title: "Travel Planner", destinations: results });
    });
});

// About route
app.get("/about", (req, res) => {
    res.render("about");
});

// Register route
app.get('/register', (req, res) => {
    res.render("register");
});

app.post('/register', async (req, res) => {
    try {
        const { email, username, password, confirmPassword } = req.body;

        if (!email || !username || !password || !confirmPassword) {
            return res.status(400).send('All fields are required.');
        }

        if (password !== confirmPassword) {
            return res.status(400).send('Passwords do not match.');
        }

        if (username.length < 3 || password.length < 6) {
            return res.status(400).send('Username must be at least 3 characters and password at least 6 characters.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await req.db.query(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [username, hashedPassword, email]
        );

        if (result.affectedRows) {
            res.redirect('/login'); // Redirect to login page
        } else {
            res.status(500).send('Error registering user.');
        }
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).send('Username or email already exists.');
        } else {
            res.status(500).send('Internal server error.');
        }
    }
});

// Login route
app.get('/login', (req, res) => {
    res.render("login");
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).send('Username and password are required.');
        }

        const [rows] = await req.db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(400).send('Invalid username or password.');
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).send('Invalid username or password.');
        }

        req.session.user = { id: user.id, username: user.username };
        res.redirect(req.session.returnTo || '/');
        delete req.session.returnTo;
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error.');
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

    // Set defaults explicitly if parameters are missing or empty
    returnDate = returnDate || null; // Default to null if not provided
    children = children ? parseInt(children) : 0; // Default to 0 if not provided
    maxPrice = maxPrice ? parseInt(maxPrice) : 0; // Default to 0 if not provided


    // Validate required parameters
    if (!originLocationCode || !destinationLocationCode || !departureDate) {
        return res.status(400).send('Missing required parameters: originLocationCode, destinationLocationCode, or departureDate');
    }

    try {
        // Get access token
        const accessToken = await getAccessToken();

        // Make API request to fetch flight offers
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
                currencyCode: "GBP", // Default currency
                maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
                max: 50
            },
        });
        const offers = response.data.data || [];
        const dictionaries = response.data.dictionaries || {};

        res.render('flight-destinations', {
            startingLocation: originLocationCode,
            destinationLocation: destinationLocationCode || 'Various',
            offers,
            carriers: dictionaries.carriers || {},
            aircraft: dictionaries.aircraft || {},
            user: req.session.user || null,
        });
    } catch (error) {
        console.error('Error fetching flight offers:', error.response.status, error.response?.data || error.message);
        res.status(500).send('Failed to fetch flight offers');
    }
});




// Search page route
app.get('/search', (req, res) => {
    res.render('search', { cities });
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
    const userId = req.session.user.id; // Get the logged-in user's ID

    try {
        const [bookmarks] = await req.db.query(
            'SELECT origin, destination, departure_date, return_date, price FROM bookmarks WHERE user_id = ?',
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
    const userId = req.session.user.id; // Get the logged-in user's ID

    try {
        await req.db.query(
            'INSERT INTO bookmarks (user_id, origin, destination, departure_date, return_date, price) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, origin, destination, departureDate, returnDate || null, price]
        );
        // Redirect to the bookmarks page after successfully saving
        res.redirect('/bookmarks');
    } catch (error) {
        console.error('Error saving bookmark:', error.message);
        res.status(500).send('Failed to bookmark flight.');
    }
});

app.post('/remove-bookmark', isAuthenticated, async (req, res) => {
    const { bookmarkId } = req.body;
    const userId = req.session.user.id;

    try {
        await req.db.query('DELETE FROM bookmarks WHERE id = ? AND user_id = ?', [bookmarkId, userId]);
        res.redirect('/bookmarks'); // Always redirect back to the bookmarks page
    } catch (error) {
        console.error('Error removing bookmark:', error.message);
        res.status(500).send('Failed to remove bookmark.');
    }
});






// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
