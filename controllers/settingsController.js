const SiteSetting = require('../models/siteSetting');
const Template = require('../models/template');
const path = require('path');
const fs = require('fs').promises;

exports.renderSettingsForm = async (req, res) => {
    try {
        const settings = await SiteSetting.getAll();
        let templates = ['default'];
        try {
            templates = await Template.getAll();
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
        res.render('admin/settings', { settings, templates });
    } catch (error) {
        console.error('Error rendering settings form:', error);
        res.status(500).send('Server error');
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { blog_title, meta_description, show_login_button, custom_javascript, selected_template } = req.body;

        await SiteSetting.set('blog_title', blog_title);
        await SiteSetting.set('meta_description', meta_description);
        await SiteSetting.set('show_login_button', show_login_button === 'true' ? 'true' : 'false');
        await SiteSetting.set('custom_javascript', custom_javascript);
        await SiteSetting.set('selected_template', selected_template);

        if (req.file) {
            const oldFaviconPath = await SiteSetting.get('favicon_path');
            if (oldFaviconPath) {
                await fs.unlink(path.join(__dirname, '..', 'public', oldFaviconPath)).catch(() => {});
            }
            const faviconPath = `/uploads/${req.file.filename}`;
            await SiteSetting.set('favicon_path', faviconPath);
        }

        res.redirect('/admin/settings');
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).send('Server error');
    }
};

exports.toggleViewCount = async (req, res) => {
    try {
        const currentStatus = await SiteSetting.isViewCountEnabled();
        await SiteSetting.setViewCountEnabled(!currentStatus);
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.toggleShowViewCount = async (req, res) => {
    try {
        const currentStatus = await SiteSetting.isShowViewCountEnabled();
        await SiteSetting.setShowViewCountEnabled(!currentStatus);
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};