module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Use jsdom for testing React components that interact with the DOM
  moduleNameMapper: {
    // Handle CSS imports (if you import CSS in your components)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    // Handle module path aliases if you have them configured in tsconfig.json
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'], // Optional: for setup files
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/__tests__/e2e/'], // Ignore these directories, including e2e tests
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json', // Ensure ts-jest uses the correct tsconfig
      babelConfig: {
        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
        plugins: ['babel-plugin-transform-import-meta']
      }
    }]
  },
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  // For dealing with browser APIs that don't exist in Jest
  transformIgnorePatterns: [
    'node_modules/(?!(eleven-server|@11labs|elevenlabs-node)/.*)'
  ]
};