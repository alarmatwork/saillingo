// Ways to support the project, and the people and organisations to thank.
// The support page and its links only appear once at least one link is set.

export const SUPPORT_LINKS: { wise: string | null; kofi: string | null; github: string | null } = {
  /** Wise payment link, e.g. 'https://wise.com/pay/me/yourtag': pay by card or bank, no sign-up needed */
  wise: null,
  /** e.g. 'https://ko-fi.com/yourname' */
  kofi: 'https://ko-fi.com/saillingo',
  /** e.g. 'https://github.com/sponsors/yourname' */
  github: 'https://github.com/sponsors/alarmatwork',
};

/** Where partners (sailing schools and other larger supporters) write to. Kept in two parts so the
 *  full address does not appear as one piece in the page source. */
export const PARTNER_EMAIL: { user: string; domain: string } | null = { user: 'alar', domain: 'wbgrupp.net' };

/**
 * A partner's banner, shown in the app for an agreed period (dates inclusive, YYYY-MM-DD).
 * `image` is a file in public/ (e.g. 'partners/school.png', about 600 x 160) or omitted for a text-only banner.
 */
export interface SponsorBanner {
  name: string;
  url: string;
  text: Record<string, string>;
  image?: string;
  from: string;
  until: string;
}
export const SPONSOR_BANNERS: SponsorBanner[] = [];

/** The banner to show today, if any. */
export function activeBanner(today = new Date().toISOString().slice(0, 10)): SponsorBanner | null {
  return SPONSOR_BANNERS.find((b) => b.from <= today && today <= b.until) ?? null;
}

export interface Partner {
  name: string;
  url?: string;
  /** one line about them, per language code; falls back to English */
  note?: Record<string, string>;
}

/** Larger supporters, shown permanently with a link (for example schools running boat licence courses). */
export const PARTNERS: Partner[] = [];

/** Supporters who want to be thanked by name. */
export const SUPPORTERS: string[] = [];

export const supportEnabled = () => Boolean(SUPPORT_LINKS.wise || SUPPORT_LINKS.kofi || SUPPORT_LINKS.github);
