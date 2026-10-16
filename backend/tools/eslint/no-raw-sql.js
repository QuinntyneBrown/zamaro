/**
 * L2-075.2: database access is parameterised, never string-concatenated. Drizzle's `sql` tagged
 * template and postgres.js's tagged template bind every interpolation; the escape hatches are
 * `sql.raw(...)` and `.unsafe(...)`, and a query passed as a plain string. This rule allows
 * `sql.raw` with a constant only, and refuses `.execute(...)`, `.unsafe(...)` or `.query(...)`
 * called with a string, a template with interpolations, or a concatenation.
 */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'disallow SQL built from strings (L2-075.2)' },
    messages: {
      rawNonConstant:
        'sql.raw() takes a constant string only; bind values with the sql`` template.',
      stringQuery:
        '{{method}}() takes a tagged sql`` template, not a string; bind values with the template.',
    },
    schema: [],
  },
  create(context) {
    const isConstantString = (node) =>
      (node.type === 'Literal' && typeof node.value === 'string') ||
      (node.type === 'TemplateLiteral' && node.expressions.length === 0);
    const isStringBuilt = (node) =>
      (node.type === 'Literal' && typeof node.value === 'string') ||
      (node.type === 'TemplateLiteral' && node.expressions.length > 0) ||
      (node.type === 'BinaryExpression' && node.operator === '+');

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'MemberExpression' || callee.property.type !== 'Identifier') return;
        const method = callee.property.name;
        const [first] = node.arguments;
        if (first === undefined) return;

        if (
          method === 'raw' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'sql'
        ) {
          if (!isConstantString(first)) context.report({ node, messageId: 'rawNonConstant' });
          return;
        }
        if (
          (method === 'execute' || method === 'unsafe' || method === 'query') &&
          isStringBuilt(first)
        ) {
          context.report({ node, messageId: 'stringQuery', data: { method } });
        }
      },
    };
  },
};
