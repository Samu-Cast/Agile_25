module.exports = {
    testEnvironment: 'node', //in ambiente node non nel browser
    coverageDirectory: 'coverage', //salva report in coverage
    collectCoverageFrom: [ //file da misurare (non testare)
        'src/**/*.js',
        '!src/server.js',
        '!src/seeder.js'
    ],
    testMatch: [ //quali test eseguire
        '**/tests/**/*.test.js'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'] //dove cercare i test
};