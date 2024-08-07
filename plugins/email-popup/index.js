const path = require('path');
const fs = require('fs').promises;
const SiteSetting = require('../../models/siteSetting');

const EMAIL_FILE_PATH = path.join(__dirname, 'emails.json');

module.exports = {
    name: 'Email Popup',
    version: '1.0.0',
    description: 'Displays a popup to collect email addresses',
    enabled: true,

    enable: async function(pluginLoader) {
        console.log('Enabling Email Popup plugin');
        pluginLoader.registerHook('after_routes', this.name, this.addPopupScript.bind(this));
        pluginLoader.addRoute('get', '/admin/plugins/email-popup', this.name, this.renderConfigPage.bind(this));
        pluginLoader.addRoute('post', '/admin/plugins/email-popup', this.name, this.updateConfig.bind(this));
        pluginLoader.addRoute('post', '/email-popup/submit', this.name, this.handleEmailSubmit.bind(this));

        // Explicitly add script to app.locals.plugins
        if (!pluginLoader.app.locals.plugins) {
            pluginLoader.app.locals.plugins = [];
        }
        if (!pluginLoader.app.locals.plugins.includes('/plugins/email-popup/email-popup.js')) {
            pluginLoader.app.locals.plugins.push('/plugins/email-popup/email-popup.js');
            console.log('Added email-popup.js to app.locals.plugins');
        }

        // Ensure the email file exists
        await this.ensureEmailFile();
    },

    disable: async function(pluginLoader) {
        console.log('Disabling Email Popup plugin');
        pluginLoader.unregisterHook('after_routes', this.name);
        pluginLoader.removeRoute('get', '/admin/plugins/email-popup');
        pluginLoader.removeRoute('post', '/admin/plugins/email-popup');
        pluginLoader.removeRoute('post', '/email-popup/submit');

        // Remove script from app.locals.plugins
        if (pluginLoader.app.locals.plugins) {
            pluginLoader.app.locals.plugins = pluginLoader.app.locals.plugins.filter(
                plugin => plugin !== '/plugins/email-popup/email-popup.js'
            );
            console.log('Removed email-popup.js from app.locals.plugins');
        }
    },

    addPopupScript: function(app) {
        console.log('Email popup addPopupScript running');
        // No need to call next() here as it's not provided by the hook system
    },

    renderConfigPage: async function(req, res) {
        const isEnabled = await SiteSetting.getPluginStatus('Email Popup');
        res.render(path.resolve(__dirname, 'views', 'plugin-config'), {
            pluginName: 'Email Popup',
            isEnabled: isEnabled,
            headerPath: path.join(__dirname, '../../views/partials/admin/header'),
            footerPath: path.join(__dirname, '../../views/partials/admin/footer')
        });
    },

    updateConfig: async function(req, res) {
        const { isEnabled } = req.body;
        await SiteSetting.setPluginStatus('Email Popup', isEnabled === 'on');

        const pluginLoader = req.app.get('pluginLoader');
        if (isEnabled === 'on') {
            await pluginLoader.enablePlugin('Email Popup');
        } else {
            await pluginLoader.disablePlugin('Email Popup');
        }

        res.redirect('/admin/plugins');
    },

    handleEmailSubmit: async function(req, res) {
        const { email } = req.body;
        try {
            await this.storeEmail(email);
            console.log('Email stored:', email);
            res.send('Email submitted and stored successfully');
        } catch (error) {
            console.error('Error storing email:', error);
            res.status(500).send('Error storing email');
        }
    },

    async ensureEmailFile() {
        try {
            await fs.access(EMAIL_FILE_PATH);
        } catch (error) {
            // File doesn't exist, create it with an empty array
            await fs.writeFile(EMAIL_FILE_PATH, '[]');
        }
    },

    async storeEmail(email) {
        const emails = await this.getEmails();
        if (!emails.includes(email)) {
            emails.push(email);
            await fs.writeFile(EMAIL_FILE_PATH, JSON.stringify(emails, null, 2));
        }
    },

    async getEmails() {
        const data = await fs.readFile(EMAIL_FILE_PATH, 'utf8');
        return JSON.parse(data);
    }
};