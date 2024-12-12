const express = require('express');
const db = require('../db');

const router = express.Router();

router.get("/", async (req, res) => {
    res.render("home", { title: "Flight Planner" });
});

router.get("/about", (req, res) => {
    res.render("about");
});

module.exports = router;