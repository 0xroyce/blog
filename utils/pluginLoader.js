const fs = require('fs');
const path = require('path');
const SiteSetting = require('../models/siteSetting');

class PluginLoader {
    constructor(app) {
        this.app = app;
        this.plugins = new Map();
        this.hooks = {};
        this.routes = new Map();
    }

    async loadPlugins() {
        const pluginsDir = path.join(__dirname, '../plugins');
        const pluginNames = fs.readdirSync(pluginsDir);

        for (const pluginName of pluginNames) {
            const pluginPath = path.join(pluginsDir, pluginName);
            const plugin = require(pluginPath);
            this.plugins.set(plugin.name, plugin);

            const isEnabled = await SiteSetting.getPluginStatus(plugin.name);
            if (isEnabled) {
                await this.enablePlugin(plugin.name);
            }
        }
    }

    async enablePlugin(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (plugin && plugin.enable) {
            await plugin.enable(this);
        }
    }

    async disablePlugin(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (plugin && plugin.disable) {
            await plugin.disable(this);
        }
    }

    registerHook(hookName, pluginName, hookFn) {
        if (!this.hooks[hookName]) {
            this.hooks[hookName] = new Map();
        }
        this.hooks[hookName].set(pluginName, hookFn);
    }

    unregisterHook(hookName, pluginName) {
        if (this.hooks[hookName]) {
            this.hooks[hookName].delete(pluginName);
        }
    }

    async executeHook(hookName, data) {
        if (this.hooks[hookName]) {
            for (const hook of this.hooks[hookName].values()) {
                await hook(data);
            }
        }
    }

    addRoute(method, route, pluginName, handler) {
        const routeKey = `${method}:${route}`;
        this.routes.set(routeKey, { pluginName, handler });
        this.app[method](route, handler);
    }

    removeRoute(method, route) {
        const routeKey = `${method}:${route}`;
        const routeInfo = this.routes.get(routeKey);
        if (routeInfo) {
            // Remove route from Express app
            this.app._router.stack = this.app._router.stack.filter(layer => {
                if (layer.route && layer.route.path === route && layer.route.methods[method.toLowerCase()]) {
                    return false;
                }
                return true;
            });
            this.routes.delete(routeKey);
        }
    }
}

module.exports = PluginLoader;