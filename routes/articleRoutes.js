const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const authController = require('../controllers/authController');
const sitemapController = require('../controllers/sitemapController');
const upload = require('../middleware/upload');
const settingsController = require('../controllers/settingsController');
const menuController = require('../controllers/menuController');
const pluginController = require('../controllers/pluginController');

// Public routes
router.get('/', articleController.getAllArticles);
router.get('/article/:slug', articleController.getArticle);
router.get('/tag/:tagName([a-z0-9-]+)', articleController.getArticlesByTag);
router.get('/search', articleController.searchArticles);
router.get('/sitemap.xml', sitemapController.generateSitemap);

// Admin routes
router.get('/admin/dashboard', authController.isAuthenticated, articleController.adminDashboard);
router.get('/admin/create', authController.isAuthenticated, articleController.renderCreateForm);
router.post('/admin/create', authController.isAuthenticated, upload.single('mainImage'), articleController.createArticle);
router.get('/admin/edit/:id', authController.isAuthenticated, articleController.renderEditForm);
router.post('/admin/edit/:id', authController.isAuthenticated, upload.single('mainImage'), articleController.updateArticle);
router.post('/admin/delete/:id', authController.isAuthenticated, articleController.deleteArticle);
router.post('/admin/toggle-view-count', authController.isAuthenticated, articleController.toggleViewCount);
router.post('/admin/toggle-show-view-count', authController.isAuthenticated, articleController.toggleShowViewCount);

// Settings routes
router.get('/admin/settings', authController.isAuthenticated, settingsController.renderSettingsForm);
router.post('/admin/settings', authController.isAuthenticated, upload.single('favicon'), settingsController.updateSettings);

// Menu routes
router.get('/admin/menu', authController.isAuthenticated, menuController.renderMenuManager);
router.post('/admin/menu/create', authController.isAuthenticated, menuController.createMenuItem);
router.post('/admin/menu/update', authController.isAuthenticated, menuController.updateMenuItem);
router.post('/admin/menu/delete/:id', authController.isAuthenticated, menuController.deleteMenuItem);

// Plugin routes
router.get('/admin/plugins', authController.isAuthenticated, pluginController.listPlugins);
router.get('/admin/plugins/:pluginName', authController.isAuthenticated, pluginController.renderPluginConfig);
router.post('/admin/plugins/:pluginName', authController.isAuthenticated, pluginController.updatePluginConfig);

module.exports = router;