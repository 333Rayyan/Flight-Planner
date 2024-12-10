const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: "localhost",
    user: "flightPlannerApp",
    password: "password",
    database: "flightPlanner",
});

module.exports = pool;