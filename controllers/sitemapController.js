const Article = require('../models/article');

exports.generateSitemap = async (req, res) => {
    try {
        const articles = await Article.findAll(false); // false to exclude drafts
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Add home page
        xml += `  <url>\n    <loc>${baseUrl}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

        // Add article pages
        articles.forEach(article => {
            xml += `  <url>\n    <loc>${baseUrl}/article/${article.slug}</loc>\n`;
            xml += `    <lastmod>${new Date(article.updated_at || article.created_at).toISOString()}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        });

        xml += '</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};