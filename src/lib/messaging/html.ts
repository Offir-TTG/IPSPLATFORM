/**
 * Reminder messages are written in a small rich-text editor: paragraphs,
 * bold, italic, lists and links. Before a message goes out its HTML is cut
 * down to exactly those tags, and the bell gets a plain-text version.
 * Pure functions, safe on the client.
 */

const ALLOWED = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a']);

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function safeHref(raw: string): string | null {
  const href = raw.trim().replace(/^["']|["']$/g, '');
  if (/^(https?:|mailto:|tel:|\/)/i.test(href)) return href;
  return null;
}

/** Keeps only the editor's tags; drops scripts, styles, event handlers and unsafe links. */
export function sanitizeMessageHtml(html: string): string {
  if (!html) return '';
  const withoutBlocks = html.replace(/<(script|style|iframe|object|embed|template)[\s\S]*?<\/\1\s*>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  return withoutBlocks.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (tag, nameRaw: string, attrs: string) => {
    const name = nameRaw.toLowerCase();
    if (!ALLOWED.has(name)) return '';
    const closing = tag.startsWith('</');
    if (closing) return name === 'br' ? '' : `</${name}>`;
    if (name === 'a') {
      const m = /href\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i.exec(attrs);
      const href = m ? safeHref(m[1]) : null;
      return href ? `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">` : '<a>';
    }
    return name === 'br' ? '<br>' : `<${name}>`;
  });
}

const ENTITIES: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

/** The bell's plain text: paragraphs become blank lines, list items get a dash. */
export function htmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>\s*/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (e) => ENTITIES[e] ?? e)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Whether the editor's HTML has any words in it. */
export function isBlankHtml(html: string | null | undefined): boolean {
  return !html || htmlToText(html).trim() === '';
}
