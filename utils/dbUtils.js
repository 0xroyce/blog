const db = require('../config/database');

async function executeQueryWithRetry(query, params, retries = 5) {
    let attempts = 0;
    while (attempts < retries) {
        try {
            const [rows] = await db.query(query, params);
            return rows;
        } catch (error) {
            attempts += 1;
            console.error(`Retrying query (attempt ${attempts})...`);
            if (['ECONNRESET', 'PROTOCOL_CONNECTION_LOST'].includes(error.code) && attempts < retries) {
                console.warn('Connection was reset, retrying...');
                await new Promise(res => setTimeout(res, 1000 * attempts)); // Exponential backoff
            } else {
                throw error;
            }
        }
    }
    throw new Error('Max retries reached');
}

module.exports = {
    executeQueryWithRetry
};