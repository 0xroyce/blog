const db = require('../config/database');
const { executeQueryWithRetry } = require('../utils/dbUtils');
const slugify = require('slugify');
const Tag = require('./tag');

class Article {
    static async findAll(page = 1, limit = 10, includeDrafts = false) {
        const offset = (page - 1) * limit;
        const query = includeDrafts
            ? 'SELECT * FROM articles ORDER BY created_at DESC LIMIT ? OFFSET ?'
            : 'SELECT * FROM articles WHERE is_draft = FALSE AND published_at <= NOW() ORDER BY published_at DESC LIMIT ? OFFSET ?';
        const countQuery = includeDrafts
            ? 'SELECT COUNT(*) as total FROM articles'
            : 'SELECT COUNT(*) as total FROM articles WHERE is_draft = FALSE AND published_at <= NOW()';

        const [rows, [countResult]] = await Promise.all([
            executeQueryWithRetry(query, [limit, offset]),
            executeQueryWithRetry(countQuery)
        ]);

        for (let article of rows) {
            article.tags = await Tag.getTagsForArticle(article.id);
        }

        return {
            articles: rows,
            total: countResult.total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(countResult.total / limit)
        };
    }

    static async findById(id) {
        const rows = await executeQueryWithRetry('SELECT * FROM articles WHERE id = ?', [id]);
        if (rows.length > 0) {
            rows[0].tags = await Tag.getTagsForArticle(id);
        }
        return rows[0];
    }

    static async findBySlug(slug) {
        const rows = await executeQueryWithRetry('SELECT * FROM articles WHERE slug = ?', [slug]);
        if (rows.length > 0) {
            rows[0].tags = await Tag.getTagsForArticle(rows[0].id);
        }
        return rows[0];
    }

    static async create(title, content, author, metaDescription, tags, mainImage, publishedAt, isDraft) {
        const slug = slugify(title, { lower: true, strict: true });
        const [result] = await db.query(
            'INSERT INTO articles (title, content, author, meta_description, slug, main_image, published_at, is_draft) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, content, author, metaDescription, slug, mainImage, publishedAt, isDraft]
        );
        const articleId = result.insertId;
        await Tag.setTagsForArticle(articleId, tags);
        return articleId;
    }

    static async update(id, title, content, metaDescription, tags, mainImage, publishDate, isDraft) {
        const slug = slugify(title, { lower: true, strict: true });
        await db.query(
            'UPDATE articles SET title = ?, content = ?, meta_description = ?, slug = ?, main_image = ?, published_at = ?, is_draft = ?, updated_at = NOW() WHERE id = ?',
            [title, content, metaDescription, slug, mainImage, publishDate, isDraft, id]
        );
        await Tag.setTagsForArticle(id, tags);
    }

    static async delete(id) {
        await db.query('DELETE FROM articles WHERE id = ?', [id]);
    }

    static async search(query, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const searchQuery = `
            SELECT * FROM articles 
            WHERE title LIKE ? OR content LIKE ?
            ORDER BY published_at DESC
            LIMIT ? OFFSET ?
        `;
        const countQuery = `
            SELECT COUNT(*) as total FROM articles 
            WHERE title LIKE ? OR content LIKE ?
        `;
        const searchValue = `%${query}%`;

        const [rows, [countResult]] = await Promise.all([
            executeQueryWithRetry(searchQuery, [searchValue, searchValue, limit, offset]),
            executeQueryWithRetry(countQuery, [searchValue, searchValue])
        ]);

        for (let article of rows) {
            article.tags = await Tag.getTagsForArticle(article.id);
        }

        return {
            articles: rows,
            total: countResult.total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(countResult.total / limit)
        };
    }
}

module.exports = Article;