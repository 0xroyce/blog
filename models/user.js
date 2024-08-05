const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    static async findByUsername(username) {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    }

    static async create(username, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        return result.insertId;
    }

    static async verifyPassword(user, password) {
        return await bcrypt.compare(password, user.password);
    }
}

module.exports = User;