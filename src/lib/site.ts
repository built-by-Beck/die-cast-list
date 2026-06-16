/** Public production site — custom domain on Firebase Hosting. */
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://diecastlist.com";

export const SITE_NAME = "Die Cast List";
export const SUPPORT_EMAIL = "support@diecastlist.com";
