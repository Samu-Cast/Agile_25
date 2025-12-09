//Scritte globali per test (comuni a tutti)
beforeAll(() => { //prima di ogni test avvisa
    console.log('Starting BrewHub Backend Tests...');
});

afterAll(() => { //dopo ogni test avvisa
    console.log('Tests completed, showing results...');
});

// Optional: Set timeout for all tests
jest.setTimeout(10000); //10 seconds
