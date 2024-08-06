const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 60000 // 60 seconds
});

// Handle database connection errors and retry logic
pool.on('connection', (connection) => {
    console.log('New database connection established');

    connection.on('error', (err) => {
        console.error('Database connection error:', err.code);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        } else if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
        }
    });

    connection.on('close', (err) => {
        console.error('Database connection closed:', err);
    });
});

const promisePool = pool.promise();

// Periodic ping to keep the connection alive
setInterval(async () => {
    try {
        await promisePool.query('SELECT 1');
        console.log('Database connection alive');
    } catch (err) {
        console.error('Error pinging database:', err);
    }
}, 60000); // Ping every 60 seconds

module.exports = promisePool;