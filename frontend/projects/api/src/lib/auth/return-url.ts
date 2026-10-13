/**
 * Where to go after signing in: a path on this site, or Discover. Anything else (another site, a
 * protocol-relative `//host`) is ignored, so the parameter cannot send anyone off-site.
 */
export function safeReturnUrl(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : '/';
}
