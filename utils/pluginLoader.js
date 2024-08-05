const fs = require('fs');
const path = require('path');
const SiteSetting = require('../models/siteSetting'); // Ensure this import is correct

class PluginLoader {
    constructor(app) {
        this.app = app;
        this.plugins = [];
        this.hooks = {};  // Initialize hooks storage
    }

    async loadPlugins() {
        const pluginsDir = path.join(__dirname, '../plugins');
        const pluginNames = fs.readdirSync(pluginsDir);

        for (const pluginName of pluginNames) {
            const pluginPath = path.join(pluginsDir, pluginName);
            const plugin = require(pluginPath);
            const isEnabled = await SiteSetting.getPluginStatus(plugin.name); // Check plugin status

            if (isEnabled) {
                this.plugins.push(plugin);

                // Initialize plugin if it has an init function
                if (plugin.init) {
                    await plugin.init(this); // Ensure await for async init
                }
            }
        }
    }

    registerHook(hookName, hookFn) {
        if (!this.hooks[hookName]) {
            this.hooks[hookName] = [];
        }
        this.hooks[hookName].push(hookFn);
    }

    async executeHook(hookName, data) {
        if (this.hooks[hookName]) {
            for (const hook of this.hooks[hookName]) {
                await hook(data);
            }
        }
    }

    addRoute(method, route, handler) {
        this.app[method](route, handler);
    }
}

module.exports = PluginLoader;