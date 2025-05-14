module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {

    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',

    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',

    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/__tests__/e2e/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      babelConfig: {
        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
        plugins: ['babel-plugin-transform-import-meta']
      }
    }]
  },

  clearMocks: true,

  coverageDirectory: "coverage",

  transformIgnorePatterns: [
    'node_modules/(?!(eleven-server|@11labs|elevenlabs-node)/.*)'
  ]
};