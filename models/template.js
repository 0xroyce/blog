const fs = require('fs').promises;
const path = require('path');

class Template {
    static async getAll() {
        const templatesDir = path.join(__dirname, '..', 'views', 'templates');
        try {
            const templates = await fs.readdir(templatesDir);
            return templates.filter(async (template) => {
                const stat = await fs.stat(path.join(templatesDir, template));
                return stat.isDirectory();
            });
        } catch (error) {
            console.error('Error reading templates directory:', error);
            return ['default']; // Return default if there's an error
        }
    }

    static async getTemplate(name) {
        const templateDir = path.join(__dirname, '..', 'views', 'templates', name);
        try {
            await fs.access(templateDir);
            return name;
        } catch (error) {
            console.error(`Template ${name} not found, using default:`, error);
            return 'default';
        }
    }
}

module.exports = Template;