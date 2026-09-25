/**
 * Builds a human-readable error message that walks the full cause chain.
 * Use this in client-facing error responses in non-production environments
 * so that underlying SQLite / Drizzle errors are visible.
 */
export function buildDevErrorMessage(err: unknown): string {
	if (!(err instanceof Error)) return String(err);
	const parts: string[] = [err.message];
	let cause: unknown = err.cause;
	while (cause instanceof Error) {
		parts.push(cause.message);
		cause = cause.cause;
	}
	if (cause !== undefined) {
		parts.push(String(cause));
	}
	return parts.join(' → ');
}
