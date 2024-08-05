const { JSDOM } = require('jsdom');

function stripHtml(html) {
    const dom = new JSDOM(html);
    return dom.window.document.body.textContent || "";
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength).trim() + '...';
}

function createExcerpt(html, maxLength = 200) {
    const plainText = stripHtml(html);
    return truncateText(plainText, maxLength);
}

module.exports = {
    stripHtml,
    truncateText,
    createExcerpt
};