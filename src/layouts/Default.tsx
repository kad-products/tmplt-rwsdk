import classNames from 'classnames';
import { StrictMode } from 'react';

export function DefaultLayout({
	children,
	currentBasePage,
	pageTitle,
}: {
	children: React.ReactNode;
	currentBasePage: string | undefined;
	pageTitle: string;
}): React.ReactNode {
	return (
		<StrictMode>
			<header className="default-header">
				<h1 className="welcome-title">KAD RWSDK Template</h1>
				<nav className="main-nav">
					<a
						className={classNames({
							'nav-item': true,
							'nav-item-active': currentBasePage === 'home',
						})}
						href="/"
					>
						<span className="nav-item-icon">🏡</span>
						<span className="nav-item-label">Home</span>
					</a>
					<a
						className={classNames({
							'nav-item': true,
							'nav-item-active': currentBasePage === 'about',
						})}
						href="/about"
					>
						<span className="nav-item-icon">🎉</span>
						<span className="nav-item-label">About</span>
					</a>
				</nav>
			</header>
			<main>
				<h2 className="page-title">{pageTitle}</h2>
				<div className="app-layout-inner">
					<div className="app-layout-content">{children}</div>
				</div>
			</main>
		</StrictMode>
	);
}
