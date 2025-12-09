//File di configurazione globale per tutti i test del frontend
//Viene eseguito automaticamente prima di ogni test

//Importa le funzioni per verificare che gli elementi HTML siano corretti
import '@testing-library/jest-dom';

//Imposta l'indirizzo del server backend per i test
process.env.REACT_APP_API_URL = 'http://localhost:3001/api';

//Crea versioni finte di fetch e alert per i test
global.fetch = jest.fn();
global.alert = jest.fn();

//Eseguito una volta all'inizio di tutti i test
beforeAll(() => {
    console.log('Starting BrewHub Frontend Tests...');
});

//Eseguito una volta alla fine di tutti i test
afterAll(() => {
    console.log('Frontend tests completed!');
});

//Eseguito prima di ogni singolo test per pulire i dati precedenti
beforeEach(() => {
    jest.clearAllMocks();
});
