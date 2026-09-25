import { except, render, route } from 'rwsdk/router';
import { type DefaultAppContext, defineApp, type RequestInfo } from 'rwsdk/worker';

import AppDocument from '@/documents/app';
import Pages__root from '@/pages/root';
import Pages__not_found from './pages/not-found';
import { handlePageError } from './worker-error';

export default defineApp([
	render(AppDocument, [
		except<RequestInfo<DefaultAppContext>>(handlePageError),
		route('/', Pages__root),
		route('*', Pages__not_found),
	]),
]);
