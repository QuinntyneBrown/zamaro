// @ts-check
// zamaro/no-hardcoded-text (L2-111.1): user-facing template text must come from the translation
// catalogue. Flags template text nodes that contain letters and literal aria-label, title, alt and
// placeholder attributes. Brand names in i18n-allowlist.json are exempt.
// The design's call-site checks (ToastService.show, AnnouncerService.polite, Title.setTitle) are
// added with those services.
const allowlist = new Set(require('./i18n-allowlist.json'));

const LETTER = /\p{L}/u;
const TEXT_ATTRIBUTES = ['aria-label', 'title', 'alt', 'placeholder'];

/** @param {string} value */
function isHardcoded(value) {
  const text = value.trim();
  return LETTER.test(text) && !allowlist.has(text);
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow user-facing text that does not come from the translation catalogue',
    },
    messages: {
      text: 'Text "{{text}}" is hard-coded. Add it to the catalogue and use the transloco pipe.',
      attribute:
        'Attribute {{name}}="{{text}}" is hard-coded. Bind it to a catalogue message instead.',
    },
    schema: [],
  },
  create(context) {
    const services = /** @type {any} */ (context.sourceCode.parserServices);
    /** @param {any} node */
    const loc = (node) => services.convertNodeSourceSpanToLoc(node.sourceSpan);

    return {
      /** @param {any} node */
      Text(node) {
        if (isHardcoded(node.value)) {
          context.report({ loc: loc(node), messageId: 'text', data: { text: node.value.trim() } });
        }
      },
      /** @param {any} node */
      'Element > TextAttribute'(node) {
        if (TEXT_ATTRIBUTES.includes(node.name) && isHardcoded(node.value)) {
          context.report({
            loc: loc(node),
            messageId: 'attribute',
            data: { name: node.name, text: node.value },
          });
        }
      },
    };
  },
};
