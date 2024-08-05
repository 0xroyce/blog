const db = require('../config/database');
const { executeQueryWithRetry } = require('../utils/dbUtils');

class SiteSetting {
    static async get(key) {
        const rows = await executeQueryWithRetry('SELECT setting_value FROM site_settings WHERE setting_key = ?', [key]);
        return rows[0] ? rows[0].setting_value : null;
    }

    static async set(key, value) {
        await executeQueryWithRetry(
            'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            [key, value, value]
        );
    }

    static async getAll() {
        const rows = await executeQueryWithRetry('SELECT * FROM site_settings');
        return rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});
    }

    static async getPluginStatus(pluginName) {
        const rows = await executeQueryWithRetry('SELECT setting_value FROM site_settings WHERE setting_key = ?', ['plugin_status']);
        if (rows.length > 0 && rows[0].setting_value) {
            const statuses = JSON.parse(rows[0].setting_value);
            return statuses[pluginName] || false;
        }
        return false;
    }

    static async setPluginStatus(pluginName, status) {
        const rows = await executeQueryWithRetry('SELECT setting_value FROM site_settings WHERE setting_key = ?', ['plugin_status']);
        let statuses = {};
        if (rows.length > 0 && rows[0].setting_value) {
            statuses = JSON.parse(rows[0].setting_value);
        }
        statuses[pluginName] = status;
        await this.set('plugin_status', JSON.stringify(statuses));
    }
}

module.exports = SiteSetting;