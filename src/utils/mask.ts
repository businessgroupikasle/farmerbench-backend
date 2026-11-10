/**
 * Masks an email address for logging, e.g. "farmer@example.com" -> "f***r@example.com".
 * Keeps logs useful for debugging delivery without storing full personal data.
 */
export const maskEmail = (value: string | null | undefined): string => {
  if (!value) return '<none>';
  const [local, domain] = String(value).split('@');
  if (!domain) return '***';
  const maskedLocal =
    local.length <= 2 ? `${local.charAt(0)}***` : `${local.charAt(0)}***${local.charAt(local.length - 1)}`;
  return `${maskedLocal}@${domain}`;
};
