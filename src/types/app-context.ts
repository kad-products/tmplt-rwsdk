import type { KADLogger } from './kad-logger';

// import type { Permission } from './permissions';
// import type { Session } from './sessions';
// import type { UserDBRead } from './users';

type PlaceholderUser = {
	username: string;
};

export interface AppContext {
	user?: PlaceholderUser | undefined;
	// session?: Session | null;
	// permissions: Permission[];
	logger: KADLogger;
}
