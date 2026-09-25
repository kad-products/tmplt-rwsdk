import type { RequestInfo } from 'rwsdk/worker';
import { DefaultLayout } from '@/layouts';

export default async function Pages__root({ ctx }: RequestInfo): Promise<React.JSX.Element> {
	const isLoggedIn = !!ctx.user;

	return (
		<DefaultLayout pageTitle="Welcome" currentBasePage="home">
			<p>
				This is a template repo and not intended to be run for any real purpose. If you're seeing this probably it is not what you
				intended to see.
			</p>

			{isLoggedIn && <div>Welcome {JSON.stringify(ctx.user)}</div>}
		</DefaultLayout>
	);
}
