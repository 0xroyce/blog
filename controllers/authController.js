const bcrypt = require('bcrypt');
const User = require('../models/user');

exports.renderLogin = (req, res) => {
    res.render('admin/login', { error: req.flash('error') });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findByUsername(username);
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            req.session.username = user.username;
            res.redirect('/admin/dashboard');
        } else {
            req.flash('error', 'Invalid username or password');
            res.redirect('/auth/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
};

exports.isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/auth/login');
    }
};