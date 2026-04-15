export function normalizeWebsiteUrl(value?: string | null): string {
  const trimmed = (value ?? '').trim();

  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed.replace(/^\/+/, '')}`;
}
