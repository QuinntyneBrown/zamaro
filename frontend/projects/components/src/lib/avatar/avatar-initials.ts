export type AvatarKind = 'person' | 'group';

/** Words that never give an initial: "&", punctuation on its own, and the article "The". */
const SKIPPED = /^(?:the|[^\p{L}\p{N}]+)$/iu;

/**
 * The letters on an avatar (docs/specs/components/avatar.md): a person's first and last names
 * ("NF"), a group's first two words ("HC", "DR" for Daniel & Ruth Okonkwo), one word's first letter.
 */
export function avatarInitials(name: string, kind: AvatarKind = 'person'): string {
  const words = name
    .split(/\s+/)
    .filter((word) => word && !SKIPPED.test(word))
    .map((word) => firstLetter(word));
  if (words.length < 2) return words.join('');
  const picked = kind === 'person' ? [words[0], words[words.length - 1]] : words.slice(0, 2);
  return picked.join('');
}

function firstLetter(word: string): string {
  const [first] = new Intl.Segmenter('en-CA', { granularity: 'grapheme' }).segment(
    word.replace(/^[^\p{L}\p{N}]+/u, ''),
  );
  return (first?.segment ?? '').toLocaleUpperCase('en-CA');
}
