const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const mysql = require("mysql2");
const session = require("express-session");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 8000;

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
		const { username, password } = req.body;

		// Validate input
		if (!username || !password || username.length < 3 || password.length < 6) {
			return res.status(400).send('Username must be at least 3 characters and password at least 6 characters.');
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Insert user into the database
		const [result] = await req.db.query(
			'INSERT INTO users (username, password) VALUES (?, ?)',
			[username, hashedPassword]
		);

		if (result.affectedRows) {
			res.redirect('/login'); // Redirect to login page
		} else {
			res.status(500).send('Error registering user.');
		}
	} catch (err) {
		console.error(err); // Log the error
		if (err.code === 'ER_DUP_ENTRY') {
			res.status(400).send('Username already exists.');
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

		// Validate input
		if (!username || !password) {
			return res.status(400).send('Username and password are required.');
		}

		// Fetch user from the database
		const [rows] = await req.db.query('SELECT * FROM users WHERE username = ?', [username]);
		if (rows.length === 0) {
			return res.status(400).send('Invalid username or password.');
		}

		const user = rows[0];

		// Compare the provided password with the hashed password
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).send('Invalid username or password.');
		}

		// Set user session
		req.session.user = { id: user.id, username: user.username };

		// Redirect to previous page or homepage
		res.redirect(req.session.returnTo || '/');
		delete req.session.returnTo;
	} catch (err) {
		console.error(err); // Log the error
		res.status(500).send('Internal server error.');
	}
});

// Logout route
app.get('/logout', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error(err); // Log the error
			return res.status(500).send('Unable to log out.');
		}
		res.redirect('/login'); // Redirect to login page after logout
	});
});



// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
