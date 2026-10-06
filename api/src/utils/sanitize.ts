import sanitizeHtml from 'sanitize-html';

// Server-side allow-list for the HTML produced by the TipTap editor (StarterKit + sub/superscript + text-align).
// Anything else (script, iframe, on* handlers, javascript: URLs, style, ...) is removed before it reaches the DB.
const OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: [
        'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'code', 'pre', 'blockquote',
        'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'sub', 'sup', 'a', 'span',
    ],
    allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
        p: ['style'],
        h1: ['style'], h2: ['style'], h3: ['style'], h4: ['style'], h5: ['style'], h6: ['style'],
    },
    allowedStyles: {
        '*': { 'text-align': [/^(left|right|center|justify)$/] },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
        a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
    },
};

/** Sanitises user supplied rich text. Non-string values become an empty string. */
export const sanitizeRichText = (value: unknown, maxLength = 50_000): string => {
    if (typeof value !== 'string') return '';
    return sanitizeHtml(value.slice(0, maxLength), OPTIONS);
};
