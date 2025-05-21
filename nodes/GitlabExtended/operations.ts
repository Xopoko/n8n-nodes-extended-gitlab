export const branchOperations = {
	create: { name: 'Create', value: 'create', action: 'Create a branch' },
	delete: { name: 'Delete', value: 'delete', action: 'Delete a branch' },
	get: { name: 'Get', value: 'get', action: 'Get a branch' },
	getAll: { name: 'Get Many', value: 'getAll', action: 'List branches' },
	merge: { name: 'Merge', value: 'merge', action: 'Merge a branch' },
	protect: { name: 'Protect', value: 'protect', action: 'Protect a branch' },
	rename: { name: 'Rename', value: 'rename', action: 'Rename a branch' },
	unprotect: { name: 'Unprotect', value: 'unprotect', action: 'Unprotect a branch' },
} as const;

export type BranchOperation = keyof typeof branchOperations;
