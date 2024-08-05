const SiteSetting = require('../models/siteSetting');
const path = require('path');
const fs = require('fs').promises;

exports.renderSettingsForm = async (req, res) => {
    const settings = await SiteSetting.getAll();
    res.render('admin/settings', { settings });
};

exports.updateSettings = async (req, res) => {
    const { blog_title, meta_description, show_login_button, custom_javascript } = req.body;

    await SiteSetting.set('blog_title', blog_title);
    await SiteSetting.set('meta_description', meta_description);
    await SiteSetting.set('show_login_button', show_login_button === 'true' ? 'true' : 'false');

    // Save custom JavaScript as-is, without sanitization
    await SiteSetting.set('custom_javascript', custom_javascript);

    if (req.file) {
        const oldFaviconPath = await SiteSetting.get('favicon_path');
        if (oldFaviconPath) {
            await fs.unlink(path.join(__dirname, '..', 'public', oldFaviconPath)).catch(() => {});
        }
        const faviconPath = `/uploads/${req.file.filename}`;
        await SiteSetting.set('favicon_path', faviconPath);
    }

    res.redirect('/admin/settings');
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