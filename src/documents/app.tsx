import type { DocumentProps } from 'rwsdk/router';
import type { RequestInfo } from 'rwsdk/worker';
import styles from '../styles/main.css?url';

const cfBeaconToken: string | undefined = import.meta.env.VITE_CF_BEACON_TOKEN;

const AppDocument: React.FC<DocumentProps<RequestInfo>> = ({ children }: DocumentProps<RequestInfo>) => (
	<html lang="en">
		<head>
			<meta charSet="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<title>KAD RWSDK Template</title>
			<link rel="modulepreload" href="/src/client.tsx" />
			<link rel="stylesheet" href={styles} />
			{cfBeaconToken && (
				<script
					defer
					src="https://static.cloudflareinsights.com/beacon.min.js"
					data-cf-beacon={`{"token": "${cfBeaconToken}"}`}
				/>
			)}
		</head>
		<body className="dark">
			<div id="root">{children}</div>
			<script>import("/src/client.tsx")</script>
		</body>
	</html>
);

export default AppDocument;
