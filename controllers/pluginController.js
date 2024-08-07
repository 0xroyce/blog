const path = require('path');
const fs = require('fs').promises;
const SiteSetting = require('../models/siteSetting');

exports.listPlugins = async (req, res) => {
    const pluginsDir = path.join(__dirname, '..', 'plugins');
    try {
        const plugins = await fs.readdir(pluginsDir);

        const pluginList = await Promise.all(plugins.map(async (plugin) => {
            const pluginPath = path.join(pluginsDir, plugin, 'index.js');
            try {
                await fs.access(pluginPath);
                const pluginModule = require(pluginPath);
                const isEnabled = await SiteSetting.getPluginStatus(pluginModule.name);
                return {
                    name: pluginModule.name || plugin,
                    version: pluginModule.version || 'Unknown',
                    description: pluginModule.description || 'No description provided',
                    isEnabled: isEnabled
                };
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.error(`Error loading plugin ${plugin}:`, error);
                }
                return null;
            }
        }));

        res.render('admin/plugins', { plugins: pluginList.filter(Boolean) });
    } catch (error) {
        console.error('Error listing plugins:', error);
        res.status(500).send('Error loading plugins');
    }
};

exports.renderPluginConfig = async (req, res) => {
    const pluginName = req.params.pluginName;
    const pluginPath = path.join(__dirname, '..', 'plugins', pluginName, 'views', 'plugin-config.ejs');

    try {
        const isEnabled = await SiteSetting.getPluginStatus(pluginName);

        let additionalData = {};
        if (pluginName === 'mid-article-image') {
            const currentImageUrl = await SiteSetting.get('mid_article_image_url') || '';
            additionalData = { currentImageUrl };
        }

        res.render(pluginPath, {
            pluginName: pluginName,
            isEnabled: isEnabled,
            headerPath: path.join(__dirname, '../views/partials/admin/header'),
            footerPath: path.join(__dirname, '../views/partials/admin/footer'),
            ...additionalData
        });
    } catch (error) {
        console.error(`Error rendering plugin config for ${pluginName}:`, error);
        res.status(500).send('Error loading plugin configuration');
    }
};

exports.updatePluginConfig = async (req, res) => {
    const pluginName = req.params.pluginName;
    const pluginPath = path.join(__dirname, '..', 'plugins', pluginName, 'index.js');

    try {
        const pluginModule = require(pluginPath);
        if (typeof pluginModule.updateConfig === 'function') {
            await pluginModule.updateConfig(req, res);
        } else {
            res.status(404).send('Plugin update configuration not found');
        }
    } catch (error) {
        console.error(`Error updating plugin config for ${pluginName}:`, error);
        res.status(500).send('Error updating plugin configuration');
    }
};