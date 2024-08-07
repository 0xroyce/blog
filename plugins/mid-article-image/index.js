const path = require('path');
const SiteSetting = require('../../models/siteSetting');

module.exports = {
    name: 'Mid-Article Image',
    version: '1.2.0',
    description: 'Adds a configurable image to the middle of each article',

    enable: async function(pluginLoader) {
        pluginLoader.registerHook('modify_article_content', this.name, this.addMidArticleImage);
        pluginLoader.addRoute('get', '/admin/plugins/mid-article-image', this.name, this.renderConfigPage);
        pluginLoader.addRoute('post', '/admin/plugins/mid-article-image', this.name, this.updateConfig);
    },

    disable: async function(pluginLoader) {
        pluginLoader.unregisterHook('modify_article_content', this.name);
        pluginLoader.removeRoute('get', '/admin/plugins/mid-article-image');
        pluginLoader.removeRoute('post', '/admin/plugins/mid-article-image');
    },

    addMidArticleImage: async function(article) {
        const imageUrl = await SiteSetting.get('mid_article_image_url') || 'https://picsum.photos/400/300';
        const paragraphs = article.content.split('</p>');
        const middleIndex = Math.floor(paragraphs.length / 2);

        const imageHtml = `<img src="${imageUrl}" alt="Mid-article image" style="display: block; margin: 20px auto;">`;

        paragraphs.splice(middleIndex, 0, `${imageHtml}</p>`);

        article.content = paragraphs.join('</p>');

        return article;
    },

    renderConfigPage: async function(req, res) {
        const currentImageUrl = await SiteSetting.get('mid_article_image_url') || '';
        const isEnabled = await SiteSetting.getPluginStatus('Mid-Article Image');
        res.render(path.resolve(__dirname, 'views', 'plugin-config'), {
            pluginName: 'Mid-Article Image',
            currentImageUrl: currentImageUrl,
            isEnabled: isEnabled,
            headerPath: path.join(__dirname, '../../../views/partials/admin/header'),
            footerPath: path.join(__dirname, '../../../views/partials/admin/footer')
        });
    },

    updateConfig: async function(req, res) {
        const { imageUrl, isEnabled } = req.body;
        await SiteSetting.set('mid_article_image_url', imageUrl);
        await SiteSetting.setPluginStatus('Mid-Article Image', isEnabled === 'on');

        // Dynamically enable or disable the plugin
        const pluginLoader = req.app.get('pluginLoader');
        if (isEnabled === 'on') {
            await pluginLoader.enablePlugin('Mid-Article Image');
        } else {
            await pluginLoader.disablePlugin('Mid-Article Image');
        }

        res.redirect('/admin/plugins');
    }
};