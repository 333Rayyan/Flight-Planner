const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");
const mysql = require("mysql2");

const app = express();
const PORT = 8000;
dotenv.config();

const pool = mysql.createPool({
	host: "localhost",
    user: "travelPlannerApp",
    password: "password",
    database: "travelPlanner",
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    pool.query("SELECT name, description FROM destinations", (error, results) => {
        if (error) {
			console.log(error);
            return res.status(500).send("Error retrieving destinations from database.");
        }
        res.render("home", { title: "Travel Planner", destinations: results });
    });
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.listen(PORT, () => {
    console.log(`Server Running at http://localhost:${PORT}`);
});