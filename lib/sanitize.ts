const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
  'span', 'div', 'img', 'figure', 'figcaption', 'table', 'thead',
  'tbody', 'tr', 'td', 'th', 'hr', 'sup', 'sub', 'small'
]);

const ALLOWED_ATTRS = new Set([
  'href', 'target', 'rel', 'src', 'alt', 'width', 'height',
  'class', 'data-link-to', 'data-author', 'data-timestamp', 'data-post'
]);

// Server-safe HTML sanitizer that works without DOM APIs.
// Strips disallowed tags and attributes using regex-based parsing.
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Remove HTML comments
  let result = html.replace(/<!--[\s\S]*?-->/g, '');

  // Remove script/style tags and their content entirely
  result = result.replace(/<script[\s\S]*?<\/script>/gi, '');
  result = result.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Remove event handler attributes (onclick, onerror, etc.)
  result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Remove javascript: URLs
  result = result.replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '');
  result = result.replace(/src\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '');

  // Process tags: keep allowed, strip disallowed
  result = result.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tag, attrs) => {
    const tagLower = tag.toLowerCase();

    if (!ALLOWED_TAGS.has(tagLower)) {
      return '';
    }

    // For closing tags, no attributes needed
    if (match.startsWith('</')) {
      return `</${tagLower}>`;
    }

    // Filter attributes
    const allowedAttrs: string[] = [];
    const attrRegex = /([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1]!.toLowerCase();
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
      if (ALLOWED_ATTRS.has(attrName) || attrName.startsWith('data-')) {
        allowedAttrs.push(`${attrName}="${attrValue}"`);
      }
    }

    const selfClosing = match.endsWith('/>') || ['br', 'hr', 'img'].includes(tagLower);
    const attrStr = allowedAttrs.length > 0 ? ' ' + allowedAttrs.join(' ') : '';
    return selfClosing ? `<${tagLower}${attrStr} />` : `<${tagLower}${attrStr}>`;
  });

  return result;
}
