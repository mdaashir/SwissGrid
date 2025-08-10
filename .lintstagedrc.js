module.exports = {
    'client/src/**/*.{ts,tsx}': () => [
        'npm run lint:fix:client',
        'npm run format:client',
    ],
    'server/src/**/*.{js,ts}': () => [
        'npm run lint:fix:server',
        'npm run format:server',
    ],
    '*.{json,md,yml,yaml}': ['prettier --write'],
};
