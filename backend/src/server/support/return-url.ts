/**
 * Where a link returns to on Zamaro Web: a path on the site, or Discover for anything else, so an
 * email never links off the site (accounts/register-booker).
 */
export function returnUrlOrDiscover(url: string | null | undefined): string {
  return url !== null &&
    url !== undefined &&
    url.startsWith('/') &&
    !url.startsWith('//') &&
    !url.includes('\\')
    ? url
    : '/';
}
