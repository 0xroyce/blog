const SiteSetting = require('../../models/siteSetting');

module.exports = {
    name: 'Mid-Article Image',
    version: '1.2.0',
    description: 'Adds a configurable image to the middle of each article',

    init: async function(pluginLoader) {
        const isEnabled = await SiteSetting.getPluginStatus(this.name);
        if (isEnabled) {
            pluginLoader.registerHook('modify_article_content', this.addMidArticleImage);
            pluginLoader.addRoute('get', '/admin/plugins/mid-article-image', this.renderConfigPage);
            pluginLoader.addRoute('post', '/admin/plugins/mid-article-image', this.updateConfig);
        }
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
        res.render('admin/plugin-config', {
            pluginName: 'Mid-Article Image',
            currentImageUrl: currentImageUrl,
            isEnabled: isEnabled
        });
    },

    updateConfig: async function(req, res) {
        const { imageUrl, isEnabled } = req.body;
        await SiteSetting.set('mid_article_image_url', imageUrl);
        await SiteSetting.setPluginStatus('Mid-Article Image', isEnabled === 'on');
        res.redirect('/admin/plugins');
    }
};