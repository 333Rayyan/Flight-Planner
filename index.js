const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");

const app = express();
const PORT = 8000;
dotenv.config();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use((req, res) => {
	res.status(404).send("<h1>404 Page Not Found</h1>");
});


app.get("/", (req, res) => {
	res.render("home");
});

app.get("/about", (req, res) => {
	res.render("about");
});


app.listen(PORT, () => {
	console.log(`Server Running at http://localhost:${PORT}`);
});