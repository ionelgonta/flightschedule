// Jest setup file for persistent flight system tests

// Mock Next.js environment variables
process.env.NODE_ENV = 'test'

// Mock file system operations for testing
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
  unlink: jest.fn(),
  rm: jest.fn(),
  copyFile: jest.fn()
}))

// Mock path operations
jest.mock('path', () => ({
  join: (...args) => args.join('/'),
  dirname: (p) => p.split('/').slice(0, -1).join('/'),
  resolve: (...args) => args.join('/')
}))

// Increase timeout for property-based tests
jest.setTimeout(30000)

// Global test setup
beforeAll(() => {
  console.log('Starting Persistent Flight System tests...')
})

afterAll(() => {
  console.log('Persistent Flight System tests completed.')
})