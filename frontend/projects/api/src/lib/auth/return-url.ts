/**
 * Where to go after signing in: a path on this site, or Discover. Anything else (another site, a
 * protocol-relative `//host`) is ignored, so the parameter cannot send anyone off-site.
 */
export function safeReturnUrl(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : '/';
}

/**
 * Whether an address belongs to the admin application, which is served separately from the public
 * one (ADR-0001, ADR-0023): the router cannot reach it, so signing in continues with a full navigation.
 */
export function isAdminUrl(url: string): boolean {
  return url === '/admin' || url.startsWith('/admin/') || url.startsWith('/admin?');
}
