const express = require('express');
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
        console.log('Plugins directory:', pluginsDir);
        const pluginNames = fs.readdirSync(pluginsDir);

        for (const pluginName of pluginNames) {
            const pluginPath = path.join(pluginsDir, pluginName);
            console.log(`Loading plugin from: ${pluginPath}`);
            const plugin = require(pluginPath);
            this.plugins.set(plugin.name, plugin);

            const isEnabled = await SiteSetting.getPluginStatus(plugin.name);
            console.log(`Loading plugin: ${plugin.name}, enabled: ${isEnabled}`);
            if (isEnabled) {
                await this.enablePlugin(plugin.name);
            }

            // Serve static files from plugin's public directory
            this.serveStaticFiles(pluginName, pluginPath);
        }
    }

    serveStaticFiles(pluginName, pluginPath) {
        const publicDir = path.join(pluginPath, 'public');
        console.log(`Checking for public directory: ${publicDir}`);
        if (fs.existsSync(publicDir)) {
            console.log(`Serving static files for plugin: ${pluginName} from ${publicDir}`);
            this.app.use(`/plugins/${pluginName}`, express.static(publicDir));
        } else {
            console.log(`No public directory found for plugin: ${pluginName}`);
        }
    }

    async enablePlugin(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (plugin && plugin.enable) {
            console.log(`Enabling plugin: ${plugin.name}`);
            await plugin.enable(this);
        }
    }

    async disablePlugin(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (plugin && plugin.disable) {
            console.log(`Disabling plugin: ${plugin.name}`);
            await plugin.disable(this);
        }
    }

    registerHook(hookName, pluginName, hookFn) {
        if (!this.hooks[hookName]) {
            this.hooks[hookName] = new Map();
        }
        console.log(`Registering hook: ${hookName} for plugin: ${pluginName}`);
        this.hooks[hookName].set(pluginName, hookFn);
    }

    unregisterHook(hookName, pluginName) {
        if (this.hooks[hookName]) {
            console.log(`Unregistering hook: ${hookName} for plugin: ${pluginName}`);
            this.hooks[hookName].delete(pluginName);
        }
    }

    async executeHook(hookName, ...args) {
        if (this.hooks[hookName]) {
            for (const [pluginName, hookFn] of this.hooks[hookName].entries()) {
                console.log(`Executing hook: ${hookName} for plugin: ${pluginName}`);
                await hookFn(...args);
            }
        }
    }

    addRoute(method, route, pluginName, handler) {
        const routeKey = `${method}:${route}`;
        this.routes.set(routeKey, { pluginName, handler });
        console.log(`Adding route: ${method.toUpperCase()} ${route} for plugin: ${pluginName}`);
        this.app[method](route, handler);
    }

    removeRoute(method, route) {
        const routeKey = `${method}:${route}`;
        const routeData = this.routes.get(routeKey);
        if (routeData) {
            const { pluginName, handler } = routeData;
            console.log(`Removing route: ${method.toUpperCase()} ${route} for plugin: ${pluginName}`);
            this.app._router.stack = this.app._router.stack.filter(layer => {
                return !(layer.route && layer.route.path === route && layer.route.methods[method] && layer.route.stack[0].handle === handler);
            });
            this.routes.delete(routeKey);
        }
    }
}

module.exports = PluginLoader;