const db = require('../config/database');

class Statistic {
    static async incrementViewCount(articleId) {
        try {
            await db.query('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [articleId]);
        } catch (error) {
            console.error('Error incrementing view count:', error);
            throw error;
        }
    }

    static async getViewCount(articleId) {
        try {
            const [rows] = await db.query('SELECT view_count FROM articles WHERE id = ?', [articleId]);
            return rows[0] ? rows[0].view_count : 0;
        } catch (error) {
            console.error('Error getting view count:', error);
            throw error;
        }
    }

    static async isViewCountEnabled() {
        try {
            const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = "enable_view_count"');
            return rows[0] && rows[0].setting_value === 'true';
        } catch (error) {
            console.error('Error checking if view count is enabled:', error);
            throw error;
        }
    }

    static async isShowViewCountEnabled() {
        try {
            const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = "show_view_count"');
            return rows[0] && rows[0].setting_value === 'true';
        } catch (error) {
            console.error('Error checking if show view count is enabled:', error);
            throw error;
        }
    }

    static async setViewCountEnabled(enabled) {
        try {
            await db.query('UPDATE settings SET setting_value = ? WHERE setting_key = "enable_view_count"', [enabled ? 'true' : 'false']);
        } catch (error) {
            console.error('Error setting view count enabled:', error);
            throw error;
        }
    }

    static async setShowViewCountEnabled(enabled) {
        try {
            await db.query('UPDATE settings SET setting_value = ? WHERE setting_key = "show_view_count"', [enabled ? 'true' : 'false']);
        } catch (error) {
            console.error('Error setting show view count enabled:', error);
            throw error;
        }
    }
}

module.exports = Statistic;