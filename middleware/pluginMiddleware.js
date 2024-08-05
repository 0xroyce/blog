const SiteSetting = require('../models/siteSetting');

module.exports = {
    executeHooks: (hookName) => {
        return async (req, res, next) => {
            if (req.pluginLoader && typeof req.pluginLoader.executeHook === 'function') {
                try {
                    const isEnabled = await SiteSetting.getPluginStatus('Mid-Article Image');
                    if (isEnabled) {
                        if (hookName === 'modify_article_content' && req.article) {
                            await req.pluginLoader.executeHook(hookName, req.article);
                        } else {
                            await req.pluginLoader.executeHook(hookName, req);
                        }
                    }
                } catch (error) {
                    console.error(`Error executing hook ${hookName}:`, error);
                }
            }
            next();
        };
    }
};