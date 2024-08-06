# 0xroyce_blog

A flexible and feature-rich blog platform application with plugin support, templates support and built-in analytics.

## Table of Contents
- [Description](#description)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Dependencies](#dependencies)
- [Plugin Development](#plugin-development)
- [Contributing](#contributing)
- [License](#license)

## Description

Blog is a powerful and customizable blog platform that allows users to create, edit, and manage blog posts. It features a robust admin interface, built-in analytics, support for custom plugins, and support for templates, making it suitable for both personal blogs and larger content management needs.

## Features

- User-friendly article creation and editing with TinyMCE integration
- Customizable menu management system
- Site settings configuration
- Built-in simple analytics
- Plugin system for extending functionality
- Responsive design for optimal viewing on various devices
- SEO-friendly with customizable meta descriptions
- Syntax highlighting for code snippets
- Tag support for better content organization

## Installation

To install the application, follow these steps:

```bash
git clone https://github.com/0xroyce/blog.git
cd blog
npm install
```

## Usage
To start the application, use the following command:
```bash
npm start
```

The server will start on the default port (usually 3000). Access the application by navigating to http://localhost:3000 in your web browser.
Configuration

Copy the env_template file to .env in the root directory.
Edit the .env file and fill in your specific configuration details:

- DB_HOST=your_database_host
- DB_USER=your_database_user
- DB_PASSWORD=your_database_password
- DB_NAME=your_database_name
- TINYMCE_API_KEY=your_tinymce_api_key

Set up your database using the provided SQL script.

## Scripts

- npm start: Start the application
- npm run dev: Start the application with nodemon for development

## Dependencies
Key dependencies include:

- express: Web application framework
- ejs: Templating engine
- mysql2: MySQL database driver
- bcrypt: Password hashing
- multer: File upload handling
- sanitize-html: HTML sanitization
- highlight.js: Syntax highlighting for code snippets
- dotenv: Environment variable management

For a full list of dependencies, refer to the package.json file.

## Plugin Development
0xroyce_blog supports custom plugins to extend its functionality. To create a plugin:

- Create a new directory in the plugins/ folder with your plugin name.
- Implement the plugin following the structure in plugins/example-plugin/index.js.
- Your plugin should export an object with name, version, description, and init function.
- Use the pluginLoader to register hooks and routes in your plugin's init function.

Refer to the existing plugins and the PluginLoader class for more details on plugin development.

## Contributing
Contributions are welcome! Please follow these steps:

- Fork the repository
- Create a new branch for your feature or bug fix
- Make your changes and commit them with clear, descriptive messages
- Push your changes to your fork
- Submit a pull request to the main repository

Please ensure your code follows the project's coding standards and includes appropriate tests.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
