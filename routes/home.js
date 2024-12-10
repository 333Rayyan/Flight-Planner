const express = require('express');
const db = require('../db'); // Import the db module

const router = express.Router();

// Home route
router.get("/", async (req, res) => {
    res.render("home", { title: "Flight Planner" });
});

// About route
router.get("/about", (req, res) => {
    res.render("about");
});

module.exports = router;