require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const articleRoutes = require('./routes/articleRoutes');
const authRoutes = require('./routes/authRoutes');
const SiteSetting = require('./models/siteSetting');
const MenuItem = require('./models/menuItem');
const PluginLoader = require('./utils/pluginLoader');

const app = express();

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your-secret-key', // Change this to a secure random string
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
    res.locals.tinyMceApiKey = process.env.TINYMCE_API_KEY; // Make API key available to templates
    next();
});

// Add site settings and menu items to res.locals
app.use(async (req, res, next) => {
    res.locals.settings = await SiteSetting.getAll();
    res.locals.menuItems = await MenuItem.getAll();
    next();
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