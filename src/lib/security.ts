export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const sanitizePlainText = (value: unknown, maxLength = 1000): string => {
  const text = String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text.slice(0, maxLength);
};

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const ALLOWED_RICH_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);
const BLOCKED_RICH_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'link', 'meta']);
const GLOBAL_RICH_ATTRS = new Set(['title', 'aria-label']);
const TAG_RICH_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
};

const isSafeRichUrl = (value: string): boolean => {
  const url = value.trim();
  if (!url) return false;
  if (url.startsWith('#')) return true;
  if (url.startsWith('/') && !url.startsWith('//')) return true;

  try {
    const parsed = new URL(url, 'https://teraformix.local');
    return SAFE_URL_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
};

export const sanitizeRichHtml = (value: unknown, maxLength = 100000): string => {
  const html = String(value ?? '').slice(0, maxLength);
  if (typeof document === 'undefined') {
    return escapeHtml(html);
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  const sanitizeNode = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 8) {
        child.parentNode?.removeChild(child);
        return;
      }

      if (child.nodeType !== 1) return;

      const element = child as HTMLElement;
      const tag = element.tagName.toLowerCase();

      if (BLOCKED_RICH_TAGS.has(tag)) {
        element.remove();
        return;
      }

      if (!ALLOWED_RICH_TAGS.has(tag)) {
        element.replaceWith(document.createTextNode(element.textContent || ''));
        return;
      }

      const allowedAttrs = new Set([...(TAG_RICH_ATTRS[tag] || []), ...GLOBAL_RICH_ATTRS]);
      Array.from(element.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const attrValue = attr.value.trim();
        const isUrlAttr = name === 'href' || name === 'src';
        const isUnsafeAttr = name.startsWith('on') || name === 'style' || !allowedAttrs.has(name);

        if (isUnsafeAttr || (isUrlAttr && !isSafeRichUrl(attrValue))) {
          element.removeAttribute(attr.name);
        }
      });

      if (tag === 'a' && element.getAttribute('target') === '_blank') {
        element.setAttribute('rel', 'noopener noreferrer');
      }
      if (tag === 'img' && !element.getAttribute('loading')) {
        element.setAttribute('loading', 'lazy');
      }

      sanitizeNode(element);
    });
  };

  sanitizeNode(template.content);
  return template.innerHTML;
};

export const safeJsonScript = (value: unknown): string =>
  (JSON.stringify(value ?? null) ?? 'null')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
