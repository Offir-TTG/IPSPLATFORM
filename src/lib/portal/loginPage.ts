/**
 * The login page is the portal's home page. The admin can change its picture
 * and its words (Settings → Login page). They are kept on the organization,
 * in tenants.metadata.login_page, so no table holds them.
 *
 * The words the admin writes are shown on the Hebrew page; empty ones, and
 * the English page, use the built-in translated wording.
 */

export interface LoginPageContent {
  /** The picture beside the form. Empty = the built-in family picture. */
  image_url: string;
  /** The small label above the heading ("האזור האישי"). */
  badge: string;
  title: string;
  subtitle: string;
  /** The white strip over the bottom of the picture (computer only). */
  caption: string;
  /** Where "To the website" leads. Empty = the link is hidden. */
  site_url: string;
}

export const DEFAULT_LOGIN_IMAGE = '/login/home.jpg';

/** The built-in Hebrew wording, shown when a field is left empty (the same
 *  text as the auth.login.* translations). The admin sees it as a hint. */
export const LOGIN_PAGE_HE_DEFAULTS: Pick<LoginPageContent, 'badge' | 'title' | 'subtitle' | 'caption'> = {
  badge: 'האזור האישי',
  title: 'ברוכים הבאים הביתה',
  subtitle: 'התוכניות, המפגשים והמועדון שלכם מחכים לכם כאן.',
  caption: 'כל מה שקניתם ונרשמתם אליו, במקום אחד',
};

export const EMPTY_LOGIN_PAGE: LoginPageContent = {
  image_url: '',
  badge: '',
  title: '',
  subtitle: '',
  caption: '',
  site_url: '',
};

const MAX_TEXT = 300;

/** Reads the saved content, keeping only known text fields. */
export function readLoginPage(raw: unknown): LoginPageContent {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out = { ...EMPTY_LOGIN_PAGE };
  for (const key of Object.keys(EMPTY_LOGIN_PAGE) as Array<keyof LoginPageContent>) {
    const v = src[key];
    out[key] = typeof v === 'string' ? v.trim().slice(0, key.endsWith('url') ? 1000 : MAX_TEXT) : '';
  }
  // Only web addresses or site paths, never javascript: and the like.
  for (const key of ['image_url', 'site_url'] as const) {
    if (out[key] && !/^(https?:\/\/|\/)/i.test(out[key])) out[key] = '';
  }
  return out;
}
