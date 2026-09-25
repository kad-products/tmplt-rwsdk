import { pages } from '@kad-products/shed/rwsdk/server';
import { except, render, route } from 'rwsdk/router';
import { type DefaultAppContext, defineApp, type RequestInfo } from 'rwsdk/worker';
import AppDocument from '@/documents/app';
import Pages__root from '@/pages/root';
import Pages__not_found from './pages/not-found';

export default defineApp([
	render(AppDocument, [
		except<RequestInfo<DefaultAppContext>>(pages.handlePageError),
		route('/', Pages__root),
		route('*', Pages__not_found),
	]),
]);
