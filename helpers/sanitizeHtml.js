const sanitizeHtml = require('sanitize-html');

const config = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'a',
    'code',
    'pre',
    'blockquote',
  ],
  allowedAttributes: {
    a: ['href', 'target'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - Raw HTML input
 * @returns {string} - Sanitized HTML
 */
module.exports = (html) => {
  if (!html) return html;
  return sanitizeHtml(html, config);
};
