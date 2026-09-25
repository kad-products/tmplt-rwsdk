#!/usr/bin/env node
/**
 * Post-processes worker-configuration.d.ts after `wrangler types` runs.
 *
 * Wrangler 4.60+ marks bindings as optional when a binding is absent from any named
 * environment (cloudflare/workers-sdk#8475). We intentionally don't pre-add bindings
 * to upper environments until the resource exists in Cloudflare, so this script strips
 * the optional markers to keep all binding types required.
 *
 * Two formats have been observed across wrangler versions:
 *   PROP?: Type           — optional property syntax (wrangler 4.100+)
 *   PROP: Type | undefined — union with undefined (earlier wrangler 4.60+)
 */

import { readFileSync, writeFileSync } from 'node:fs';

const filePath = 'worker-configuration.d.ts';
const content = readFileSync(filePath, 'utf-8');

const fixed = content
	// PROP?: Type  →  PROP: Type
	.replace(/^(\s+\w+)\?:/gm, '$1:')
	// Type | undefined;  →  Type;
	.replace(/\s*\|\s*undefined(?=;)/g, '');

if (fixed === content) {
	console.log('fix-env-types: nothing to strip');
} else {
	writeFileSync(filePath, fixed, 'utf-8');
	console.log('fix-env-types: stripped optional markers from Env bindings in worker-configuration.d.ts');
}
