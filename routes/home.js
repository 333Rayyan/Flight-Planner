const express = require('express');
const db = require('../db'); // Import the db module

const router = express.Router();

// Home route
router.get("/", async (req, res) => {
    try {
        const results = await db.query("SELECT name, description FROM destinations");
        res.render("home", { title: "Flight Planner", destinations: results });
    } catch (error) {
        res.status(500).send("Error retrieving destinations from database.");
    }
});

// About route
router.get("/about", (req, res) => {
    res.render("about");
});

module.exports = router;