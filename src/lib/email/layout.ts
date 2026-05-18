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
 *
 * Modernized: pill-shaped (12px radius), 52px tall, 17px font, generous
 * horizontal padding, subtle shadow on supported clients. Outlook still
 * gets a flat rectangle via the VML path — that's a hard limit of MSO.
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
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:32px auto;">
  <tr>
    <td align="center" style="border-radius:12px;background-color:${colorEsc};box-shadow:0 4px 14px rgba(15,23,42,0.10);">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${hrefEsc}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="23%" stroke="f" fillcolor="${colorEsc}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:600;">${labelEsc}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <a href="${hrefEsc}" style="background-color:${colorEsc};border-radius:12px;color:#ffffff;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:17px;font-weight:600;line-height:52px;text-align:center;text-decoration:none;padding:0 32px;min-width:200px;letter-spacing:0.1px;-webkit-text-size-adjust:none;mso-hide:all;">${labelEsc}</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;
}

/**
 * Heuristic: does this gradient look like a decorative light-fade banner
 * (e.g. `linear-gradient(to right, #f8f9ff 0%, #ffffff 100%)`), as opposed
 * to a saturated button-style gradient?
 *
 * We treat a gradient as "light" if every hex color in it is near-white
 * (each RGB channel >= 0xE0). Such gradients are used in templates as
 * subtle banner backgrounds; replacing them with the button-color override
 * would put dark inherited text on a saturated background and look broken.
 */
function isLightGradient(args: string): boolean {
  const hexes = args.match(/#[0-9a-fA-F]{3,8}/g);
  if (!hexes || hexes.length === 0) return false;
  for (const h of hexes) {
    const hex = h.replace('#', '');
    const expanded = hex.length === 3
      ? hex.split('').map((c) => c + c).join('')
      : hex.length >= 6
      ? hex.slice(0, 6)
      : null;
    if (!expanded) return false;
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    if ([r, g, b].some((c) => c < 0xe0)) return false;
  }
  return true;
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
 *    BUT: decorative light-fade gradients (banners) are left alone so the
 *    template's "dark text on light banner" relationship is preserved.
 */
function addGradientFallback(html: string, buttonColorOverride?: string): string {
  return html.replace(
    /background\s*:\s*linear-gradient\(([^)]+)\)\s*;?/g,
    (_match, args: string) => {
      const argsStr = String(args);
      const lightBanner = isLightGradient(argsStr);

      if (buttonColorOverride && !lightBanner) {
        // Saturated button-style gradient → safe to flatten to the
        // admin-chosen colour; the surrounding element already declares
        // `color: white` so contrast is preserved.
        return `background-color: ${buttonColorOverride};`;
      }

      const firstColorMatch = argsStr.match(/#[0-9a-fA-F]{3,8}/);
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

  // Colored header band using the tenant's primary color. Text inside
  // is forced white so a dark/purple background reads correctly. When
  // headerStyle is 'none' we keep a thin 4px accent stripe at the top
  // so the email still feels branded.
  const noHeaderAccentStripe = `<tr>
        <td style="height:4px;line-height:4px;font-size:0;background-color:${escapeAttr(primary)};">&nbsp;</td>
      </tr>`;

  const headerRow =
    headerStyle === 'none'
      ? noHeaderAccentStripe
      : `<tr>
            <td style="background-color:${escapeAttr(primary)};padding:36px 32px;text-align:center;">
              ${
                headerStyle === 'logo'
                  ? `<img src="${escapeAttr(opts.logoUrl!)}" alt="${escapeAttr(orgName)}" width="140" style="display:inline-block;max-width:140px;height:auto;border:0;outline:none;text-decoration:none;">`
                  : `<div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.2px;line-height:1.2;">${escapeHtml(orgName)}</div>`
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
<body style="margin:0;padding:0;background-color:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1f2937;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" dir="${dir}">
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;color:transparent;">${escapeHtml(opts.preheader)}</div>` : ''}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f6f7fb;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06),0 1px 2px rgba(15,23,42,0.04);">
          ${headerRow}
          <tr>
            <td style="padding:44px 40px;color:#27303a;font-size:16px;line-height:1.7;" dir="${dir}">
              ${safeInner}
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="height:1px;line-height:1px;font-size:0;background-color:#eef0f4;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:24px 40px 32px;text-align:center;color:#697384;font-size:13px;line-height:1.6;">
              ${opts.footerNote ? `<p style="margin:0 0 10px 0;color:#697384;">${escapeHtml(opts.footerNote)}</p>` : ''}
              <p style="margin:0;color:#9aa3b2;font-size:12px;letter-spacing:0.2px;">© ${year} ${escapeHtml(orgName)} · ${lang === 'he' ? 'כל הזכויות שמורות' : 'All rights reserved'}</p>
            </td>
          </tr>
        </table>
        <!-- Outer soft footer spacing -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:16px 40px 0;text-align:center;color:#9aa3b2;font-size:11px;line-height:1.5;">
              ${lang === 'he'
                ? 'נשלח אוטומטית — נא לא להשיב להודעה זו.'
                : 'This is an automated message — please do not reply.'}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
