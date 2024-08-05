const bcrypt = require('bcrypt');
const db = require('../config/database');

async function updateAdminPassword() {
    const username = 'admin';
    const newPassword = 'admin'; // Choose a secure password
    const saltRounds = 10;

    try {
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await db.query(
            'UPDATE users SET password = ? WHERE username = ?',
            [hashedPassword, username]
        );

        console.log('Admin password updated successfully');
    } catch (error) {
        console.error('Error updating admin password:', error);
    } finally {
        process.exit();
    }
}

updateAdminPassword();