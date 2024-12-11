const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: "localhost",
    user: "flightPlannerApp",
    password: "password",
    database: "flightPlanner",
});

async function callStoredProcedure(procedureName, params = []) {
    try {
        const placeholders = params.map(() => "?").join(", "); 
        const query = `CALL ${procedureName}(${placeholders});`;

        const [rows] = await pool.query(query, params);

        return rows[0] || [];
    } catch (error) {
        console.error(`Error calling stored procedure ${procedureName}:`, error.message);
        throw error;
    }
}

module.exports = {
    pool,
    callStoredProcedure, 
};
