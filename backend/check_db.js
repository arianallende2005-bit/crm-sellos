require('dotenv').config();
const pool = require('./config/database');

async function checkDb() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'orders';
        `);
        console.log("COLUMNS IN ORDERS TABLE:");
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error("DB ERROR:", e);
        process.exit(1);
    }
}

checkDb();
