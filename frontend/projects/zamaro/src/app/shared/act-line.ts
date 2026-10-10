import type { ActType, Style } from 'api';

/** The style that names each act type when the artist offers it ("Solo vocalist" for a solo act). */
const ACT_STYLE: Partial<Record<ActType, Style>> = {
  solo: 'solo-vocalist',
  band: 'band',
  choir: 'gospel-choir',
};

/**
 * The act type and styles as a card shows them (L2-006.1): the act type, written as its style name
 * when the artist has that style, then the other styles. "Band · Acoustic, Hymns",
 * "Solo vocalist · Hymns", "Duo · Acoustic, Hymns", "Gospel choir".
 *
 * @param name translates `common.act.*` and `common.style.*` keys
 */
export function actLine(
  actType: ActType,
  styles: readonly Style[],
  name: (key: string) => string,
): string {
  const actStyle = ACT_STYLE[actType];
  const lead =
    actStyle && styles.includes(actStyle)
      ? name(`common.style.${actStyle}`)
      : name(`common.act.${actType}`);
  const others = styles
    .filter((style) => style !== actStyle)
    .map((style) => name(`common.style.${style}`));
  return others.length ? `${lead} · ${others.join(', ')}` : lead;
}
