//File di configurazione globale per tutti i test del frontend
//Viene eseguito automaticamente prima di ogni test

//Importa le funzioni per verificare che gli elementi HTML siano corretti
import '@testing-library/jest-dom';

//Imposta l'indirizzo del server backend per i test
process.env.REACT_APP_API_URL = 'http://localhost:3001/api';

//Crea versioni finte di fetch e alert per i test
global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: async () => []
}));

//Salva il console.error originale
const originalError = console.error;

//Eseguito una volta all'inizio di tutti i test
beforeAll(() => {
    console.log('Starting BrewHub Frontend Tests...');

    // Silenzia console.error durante i test per output pulito
    // I test di gestione errori funzionano comunque!
    console.error = jest.fn();

    //uppress React Router v7 future flag warnings
    const originalWarn = console.warn;
    console.warn = (msg, ...args) => {
        if (msg && msg.includes && msg.includes("React Router Future Flag Warning")) {
            return;
        }
        originalWarn(msg, ...args);
    };
});

//Eseguito una volta alla fine di tutti i test
afterAll(() => {
    console.log('Frontend tests completed!');

    // Ripristina console.error originale
    console.error = originalError;
});

//Eseguito prima di ogni singolo test per pulire i dati precedenti
beforeEach(() => {
    jest.clearAllMocks();
});
