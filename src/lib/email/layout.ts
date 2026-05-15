/**
 * Master email layout — wraps each template's `body_html` in a bulletproof,
 * email-client-safe outer document. Single source of truth for branding,
 * header/footer, and document scaffolding.
 *
 * Why a master layout:
 *  - Every email template (DB-stored or code-hardcoded) was carrying its own
 *    HTML shell with `linear-gradient` buttons that Gmail/Outlook strip,
 *    leaving "white text on no background" buttons (invisible). Fixing the
 *    bug per-template means 38+ separate edits.
 *  - This module centralises the shell + a bulletproof button helper. Per-
 *    template `body_html` becomes just the inner content.
 *
 * Pure-string module — safe to import from both server and client code (the
 * admin preview UI uses it to render a true WYSIWYG of what users get).
 */

export interface EmailLayoutOptions {
  /** 'en' or 'he'. Drives `lang`/`dir` and font fallback. */
  language: 'en' | 'he';
  /** Tenant/organization name shown in header (when no logo) and footer. */
  organizationName?: string;
  /** Tenant branding — header background. Defaults to a neutral blue. */
  primaryColor?: string;
  /**
   * Tenant branding — button background. Falls back to `primaryColor`
   * when unset so existing templates keep working with one colour.
   */
  buttonColor?: string;
  /** Currently unused at layout level; passed through for future use. */
  secondaryColor?: string;
  /** Absolute URL to tenant logo; used when `headerStyle` is 'logo'. */
  logoUrl?: string;
  /** Optional extra footer line shown above the copyright. */
  footerNote?: string;
  /**
   * Header rendering mode:
   *   - 'logo' → render <img> using `logoUrl` (falls back to text if no logo)
   *   - 'text' → render `organizationName` as a styled text band (default)
   *   - 'none' → omit the entire header row
   */
  headerStyle?: 'logo' | 'text' | 'none';
  /**
   * Hidden preview text — what shows up in the inbox row in Gmail/Apple
   * Mail before the user opens the email. Cap ~90 chars for best UX.
   */
  preheader?: string;
}

function escapeHtml(s: string | undefined | null): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string | undefined | null): string {
  return escapeHtml(s);
}

/**
 * Bulletproof button — works in Gmail, Apple Mail, Yahoo, AOL, *and*
 * Outlook (via VML conditional comments). Pass this through Handlebars'
 * triple-mustache (`{{{button ...}}}`) so the HTML isn't escaped.
 */
export function bulletproofButton(
  href: string,
  label: string,
  color: string = '#4f46e5'
): string {
  const hrefEsc = escapeAttr(href);
  const labelEsc = escapeHtml(label);
  const colorEsc = escapeAttr(color);
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto;">
  <tr>
    <td align="center" style="border-radius:8px;background-color:${colorEsc};">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${hrefEsc}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="17%" stroke="f" fillcolor="${colorEsc}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:600;">${labelEsc}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <a href="${hrefEsc}" style="background-color:${colorEsc};border-radius:8px;color:#ffffff;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;font-weight:600;line-height:48px;text-align:center;text-decoration:none;width:260px;-webkit-text-size-adjust:none;mso-hide:all;">${labelEsc}</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;
}

/**
 * Post-process inner HTML to handle `background: linear-gradient(...)`.
 *
 * Two modes:
 *  - **No override**: keep the gradient as `background-image` (Apple Mail
 *    still gets the nice gradient) and add a solid `background-color` in
 *    front using the gradient's own first colour, so clients that strip
 *    gradients (Gmail/Outlook) fall back to a coloured background instead
 *    of "white text on no background".
 *  - **Override set**: replace the gradient entirely with a solid
 *    `background-color: ${buttonColorOverride}`. This is what the admin
 *    "Button Color" setting controls — admins get a clean, consistent
 *    button colour across every email client, no gradient inheritance.
 */
function addGradientFallback(html: string, buttonColorOverride?: string): string {
  return html.replace(
    /background\s*:\s*linear-gradient\(([^)]+)\)\s*;?/g,
    (_match, args: string) => {
      if (buttonColorOverride) {
        return `background-color: ${buttonColorOverride};`;
      }
      const firstColorMatch = String(args).match(/#[0-9a-fA-F]{3,8}/);
      const fallback = firstColorMatch ? firstColorMatch[0] : '#4f46e5';
      return `background-color: ${fallback}; background-image: linear-gradient(${args});`;
    }
  );
}

/**
 * Wrap inner body HTML in the master email shell.
 *
 * Design notes:
 *  - Table-based layout for Outlook (Word renderer) compatibility.
 *  - All styles inline — `<style>` blocks are stripped by Gmail in many
 *    contexts (especially the mobile apps).
 *  - Max width 600px centered with side padding for mobile.
 *  - `dir`/`lang` set at `<html>` level for proper RTL in Hebrew.
 *  - Hidden preheader span gives the inbox preview without showing on open.
 */
export function renderEmailLayout(
  innerBody: string,
  opts: EmailLayoutOptions
): string {
  const dir = opts.language === 'he' ? 'rtl' : 'ltr';
  const lang = opts.language;
  const primary = opts.primaryColor || '#4f46e5';
  const orgName = opts.organizationName || 'IPS Platform';
  const year = new Date().getFullYear();
  // 'logo' falls back to text if no logoUrl is provided so we never emit a
  // broken <img>. 'none' suppresses the entire header row.
  const headerStyle: 'logo' | 'text' | 'none' =
    opts.headerStyle === 'none'
      ? 'none'
      : opts.headerStyle === 'logo' && opts.logoUrl
      ? 'logo'
      : 'text';

  // When the admin doesn't explicitly set a button colour, gradients in
  // existing templates keep working unchanged (their own first colour
  // becomes the fallback). When the admin sets one, every gradient
  // button in the body gets replaced by the chosen solid colour.
  const safeInner = addGradientFallback(innerBody, opts.buttonColor);

  const headerRow =
    headerStyle === 'none'
      ? ''
      : `<tr>
            <td style="background-color:${escapeAttr(primary)};padding:32px;text-align:center;">
              ${
                headerStyle === 'logo'
                  ? `<img src="${escapeAttr(opts.logoUrl!)}" alt="${escapeAttr(orgName)}" width="160" style="display:inline-block;max-width:160px;height:auto;border:0;outline:none;text-decoration:none;">`
                  : `<div style="color:#ffffff;font-size:22px;font-weight:600;letter-spacing:0.3px;">${escapeHtml(orgName)}</div>`
              }
            </td>
          </tr>`;

  return `<!DOCTYPE html>
<html lang="${escapeAttr(lang)}" dir="${dir}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${escapeHtml(orgName)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1f2937;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" dir="${dir}">
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;color:transparent;">${escapeHtml(opts.preheader)}</div>` : ''}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          ${headerRow}
          <tr>
            <td style="padding:36px 32px;color:#1f2937;font-size:15px;line-height:1.7;" dir="${dir}">
              ${safeInner}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8f9fa;padding:20px 32px;text-align:center;color:#6b7280;font-size:13px;line-height:1.6;">
              ${opts.footerNote ? `<p style="margin:0 0 8px 0;">${escapeHtml(opts.footerNote)}</p>` : ''}
              <p style="margin:0;">© ${year} ${escapeHtml(orgName)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
