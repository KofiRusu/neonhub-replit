/**
 * Jest setup file for NeonHub testing
 */

// Import Jest DOM extensions
import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
})

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: jest.fn(() => ({
    getPropertyValue: jest.fn(() => ''),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
  get key() { return null },
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
})

// Mock fetch
global.fetch = jest.fn()

// Setup test environment
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
})

Object.defineProperty(window, 'scrollBy', {
  value: jest.fn(),
})

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Global test utilities
global.testUtils = {
  // Wait for next tick
  waitForNextTick: () => new Promise(resolve => {
    setTimeout(resolve, 0)
  }),
  
  // Wait for a specific time
  wait: (ms) => new Promise(resolve => {
    setTimeout(resolve, ms)
  }),
  
  // Create a mock event
  createEvent: (type, data = {}) => {
    const event = new Event(type)
    Object.assign(event, data)
    return event
  },
  
  // Create a mock DOM element
  createElement: (tag, props = {}) => {
    const element = document.createElement(tag)
    Object.assign(element, props)
    return element
  },
  
  // Fire a DOM event
  fireEvent: (element, eventType, eventData = {}) => {
    const event = global.testUtils.createEvent(eventType, eventData)
    element.dispatchEvent(event)
  },
  
  // Mock API responses
  mockApiResponse: (data, options = {}) => ({
    success: true,
    data,
    message: 'Success',
    ...options,
  }),
  
  mockApiError: (message, code = 'ERROR', statusCode = 400) => ({
    success: false,
    error: message,
    code,
    statusCode,
  }),
}

// Suppress console warnings in tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
})