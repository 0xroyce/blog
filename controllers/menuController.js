const MenuItem = require('../models/menuItem');

exports.renderMenuManager = async (req, res) => {
    const menuItems = await MenuItem.getAll();
    res.render('admin/menu-manager', { menuItems });
};

exports.createMenuItem = async (req, res) => {
    const { title, url, orderIndex, parentId } = req.body;
    await MenuItem.create(title, url, orderIndex, parentId || null);
    res.redirect('/admin/menu');
};

exports.updateMenuItem = async (req, res) => {
    const { id, title, url, orderIndex, parentId } = req.body;
    await MenuItem.update(id, title, url, orderIndex, parentId || null);
    res.redirect('/admin/menu');
};

exports.deleteMenuItem = async (req, res) => {
    const { id } = req.params;
    await MenuItem.delete(id);
    res.redirect('/admin/menu');
};