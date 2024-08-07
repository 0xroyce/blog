require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const fs = require('fs').promises;
const articleRoutes = require('./routes/articleRoutes');
const authRoutes = require('./routes/authRoutes');
const SiteSetting = require('./models/siteSetting');
const MenuItem = require('./models/menuItem');
const Template = require('./models/template');
const PluginLoader = require('./utils/pluginLoader');

const app = express();

console.log('Initializing application...');

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
console.log('View engine set up');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(flash());
console.log('Basic middleware set up');

// Serve static files from the main public directory
app.use(express.static(path.join(__dirname, 'public')));
console.log('Static file serving set up for main public directory');

// Initialize plugin loader
console.log('Initializing PluginLoader');
const pluginLoader = new PluginLoader(app);

// Make pluginLoader available to the entire application
app.set('pluginLoader', pluginLoader);

// Load plugins
(async () => {
    try {
        console.log('Loading plugins...');
        await pluginLoader.loadPlugins();
        console.log('Plugins loaded successfully');
    } catch (err) {
        console.error('Error loading plugins:', err);
    }
})();

// Middleware to define plugins variable
app.use((req, res, next) => {
    res.locals.plugins = app.locals.plugins || [];
    console.log('res.locals.plugins initialized:', res.locals.plugins);
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`Requested URL: ${req.url}`);
    next();
});

// Add user and plugins to res.locals for use in views
app.use((req, res, next) => {
    res.locals.user = req.session.username;
    res.locals.tinyMceApiKey = process.env.TINYMCE_API_KEY;
    console.log('Transferred plugins to res.locals:', res.locals.plugins);
    next();
});

// Add site settings, menu items, selected template, and templateCSS to res.locals
app.use(async (req, res, next) => {
    const settings = await SiteSetting.getAll();
    res.locals.settings = settings;
    res.locals.menuItems = await MenuItem.getAll();
    res.locals.selectedTemplate = await Template.getTemplate(settings.selected_template || 'default');
    res.locals.templateName = res.locals.selectedTemplate;
    console.log('Added site settings and template info to res.locals');
    next();
});

// Serve static files from the selected template, if any
app.use(async (req, res, next) => {
    const templateName = res.locals.selectedTemplate;
    const templateStaticPath = path.join(__dirname, 'views', 'templates', templateName, 'public');
    try {
        await fs.access(templateStaticPath);
        console.log(`Serving static files for template: ${templateName}`);
        express.static(templateStaticPath)(req, res, next);
    } catch (error) {
        console.log(`No static files found for template: ${templateName}`);
        next();
    }
});

// Make pluginLoader available to routes
app.use((req, res, next) => {
    req.pluginLoader = pluginLoader;
    next();
});

// Test database connection
const db = require('./config/database');
db.query('SELECT 1')
    .then(() => console.log('Database connected successfully'))
    .catch(err => console.error('Database connection failed:', err));

// Routes
console.log('Setting up routes');
app.use('/', articleRoutes);
app.use('/auth', authRoutes);

// Plugin config routes
app.get('/admin/plugins/:pluginName', require('./controllers/pluginController').renderPluginConfig);
app.post('/admin/plugins/:pluginName', require('./controllers/pluginController').updatePluginConfig);

// Execute 'after_routes' hook for plugins
app.use(async (req, res, next) => {
    try {
        console.log('Executing after_routes hooks');
        await pluginLoader.executeHook('after_routes', app, req, res);
        console.log('after_routes hooks executed');
        next();
    } catch (error) {
        console.error('Error executing after_routes hooks:', error);
        next(error);
    }
});

// Add logging middleware to check plugins before render
app.use((req, res, next) => {
    console.log('Final plugins before render:', res.locals.plugins);
    next();
});

// New logging middleware to log res.locals just before rendering
app.use((req, res, next) => {
    const oldRender = res.render;
    res.render = function() {
        console.log('res.locals just before rendering:', JSON.stringify(res.locals, null, 2));
        oldRender.apply(res, arguments);
    }
    next();
});

// Check Email Popup plugin status
SiteSetting.getPluginStatus('Email Popup').then(status => {
    console.log('Email Popup plugin status:', status);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    res.status(500).send('Something broke! Please try again.');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});