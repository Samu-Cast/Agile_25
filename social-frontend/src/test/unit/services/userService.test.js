//Test per verificare che le operazioni sugli utenti funzionino correttamente
//Importa le funzioni da testare dal file userService
import { getUser, searchUsers, updateUserProfile, getUsersByUids } from '../../../services/userService';

//Crea una versione finta di fetch per simulare le chiamate al server
global.fetch = jest.fn();

//Gruppo di test per la funzione getUser
describe('userService - getUser', () => {
    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che il recupero dei dati utente funzioni correttamente
    it('dovrebbe recuperare utente per UID', async () => {
        //Dati finti dell'utente ritornati dal server
        const mockUser = { uid: 'user123', name: 'Mario Rossi', email: 'mario@test.com' };
        //Configura fetch per ritornare una risposta positiva
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockUser
        });

        //Chiama la funzione getUser con l'ID utente
        const result = await getUser('user123');

        //Verifica che fetch sia stato chiamato con l'URL corretto
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/users/user123');
        //Verifica che la funzione ritorni i dati dell'utente
        expect(result).toEqual(mockUser);
    });

    //Test: verifica che un utente non trovato venga gestito correttamente
    it('dovrebbe gestire utente non trovato', async () => {
        //Configura fetch per ritornare una risposta di errore
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 404
        });

        //Chiama la funzione getUser con un ID inesistente
        const result = await getUser('nonexistent');
        //Verifica che la funzione ritorni null quando l'utente non esiste
        expect(result).toBeNull();
    });
});

//Gruppo di test per la funzione searchUsers
describe('userService - searchUsers', () => {
    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che la ricerca utenti funzioni correttamente
    it('dovrebbe cercare utenti per query', async () => {
        //Lista finta di utenti trovati dal server
        const mockUsers = [
            { uid: 'user1', name: 'Mario', role: 'Barista' },
            { uid: 'user2', name: 'Maria', role: 'Barista' }
        ];
        //Configura fetch per ritornare la lista di utenti
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockUsers
        });

        //Chiama la funzione searchUsers con una query e un ruolo
        const result = await searchUsers('Mar', 'Barista');

        //Verifica che fetch sia stato chiamato con l'URL corretto
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/users/search?q=Mar&role=Barista'
        );
        //Verifica che la funzione ritorni la lista di utenti trovati
        expect(result).toEqual(mockUsers);
        //Verifica che ci siano 2 utenti nella lista
        expect(result.length).toBe(2);
    });

    //Test: verifica che la ricerca senza filtro ruolo funzioni correttamente
    it('dovrebbe cercare senza filtro role', async () => {
        //Configura fetch per ritornare una lista vuota
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        //Chiama la funzione searchUsers solo con la query (senza ruolo)
        await searchUsers('test');

        //Verifica che fetch sia stato chiamato senza il parametro role
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/users/search?q=test'
        );
    });
});

//Gruppo di test per la funzione updateUserProfile
describe('userService - updateUserProfile', () => {
    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che l'aggiornamento del profilo funzioni correttamente
    it('dovrebbe aggiornare profilo utente', async () => {
        //Configura fetch per ritornare una risposta positiva
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Profile updated' })
        });

        //Dati da aggiornare nel profilo
        const updates = { name: 'Mario Rossi', bio: 'Coffee lover' };
        //Chiama la funzione updateUserProfile
        await updateUserProfile('user123', updates);

        //Verifica che fetch sia stato chiamato con i dati corretti
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/users/user123',
            expect.objectContaining({
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
        );
    });

    //Test: verifica che gli errori di aggiornamento vengano gestiti correttamente
    it('dovrebbe gestire errore di aggiornamento', async () => {
        //Configura fetch per ritornare una risposta di errore
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 400
        });

        //Verifica che la funzione lanci un errore quando l'aggiornamento fallisce
        await expect(updateUserProfile('user123', {})).rejects.toThrow();
    });
});

//Gruppo di test per la funzione getUsersByUids
describe('userService - getUsersByUids', () => {
    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che il recupero di più utenti funzioni correttamente
    it('dovrebbe recuperare più utenti per UIDs', async () => {
        //Lista finta di utenti ritornata dal server
        const mockUsers = [
            { uid: 'user1', name: 'User 1' },
            { uid: 'user2', name: 'User 2' }
        ];
        //Configura fetch per ritornare la lista di utenti
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockUsers
        });

        //Chiama la funzione getUsersByUids con una lista di ID utente
        const result = await getUsersByUids(['user1', 'user2']);

        //Verifica che fetch sia stato chiamato con i dati corretti
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/users/batch',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ uids: ['user1', 'user2'] })
            })
        );
        //Verifica che la funzione ritorni la lista di utenti
        expect(result).toEqual(mockUsers);
    });

    //Test: verifica che una lista vuota venga gestita correttamente
    it('dovrebbe gestire array vuoto', async () => {
        //Configura fetch per ritornare una lista vuota
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        //Chiama la funzione getUsersByUids con una lista vuota
        const result = await getUsersByUids([]);
        //Verifica che la funzione ritorni una lista vuota
        expect(result).toEqual([]);
    });
});
