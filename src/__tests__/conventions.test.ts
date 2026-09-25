import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..');

function getFiles(dir: string, exclude: string[] = []): string[] {
	const abs = join(SRC, dir);
	if (!existsSync(abs)) {
		return [];
	}
	return (readdirSync(abs, { recursive: true, withFileTypes: true }) as import('fs').Dirent[])
		.filter(e => e.isFile() && /\.tsx?$/.test(e.name))
		.map(e => join(e.parentPath, e.name))
		.filter(p => !exclude.some(ex => p.includes(ex)));
}

function read(p: string): string {
	return readFileSync(p, 'utf-8');
}

function rel(p: string): string {
	return relative(SRC, p);
}

const SKIP = ['__tests__', 'readme.md'];

// ─── Actions ──────────────────────────────────────────────────────────────────

describe('actions', () => {
	// utils.ts and webauthn.ts are non-entry utility files — 'use server' not required there
	const ACTION_SKIP = [...SKIP, 'utils.ts', 'webauthn.ts', 'index.ts'];
	const entryFiles = getFiles('actions', ACTION_SKIP);
	const allFiles = getFiles('actions', SKIP);

	it("every action entry file has 'use server'", () => {
		const bad = entryFiles.filter(p => !read(p).includes("'use server'"));
		expect(bad.map(rel), "Missing 'use server'").toStrictEqual([]);
	});

	it('no action file uses export default', () => {
		const bad = allFiles.filter(p => /\bexport default\b/.test(read(p)));
		expect(bad.map(rel), 'export default not allowed in actions (no barrel export)').toStrictEqual([]);
	});

	it('no action file imports from @/db or @/models', () => {
		const bad = allFiles.filter(p => /from ['"]@\/(db|models)['"]/.test(read(p)));
		expect(bad.map(rel), 'Direct db/models import not allowed in actions; use repositories').toStrictEqual([]);
	});

	it('all actions export only underscore-prefixed "private" methods or serverAction-wrapped methods', () => {
		const allowedExceptions: Record<string, string[]> = {
			'actions/auth.ts': ['startPasskeyLogin', 'finishPasskeyLogin'],
			'actions/registration.ts': ['startPasskeyRegistration', 'finishPasskeyRegistration'],
		};
		const badEntries: Record<string, string>[] = [];
		allFiles.forEach(f => {
			const fileContents = read(f);
			const relPath = rel(f);
			const exportedFunctionNames = [...fileContents.matchAll(/^export async function ([^_]\w*)/gm)].map(m => String(m[1]));
			const fileExceptions = allowedExceptions[relPath] || [];
			exportedFunctionNames.forEach(funcName => {
				if (fileExceptions.includes(funcName)) {
					return;
				}
				badEntries.push({
					relPath: rel(f),
					funcName,
				});
			});
		});
		expect(
			badEntries.map(e => `${e.relPath}:${e.funcName}`),
			'Non-private and non-serverAction wrapped method export found',
		).toStrictEqual([]);
	});

	it('all serverActions require auth', () => {
		// Actions that intentionally omit requireAuthentication (e.g. public-facing search)
		const exceptions = ['actions/submit-recipe-search.ts'];
		const bad = allFiles.filter(f => {
			if (exceptions.includes(rel(f))) return false;
			const fileContents = read(f);
			const matches = [...fileContents.matchAll(/serverAction\(\[([\s\S]*?)\]\)/g)].map(m => String(m[1]));
			if (matches.length === 0) {
				return false;
			}
			return matches.some(m => !/requireAuthentication/.test(m));
		});
		expect(bad.map(rel), 'Action defined without auth interrupter included').toStrictEqual([]);
	});

	it('all serverActions require at least one permission', () => {
		const bad = allFiles.filter(f => {
			const fileContents = read(f);
			const matches = [...fileContents.matchAll(/serverAction\(\[([\s\S]*?)\]\)/g)].map(m => String(m[1]));
			if (matches.length === 0) {
				return false;
			}
			return matches.some(m => !/requirePermissions/.test(m));
		});
		expect(bad.map(rel), 'Action defined without permissions interrupter included').toStrictEqual([]);
	});
});

// ─── Repositories ──────────────────────────────────────────────────────────────

describe('repositories', () => {
	const files = getFiles('repositories', [...SKIP, 'index.ts']);

	it("no repository file has 'use server'", () => {
		const bad = files.filter(p => read(p).includes("'use server'"));
		expect(bad.map(rel), "'use server' not allowed in repositories").toStrictEqual([]);
	});

	it('no repository file uses export default', () => {
		const bad = files.filter(p => /\bexport default\b/.test(read(p)));
		expect(bad.map(rel), 'export default not allowed in repositories; use named exports').toStrictEqual([]);
	});
});

// ─── Pages ────────────────────────────────────────────────────────────────────

describe('pages', () => {
	const files = getFiles('pages', SKIP);

	it('no page file imports requestInfo as a value', () => {
		// Pages must receive request info via function parameter, not the rwsdk global
		const bad = files.filter(p => /^import(?!\s+type)\s*\{[^}]*\brequestInfo\b/m.test(read(p)));
		expect(bad.map(rel), 'requestInfo global must not be imported; destructure from function parameter instead').toStrictEqual(
			[],
		);
	});

	it('no page file imports from @/db or @/models', () => {
		const bad = files.filter(p => /from ['"]@\/(db|models)['"]/.test(read(p)));
		expect(bad.map(rel), 'Direct db/models import not allowed in pages; use repositories').toStrictEqual([]);
	});

	it('all page routes files export a named document-type map, not a bare array', () => {
		const allowedKeys = new Set(['app', 'admin', 'noJS']);
		const routeFiles = files.filter(p => p.endsWith('routes.ts'));
		const bad: string[] = [];
		for (const p of routeFiles) {
			const content = read(p);
			const relPath = rel(p);
			if (!/^export default \{/m.test(content)) {
				bad.push(`${relPath} — must use export default { docType: [...] }, not a bare array or single handler`);
				continue;
			}
			// Top-level keys of the export default object are at exactly one tab of indentation
			const keys = [...content.matchAll(/^\t(\w+):/gm)].map(m => m[1]);
			for (const key of keys) {
				if (!allowedKeys.has(key)) {
					bad.push(`${relPath} — invalid document type key '${key}'; must be one of: ${[...allowedKeys].join(', ')}`);
				}
			}
		}
		expect(bad, 'routes.ts must use export default { docType: [...] } with keys from: app, admin, noJS').toStrictEqual([]);
	});

	it('all page component files export a default function named after their path', () => {
		// Rule: Pages__<path> where directories become __ and hyphens become _
		// exclusions:
		//   utils for error handler methods
		//   _-prefixed files that are helpers for dev mode, not actual page components
		// e.g. src/pages/admin/users/not-found.tsx → Pages__admin__users__not_found
		const pageFiles = files.filter(p => p.endsWith('.tsx') && !p.endsWith('pages/utils.tsx') && !p.includes('/_'));
		const bad: string[] = [];
		for (const p of pageFiles) {
			const relPath = rel(p); // e.g. "pages/admin/users/not-found.tsx"
			const pathPart = relPath.replace(/^pages\//, '').replace(/\.tsx$/, '');
			const expectedName = `Pages__${pathPart.replace(/-/g, '_').replace(/\//g, '__')}`;
			const content = read(p);
			const match = content.match(/^export default (?:async )?function (\w+)/m);
			if (!match) {
				bad.push(`${relPath} — no "export default [async] function <name>" found`);
				continue;
			}
			if (match[1] !== expectedName) {
				bad.push(`${relPath} — function is named "${match[1]}", expected "${expectedName}"`);
			}
		}
		expect(
			bad,
			`Page component function names must follow Pages__<path> convention (directories → __, hyphens → _)`,
		).toStrictEqual([]);
	});

	it('All route() calls must include requireAuthentication and requirePermissions', () => {
		const routeFiles = files.filter(p => p.endsWith('routes.ts'));
		// Explicit opt-in exceptions for truly public routes — add new public routes here.
		// true here means the route does NOT need the interrupter
		const allowedExceptions: Record<string, Record<string, { auth?: boolean; perms?: boolean }>> = {
			'pages/dev/routes.ts': {
				'/games/play/contestant': { auth: true, perms: true },
				'/games/play/display': { auth: true, perms: true },
				'/games/play/host': { auth: true, perms: true },
				'/games/register': { auth: true, perms: true },
				'/games/register/:stateSlug': { auth: true, perms: true },
			},
			'pages/games/routes.ts': {
				'/:gameId/play': { auth: true },
				'/:gameId/register': { auth: true },
			},
			'pages/auth/routes.ts': {
				'/login': { auth: true },
				'/logout': { auth: true, perms: true },
			},
		};
		const bad: string[] = [];
		for (const p of routeFiles) {
			const content = read(p);
			const relPath = rel(p);
			const fileExceptions = allowedExceptions[relPath] ?? {};

			[...content.matchAll(/\broute\((['"][^'"]*['"]),(?!\s*\[)/g)].forEach(m => {
				const ex = fileExceptions[m[1].slice(1, -1)] ?? {};
				if (!ex.auth || !ex.perms) {
					bad.push(`${relPath}: route(${m[1]}) — missing handler array`);
				}
			});

			[...content.matchAll(/\broute\((['"][^'"]*['"]),\s*\[([\s\S]*?)\]/g)].forEach(m => {
				const ex = fileExceptions[m[1].slice(1, -1)] ?? {};
				if (!m[2].includes('requireAuthentication') && !ex.auth) {
					bad.push(`${relPath}: route(${m[1]}) — missing requireAuthentication`);
				}
				if (!m[2].includes('requirePermissions(') && !ex.perms) {
					bad.push(`${relPath}: route(${m[1]}) — missing requirePermissions`);
				}
			});
		}
		expect(bad, 'All route() calls must include requireAuthentication and requirePermissions').toStrictEqual([]);
	});
});

// ─── Components ───────────────────────────────────────────────────────────────

describe('components', () => {
	const files = getFiles('components', SKIP);

	it('no component file imports from @/repositories', () => {
		const bad = files.filter(p => /from ['"]@\/repositories['"/]/.test(read(p)));
		expect(bad.map(rel), 'Repository imports not allowed in components; pass data as props').toStrictEqual([]);
	});

	it('no component file imports from @/db or @/models', () => {
		const bad = files.filter(p => /from ['"]@\/(db|models)['"]/.test(read(p)));
		expect(bad.map(rel), 'Direct db/models import not allowed in components').toStrictEqual([]);
	});

	it('no design-system component imports from the @/components/design-system barrel', () => {
		const designSystemFiles = getFiles('components/design-system', SKIP);
		const bad = designSystemFiles.filter(p => /from ['"]@\/components\/design-system['"]/.test(read(p)));
		expect(
			bad.map(rel),
			'Design system components must use relative imports, not the barrel (causes circular dependencies)',
		).toStrictEqual([]);
	});
});

// ─── Schemas ──────────────────────────────────────────────────────────────────

describe('schemas', () => {
	const files = getFiles('schemas', [...SKIP, 'index.ts', 'utils.ts']);

	it('no schema file imports from @/db or @/models', () => {
		const bad = files.filter(p => /from ['"]@\/(db|models)['"]/.test(read(p)));
		expect(bad.map(rel), 'Direct db/models import not allowed in schemas').toStrictEqual([]);
	});
});

// ─── Interrupters ─────────────────────────────────────────────────────────────

describe('interrupters', () => {
	const files = getFiles('interrupters', [...SKIP, 'index.ts']);

	it('no interrupter file uses export default', () => {
		const bad = files.filter(p => /\bexport default\b/.test(read(p)));
		expect(bad.map(rel), 'export default not allowed in interrupters; use named exports re-exported via index.ts').toStrictEqual(
			[],
		);
	});
});

// ─── Steps ────────────────────────────────────────────────────────────────────

describe('steps', () => {
	const files = getFiles('steps', [...SKIP, 'index.ts']);

	it('no step file imports from @/db or @/models', () => {
		const bad = files.filter(p => /from ['"]@\/(db|models)['"]/.test(read(p)));
		expect(bad.map(rel), 'Direct db/models import not allowed in steps; use repositories').toStrictEqual([]);
	});
});

// ─── Middleware ────────────────────────────────────────────────────────────────

describe('middleware', () => {
	const files = getFiles('middleware', SKIP);

	it('every middleware file has a default export', () => {
		const bad = files.filter(p => !/\bexport default\b/.test(read(p)));
		expect(bad.map(rel), 'Middleware files must use default export').toStrictEqual([]);
	});
});

// ─── Worker ───────────────────────────────────────────────────────────────────

describe('worker', () => {
	it('only route() calls are for root and NotFound', () => {
		const content = read(join(SRC, 'worker.tsx'));
		const routes = [...content.matchAll(/\broute\('([^']+)'/g)].map(m => m[1]);
		expect(routes.sort(), 'Unexpected route() calls in worker.tsx — use prefix() for all other routes').toEqual(['*', '/']);
	});

	it('all page imports come from routes files except root and NotFound', () => {
		const content = read(join(SRC, 'worker.tsx'));
		const allowedExceptions = ['root', 'about', 'not-found'];
		const bad = [...content.matchAll(/from ['"]@\/pages\/([^'"]+)['"]/g)]
			.map(m => m[1])
			.filter(p => !p.endsWith('/routes') && !allowedExceptions.includes(p));
		expect(bad, 'Page imports in worker.tsx must come from */routes files').toStrictEqual([]);
	});
});

// ─── Barrel exports ───────────────────────────────────────────────────────────

describe('barrel exports', () => {
	it('src/actions has no index.ts (barrel exports break the SSR build)', () => {
		expect(existsSync(join(SRC, 'actions/index.ts'))).toBe(false);
	});

	it.each(['repositories', 'schemas', 'steps', 'interrupters', 'analytics'])(
		'src/%s has an index.ts barrel file if the parent dir exists',
		dir => {
			if (existsSync(join(SRC, dir))) {
				expect(existsSync(join(SRC, `${dir}/index.ts`))).toBe(true);
			}
		},
	);

	const allSource = getFiles('.', SKIP);

	it('no source file uses a @/repositories sub-path import', () => {
		const bad = allSource.filter(p => /from ['"]@\/repositories\//.test(read(p)));
		expect(bad.map(rel), 'Import from @/repositories barrel, not sub-paths').toStrictEqual([]);
	});

	it('no source file uses a @/schemas sub-path import', () => {
		const bad = allSource.filter(p => /from ['"]@\/schemas\//.test(read(p)));
		expect(bad.map(rel), 'Import from @/schemas barrel, not sub-paths').toStrictEqual([]);
	});

	it('no source file uses a @/steps sub-path import', () => {
		const bad = allSource.filter(p => /from ['"]@\/steps\//.test(read(p)));
		expect(bad.map(rel), 'Import from @/steps barrel, not sub-paths').toStrictEqual([]);
	});

	it('no source file uses a @/interrupters sub-path import', () => {
		const bad = allSource.filter(p => /from ['"]@\/interrupters\//.test(read(p)));
		expect(bad.map(rel), 'Import from @/interrupters barrel, not sub-paths').toStrictEqual([]);
	});

	it('no source file uses a @/analytics sub-path import', () => {
		const bad = allSource.filter(p => /from ['"]@\/analytics\//.test(read(p)));
		expect(bad.map(rel), 'Import from @/analytics barrel, not sub-paths').toStrictEqual([]);
	});

	it('no source file uses a @/components/design-system sub-path import', () => {
		const bad = allSource.filter(p => /from ['"]@\/components\/design-system\//.test(read(p)));
		expect(bad.map(rel), 'Import from @/components/design-system barrel, not sub-paths').toStrictEqual([]);
	});
});
