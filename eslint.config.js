import shared from '@textmode/lint';
import importPlugin from 'eslint-plugin-import';

const architectureZones = [
	// core should stay independent from concrete runner implementations
	{ target: './apps/runner/src/core', from: './apps/runner/src/engines/textmode' },
];

export default [
	...shared,
	{
		plugins: { import: importPlugin },
		rules: {
			'import/no-restricted-paths': [
				'error',
				{
					zones: architectureZones,
				},
			],
		},
	},
];
