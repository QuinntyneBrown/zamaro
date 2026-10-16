/** A URL slug: lower-case ASCII letters and digits joined by single hyphens ("Marcus Bell Trio" → "marcus-bell-trio"). */
export function slug(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Words capitalised and joined by spaces ("booker-1" → "Booker 1"). */
export function headline(text: string): string {
  return text
    .split(/[\s_-]+/)
    .filter((word) => word !== '')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
