const db = require('../config/database');

class Tag {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM tags ORDER BY name');
        return rows;
    }

    static async findOrCreate(name) {
        let [rows] = await db.query('SELECT * FROM tags WHERE name = ?', [name]);
        if (rows.length === 0) {
            const [result] = await db.query('INSERT INTO tags (name) VALUES (?)', [name]);
            return result.insertId;
        }
        return rows[0].id;
    }

    static async getTagsForArticle(articleId) {
        const [rows] = await db.query(
            'SELECT t.* FROM tags t JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = ?',
            [articleId]
        );
        return rows;
    }

    static async setTagsForArticle(articleId, tagNames) {
        // First, remove all existing tags for this article
        await db.query('DELETE FROM article_tags WHERE article_id = ?', [articleId]);

        // Then, add the new tags
        for (let tagName of tagNames) {
            const tagId = await this.findOrCreate(tagName);
            await db.query('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)', [articleId, tagId]);
        }
    }
}

module.exports = Tag;