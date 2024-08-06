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

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Custom render function to handle template-based views
app.use((req, res, next) => {
    const _render = res.render;
    res.render = function (view, options, callback) {
        const template = res.locals.selectedTemplate || 'default';
        if (view.startsWith('admin/') || view.startsWith('partials/') || view.startsWith('templates/')) {
            _render.call(this, view, options, callback);
        } else {
            _render.call(this, `templates/${template}/${view}`, options, callback);
        }
    };
    next();
});

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

// Initialize plugin loader
const pluginLoader = new PluginLoader(app);

// Make pluginLoader available to the entire application
app.set('pluginLoader', pluginLoader);

// Load plugins
(async () => {
    try {
        await pluginLoader.loadPlugins();
        console.log('Plugins loaded successfully');
    } catch (err) {
        console.error('Error loading plugins:', err);
    }
})();

// Add user to res.locals for use in views
app.use((req, res, next) => {
    res.locals.user = req.session.username;
    res.locals.tinyMceApiKey = process.env.TINYMCE_API_KEY;
    next();
});

// Add site settings, menu items, selected template, and templateCSS to res.locals
app.use(async (req, res, next) => {
    const settings = await SiteSetting.getAll();
    res.locals.settings = settings;
    res.locals.menuItems = await MenuItem.getAll();
    res.locals.selectedTemplate = await Template.getTemplate(settings.selected_template || 'default');
    res.locals.templateName = res.locals.selectedTemplate;
    next();
});

// Serve static files from the main public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the selected template, if any
app.use(async (req, res, next) => {
    const templateName = res.locals.selectedTemplate;
    const templateStaticPath = path.join(__dirname, 'views', 'templates', templateName, 'public');
    try {
        await fs.access(templateStaticPath);
        express.static(templateStaticPath)(req, res, next);
    } catch (error) {
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
app.use('/', articleRoutes);
app.use('/auth', authRoutes);

// Execute 'after_routes' hook for plugins
(async () => {
    await pluginLoader.executeHook('after_routes', app);
})();

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! Please try again.');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});