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
    { name: "London", code: "LON" },
    { name: "Paris", code: "PAR" },
    { name: "Dhaka", code: "DAC" },
    { name: "New York", code: "NYC" },
    { name: "Tokyo", code: "TYO" },
    { name: "Sydney", code: "SYD" },
    { name: "Los Angeles", code: "LAX" },
    { name: "Chicago", code: "ORD" },
    { name: "Toronto", code: "YYZ" },
    { name: "Mumbai", code: "BOM" },
    { name: "Delhi", code: "DEL" },
    { name: "Singapore", code: "SIN" },
    { name: "Dubai", code: "DXB" },
    { name: "Hong Kong", code: "HKG" },
    { name: "Bangkok", code: "BKK" },
    { name: "Kuala Lumpur", code: "KUL" },
    { name: "Seoul", code: "ICN" },
    { name: "Istanbul", code: "IST" },
    { name: "Cape Town", code: "CPT" },
    { name: "Johannesburg", code: "JNB" },
    { name: "Melbourne", code: "MEL" },
    { name: "Rome", code: "FCO" },
    { name: "Berlin", code: "BER" },
    { name: "Madrid", code: "MAD" },
    { name: "Barcelona", code: "BCN" },
    { name: "Amsterdam", code: "AMS" },
    { name: "Frankfurt", code: "FRA" },
    { name: "Zurich", code: "ZRH" },
    { name: "Vienna", code: "VIE" },
    { name: "Lisbon", code: "LIS" },
    { name: "Athens", code: "ATH" },
    { name: "Cairo", code: "CAI" },
    { name: "Moscow", code: "DME" },
    { name: "Warsaw", code: "WAW" },
    { name: "Prague", code: "PRG" },
    { name: "Budapest", code: "BUD" },
    { name: "Helsinki", code: "HEL" },
    { name: "Stockholm", code: "ARN" },
    { name: "Oslo", code: "OSL" },
    { name: "Copenhagen", code: "CPH" },
    { name: "Brussels", code: "BRU" },
    { name: "Mexico City", code: "MEX" },
    { name: "Sao Paulo", code: "GRU" },
    { name: "Buenos Aires", code: "EZE" },
    { name: "Lima", code: "LIM" },
    { name: "Bogota", code: "BOG" },
    { name: "Rio de Janeiro", code: "GIG" },
    { name: "Santiago", code: "SCL" },
    { name: "Beijing", code: "PEK" },
    { name: "Shanghai", code: "PVG" },
    { name: "Guangzhou", code: "CAN" }
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

// Function to fetch flight destinations
async function getFlightDestinations(origin, maxPrice = 200) {
    try {
        const accessToken = await getAccessToken();
        const response = await axios.get('https://test.api.amadeus.com/v1/shopping/flight-destinations', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                origin: origin,
                maxPrice: maxPrice,
            },
        });
        return response.data.data; // Return the flight destinations
    } catch (error) {
        console.error('Error fetching flight destinations:', error.response?.data || error.message);
        throw new Error('Failed to fetch flight destinations');
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
    const { origin, destination, maxPrice } = req.query;

    if (!origin) {
        return res.status(400).send('Starting location (origin) is required.');
    }

    try {
        // Fetch flight destinations from the Amadeus API
        const destinations = await getFlightDestinations(origin, maxPrice || 200);

        // Filter destinations if a specific destination was provided
        const filteredDestinations = destination
            ? destinations.filter(dest => dest.destination === destination)
            : destinations;

        // Render the flight-destinations page with results
        res.render('flight-destinations', {
            destinations: filteredDestinations,
            startingLocation: cities.find(city => city.code === origin)?.name || 'Unknown',
            destinationLocation: destination ? cities.find(city => city.code === destination)?.name : 'Various',
        });
    } catch (error) {
        console.error('Error fetching flight destinations:', error.message);
        res.status(500).send(`Error: ${error.message}`);
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
