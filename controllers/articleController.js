const Article = require('../models/article');
const Tag = require('../models/tag');
const Statistic = require('../models/statistic');
const Template = require('../models/template');
const SiteSetting = require('../models/siteSetting');
const { stripHtml, truncateText, createExcerpt } = require('../utils/textHelpers');
const pluginMiddleware = require('../middleware/pluginMiddleware');

async function getTemplateAndSettings() {
    const settings = await SiteSetting.getAll();
    const templateName = await Template.getTemplate(settings.selected_template || 'default');
    return { settings, templateName };
}

exports.getAllArticles = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const result = await Article.findAll(page, limit, false);
        const isViewCountEnabled = await Statistic.isViewCountEnabled();
        const isShowViewCountEnabled = await Statistic.isShowViewCountEnabled();
        const { settings, templateName } = await getTemplateAndSettings();

        res.render(`templates/${templateName}/home`, {
            ...result,
            isViewCountEnabled,
            isShowViewCountEnabled,
            settings,
            helpers: { stripHtml, truncateText, createExcerpt }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.getArticle = [
    async (req, res, next) => {
        try {
            const article = await Article.findBySlug(req.params.slug);
            if (article) {
                req.article = article;
                next();
            } else {
                res.status(404).send('Article not found');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error');
        }
    },
    pluginMiddleware.executeHooks('modify_article_content'),
    async (req, res) => {
        try {
            const article = req.article;
            if (!article) {
                return res.status(404).send('Article not found');
            }

            const isViewCountEnabled = await Statistic.isViewCountEnabled();
            const isShowViewCountEnabled = await Statistic.isShowViewCountEnabled();
            const { settings, templateName } = await getTemplateAndSettings();

            if (isViewCountEnabled && article.id) {
                await Statistic.incrementViewCount(article.id);
                article.view_count = await Statistic.getViewCount(article.id);
            }

            res.render(`templates/${templateName}/article`, {
                article,
                isViewCountEnabled,
                isShowViewCountEnabled,
                settings,
                canonicalUrl: `${req.protocol}://${req.get('host')}/article/${article.slug}`
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error');
        }
    }
];

exports.adminDashboard = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const result = await Article.findAll(page, limit, true);
        const isViewCountEnabled = await Statistic.isViewCountEnabled();
        const isShowViewCountEnabled = await Statistic.isShowViewCountEnabled();

        if (isViewCountEnabled) {
            for (let article of result.articles) {
                article.view_count = await Statistic.getViewCount(article.id);
            }
        }

        res.render('admin/dashboard', {
            ...result,
            isViewCountEnabled,
            isShowViewCountEnabled
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.renderCreateForm = async (req, res) => {
    const tags = await Tag.findAll();
    res.render('admin/create-article', { tags });
};

exports.renderEditForm = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (article) {
            res.render('admin/edit-article', { article });
        } else {
            res.status(404).send('Article not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.createArticle = async (req, res) => {
    try {
        const { title, content, metaDescription, tags, publishedAt } = req.body;
        const author = req.session.username;
        const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

        let mainImage = null;
        if (req.file) {
            mainImage = `/uploads/${req.file.filename}`;
        }

        const isDraft = req.body.saveAsDraft === 'on';
        const publishDate = isDraft ? null : (publishedAt || new Date().toISOString());

        await Article.create(title, content, author, metaDescription, tagArray, mainImage, publishDate, isDraft);
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.updateArticle = async (req, res) => {
    try {
        const { title, content, metaDescription, tags, publishedAt, existingImage } = req.body;
        const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

        let mainImage = existingImage;
        if (req.body.removeImage === 'true') {
            if (mainImage) {
                const imagePath = path.join(__dirname, '..', 'public', mainImage);
                await fs.unlink(imagePath).catch(err => console.error('Failed to delete image:', err));
            }
            mainImage = null;
        } else if (req.file) {
            mainImage = `/uploads/${req.file.filename}`;
            if (existingImage) {
                const oldImagePath = path.join(__dirname, '..', 'public', existingImage);
                await fs.unlink(oldImagePath).catch(err => console.error('Failed to delete old image:', err));
            }
        }

        const isDraft = req.body.saveAsDraft === 'on';
        const publishDate = isDraft ? null : (publishedAt || new Date().toISOString());

        await Article.update(req.params.id, title, content, metaDescription, tagArray, mainImage, publishDate, isDraft);
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.deleteArticle = async (req, res) => {
    try {
        await Article.delete(req.params.id);
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.getArticlesByTag = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const tagName = req.params.tagName.toLowerCase();
        const result = await Article.findAll(page, limit, false);
        const filteredArticles = result.articles.filter(article =>
            article.tags.some(tag => tag.name.toLowerCase() === tagName)
        );
        const isViewCountEnabled = await Statistic.isViewCountEnabled();
        const isShowViewCountEnabled = await Statistic.isShowViewCountEnabled();
        const { settings, templateName } = await getTemplateAndSettings();

        if (isViewCountEnabled) {
            for (let article of filteredArticles) {
                article.view_count = await Statistic.getViewCount(article.id);
            }
        }

        res.render(`templates/${templateName}/home`, {
            articles: filteredArticles,
            total: filteredArticles.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(filteredArticles.length / limit),
            isViewCountEnabled,
            isShowViewCountEnabled,
            settings,
            helpers: { stripHtml, truncateText, createExcerpt },
            tagName
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.toggleViewCount = async (req, res) => {
    try {
        const currentStatus = await Statistic.isViewCountEnabled();
        console.log(`Current view count status: ${currentStatus}`);
        await Statistic.setViewCountEnabled(!currentStatus);
        console.log(`New view count status: ${!currentStatus}`);
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.toggleShowViewCount = async (req, res) => {
    try {
        const currentStatus = await Statistic.isShowViewCountEnabled();
        console.log(`Current show view count status: ${currentStatus}`);
        await Statistic.setShowViewCountEnabled(!currentStatus);
        console.log(`New show view count status: ${!currentStatus}`);
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.searchArticles = async (req, res) => {
    try {
        const query = req.query.q || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // You can make this configurable
        const result = await Article.search(query, page, limit);
        const isViewCountEnabled = await Statistic.isViewCountEnabled();
        const isShowViewCountEnabled = await Statistic.isShowViewCountEnabled();

        res.render('search', {
            ...result,
            query,
            isViewCountEnabled,
            isShowViewCountEnabled,
            helpers: { stripHtml, truncateText, createExcerpt }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};