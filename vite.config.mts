import { cloudflare } from '@cloudflare/vite-plugin';
import { redwood } from 'rwsdk/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const tunnelHost = env.VITE_BASE_URL ? new URL(env.VITE_BASE_URL).host : null;

	return {
		css: {
			modules: {
				localsConvention: 'camelCase',
			},
		},
		plugins: [
			cloudflare({
				viteEnvironment: { name: 'worker' },
			}),
			redwood(),
		],
		server: {
			...(tunnelHost && {
				cors: false,
				allowedHosts: [tunnelHost],
				hmr: {
					host: tunnelHost,
					protocol: 'wss',
				},
			}),
		},
	};
});
