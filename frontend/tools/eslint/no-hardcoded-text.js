// @ts-check
// zamaro/no-hardcoded-text (L2-111.1): user-facing template text must come from the translation
// catalogue. Flags template text nodes that contain letters and literal aria-label, title, alt and
// placeholder attributes, and string literals passed to the user-facing text of ToastService.show,
// Title.setTitle and AnnouncerService.polite in TypeScript. Brand names in i18n-allowlist.json are
// exempt.
const allowlist = new Set(require('./i18n-allowlist.json'));

const LETTER = /\p{L}/u;
const TEXT_ATTRIBUTES = ['aria-label', 'title', 'alt', 'placeholder'];
/** ToastOptions and ToastAction fields that are read or announced. */
const TOAST_TEXT_FIELDS = [
  'title',
  'kind',
  'text',
  'dismissLabel',
  'label',
  'ariaLabel',
  'busyLabel',
];

/** @param {string} value */
function isHardcoded(value) {
  const text = value.trim();
  return LETTER.test(text) && !allowlist.has(text);
}

/**
 * The text of a string literal or a template literal's fixed parts; null for anything else.
 * @param {any} node
 */
function literalText(node) {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node?.type === 'TemplateLiteral')
    return node.quasis.map((/** @type {any} */ q) => q.value.cooked).join(' ');
  return null;
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
      call: 'Text "{{text}}" passed to {{method}} is hard-coded. Translate a catalogue message instead.',
    },
    schema: [],
  },
  create(context) {
    const services = /** @type {any} */ (context.sourceCode.parserServices);

    /**
     * @param {any} node
     * @param {string} method
     */
    const checkLiteral = (node, method) => {
      const text = literalText(node);
      if (text !== null && isHardcoded(text)) {
        context.report({ node, messageId: 'call', data: { text: text.trim(), method } });
      }
    };

    /** Every toast text field in an options object, and in its actions. @param {any} node */
    const checkToastOptions = (node) => {
      if (node?.type !== 'ObjectExpression') return;
      for (const property of node.properties) {
        if (property.type !== 'Property' || property.key.type !== 'Identifier') continue;
        if (TOAST_TEXT_FIELDS.includes(property.key.name)) checkLiteral(property.value, 'show');
        if (property.key.name === 'actions' && property.value.type === 'ArrayExpression') {
          property.value.elements.forEach(checkToastOptions);
        }
      }
    };
    /** @param {any} node */
    const loc = (node) => services.convertNodeSourceSpanToLoc(node.sourceSpan);

    return {
      /** @param {any} node */
      'CallExpression > MemberExpression.callee > Identifier.property'(node) {
        const call = node.parent.parent;
        if (node.name === 'show') checkToastOptions(call.arguments[0]);
        if (node.name === 'setTitle' || node.name === 'polite')
          checkLiteral(call.arguments[0], node.name);
      },
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
