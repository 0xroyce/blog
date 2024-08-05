const db = require('../config/database');

class MenuItem {
    static async getAll() {
        const [rows] = await db.query('SELECT * FROM menu_items ORDER BY order_index');
        return this.buildTree(rows);
    }

    static async create(title, url, orderIndex, parentId = null) {
        const [result] = await db.query(
            'INSERT INTO menu_items (title, url, order_index, parent_id) VALUES (?, ?, ?, ?)',
            [title, url, orderIndex, parentId]
        );
        return result.insertId;
    }

    static async update(id, title, url, orderIndex, parentId = null) {
        await db.query(
            'UPDATE menu_items SET title = ?, url = ?, order_index = ?, parent_id = ? WHERE id = ?',
            [title, url, orderIndex, parentId, id]
        );
    }

    static async delete(id) {
        await db.query('DELETE FROM menu_items WHERE id = ?', [id]);
    }

    static buildTree(items, parentId = null) {
        const tree = [];
        for (const item of items) {
            if (item.parent_id === parentId) {
                const children = this.buildTree(items, item.id);
                if (children.length) {
                    item.children = children;
                }
                tree.push(item);
            }
        }
        return tree;
    }
}

module.exports = MenuItem;