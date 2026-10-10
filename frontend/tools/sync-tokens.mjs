// docs/design-system/tokens/tokens.css is the source of truth; the components
// library ships a verbatim copy so applications build without reaching into docs/.
import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const from = fileURLToPath(new URL('../../docs/design-system/tokens/tokens.css', import.meta.url));
const to = fileURLToPath(new URL('../projects/components/src/styles/tokens.css', import.meta.url));

copyFileSync(from, to);
console.log('tokens.css synced');
