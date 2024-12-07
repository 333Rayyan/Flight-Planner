const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const session = require("express-session");
const db = require('./db'); 



const app = express();
const PORT = 8000;

app.use(express.json());


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

// Convert the cities array to a dictionary
const citiesDict = cities.reduce((acc, city) => {
    acc[city.code] = city.name;
    return acc;
}, {});

// Make cities and citiesDict available in all views
app.locals.cities = cities;
app.locals.citiesDict = citiesDict;

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const flightRoutes = require('./routes/flights');
const bookmarkRoutes = require('./routes/bookmarks');
const homeRoutes = require('./routes/home');

// Use routes
app.use(authRoutes);
app.use(profileRoutes);
app.use(flightRoutes);
app.use(bookmarkRoutes);
app.use(homeRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});