// plugins/example-plugin/index.js

module.exports = {
    name: 'Example Plugin',
    version: '1.0.0',
    description: 'An example plugin to demonstrate the plugin system',

    init: function(pluginLoader) {
        // Register hooks
        pluginLoader.registerHook('pre_article_render', this.preArticleRender);
        pluginLoader.registerHook('post_article_render', this.postArticleRender);

        // Add routes
        pluginLoader.addRoute('get', '/example-plugin', this.exampleRoute);

        // Initialize any plugin-specific things
        console.log('Example plugin initialized');
    },

    preArticleRender: async function(article) {
        // Modify the article before it's rendered
        article.content = `<div class="plugin-notice">Modified by example plugin</div>${article.content}`;
        return article;
    },

    postArticleRender: async function(renderedContent) {
        // Modify the rendered content
        return renderedContent + '<div class="plugin-notice">Added by example plugin</div>';
    },

    exampleRoute: function(req, res) {
        res.send('This is an example route added by the plugin');
    }
};