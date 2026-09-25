import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		exclude: ['**/*.ct.test.tsx', '**/*.workers.test.ts', '**/node_modules/**'],
		coverage: {
			provider: 'v8', // or 'istanbul'
			reporter: ['text', 'json-summary', 'html'],
			exclude: ['**/*.md', '**/__tests__/**', '**/*.test.ts', '**/*.integration.test.ts'],
			thresholds: {
				branches: 30,
				lines: 30, // using this to make sure we don't miss something big or have dead code
				'src/actions/**': {
					branches: 100,
				},
				'src/classes/**': {
					branches: 100,
				},
				'src/durable-objects/**': {
					branches: 100,
				},
				'src/hooks/**': {
					branches: 100,
				},
				'src/interrupters/**': {
					branches: 100,
				},
				'src/middleware/**': {
					branches: 100,
				},
				'src/models/**': {
					branches: 100,
				},
				'src/repositories/**': {
					branches: 100,
				},
				'src/schemas/**': {
					branches: 100,
				},
			},
		},
		alias: {
			'rwsdk/client': path.resolve(__dirname, 'tests/mocks/rwsdk-client.ts'),
			'@': path.resolve(__dirname, './src'),
		},
	},
});
