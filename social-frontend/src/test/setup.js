//Setup globale per test frontend
beforeAll(() => {
    console.log('Starting BrewHub Frontend Tests...');
});

afterAll(() => {
    console.log('Frontend tests completed!');
});

// Set timeout for all tests
jest.setTimeout(10000); // 10 seconds

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:3001/api';
