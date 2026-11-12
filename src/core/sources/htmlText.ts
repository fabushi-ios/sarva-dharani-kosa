/**
 * src/core/sources/htmlText.ts — plain text of an HTML source file (GRETIL etc.), DOM-free.
 */
export function htmlToText(html: string): string {
  return ((html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || ['', html])[1] || html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_m: string, d: string) => String.fromCodePoint(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_m: string, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}
