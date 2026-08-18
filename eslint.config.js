import shared from '@textmode/lint';
import importPlugin from 'eslint-plugin-import';

const architectureZones = [
	// core should stay independent from concrete runner implementations
	{ target: './apps/runner/src/core', from: './apps/runner/src/engines/textmode' },
];

export default [
	{
		ignores: ['**/dist/**', '**/api/**', '**/coverage/**', '**/node_modules/**'],
	},
	...shared.map((config) => {
		if (config.files) {
			return {
				...config,
				files: ['**/*.{ts,js}'],
			};
		}
		return config;
	}),
	{
		files: ['**/*.{ts,js}'],
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
