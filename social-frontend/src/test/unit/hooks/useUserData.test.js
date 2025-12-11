//Test per verificare che il caricamento dei dati utente funzioni correttamente
//Importa le funzioni per testare i componenti React
import { renderHook, waitFor } from '@testing-library/react';
//Importa i custom hooks da testare
import { useUserData, useRoleData } from '../../../hooks/useUserData';
//Importa le funzioni che i hooks utilizzano
import { getUser, getRoleProfile } from '../../../services/userService';

//Crea versioni finte delle funzioni del servizio utente
jest.mock('../../../services/userService');

//Crea una versione finta del contesto di autenticazione
jest.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({ currentUser: { uid: 'user123' } })
}));

//Gruppo di test per il hook useUserData
describe('useUserData', () => {
    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che i dati utente vengano caricati correttamente
    it('dovrebbe caricare dati utente', async () => {
        //Dati finti dell'utente
        const mockUser = { uid: 'user123', name: 'Mario', role: 'Appassionato' };
        //Configura getUser per ritornare i dati finti
        getUser.mockResolvedValue(mockUser);

        //Esegue il hook useUserData
        const { result } = renderHook(() => useUserData());

        //Aspetta che il hook finisca di caricare i dati
        await waitFor(() => {
            //Verifica che il hook ritorni i dati dell'utente
            expect(result.current).toEqual(mockUser);
        });

        //Verifica che getUser sia stato chiamato con l'ID utente corretto
        expect(getUser).toHaveBeenCalledWith('user123');
    });

    //Test: verifica che il hook gestisca correttamente l'assenza di utente loggato
    it('dovrebbe restituire null se non c\'è currentUser', async () => {
    });
});

//Gruppo di test per il hook useRoleData
describe('useRoleData', () => {
    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che i dati specifici del ruolo Bar vengano caricati
    it('dovrebbe caricare dati role per Bar', async () => {
        //Dati finti dell'utente con ruolo Bar
        const mockUser = { uid: 'bar123', role: 'Bar' };
        //Dati finti specifici del Bar
        const mockRoleData = { id: 'bar123', city: 'Roma', baristas: [] };
        //Configura getRoleProfile per ritornare i dati finti
        getRoleProfile.mockResolvedValue(mockRoleData);

        //Esegue il hook useRoleData con l'utente Bar
        const { result } = renderHook(() => useRoleData(mockUser));

        //Aspetta che il hook finisca di caricare i dati
        await waitFor(() => {
            //Verifica che il hook ritorni i dati specifici del Bar
            expect(result.current).toEqual(mockRoleData);
        });

        //Verifica che getRoleProfile sia stato chiamato con i parametri corretti
        expect(getRoleProfile).toHaveBeenCalledWith('bars', 'bar123');
    });

    //Test: verifica che per un Appassionato non vengano caricati dati extra
    it('dovrebbe restituire null per Appassionato', () => {
        //Dati finti dell'utente con ruolo Appassionato
        const mockUser = { uid: 'user123', role: 'Appassionato' };
        //Esegue il hook useRoleData con l'utente Appassionato
        const { result } = renderHook(() => useRoleData(mockUser));

        //Verifica che il hook ritorni null (Appassionato non ha dati extra)
        expect(result.current).toBeNull();
        //Verifica che getRoleProfile non sia stato chiamato
        expect(getRoleProfile).not.toHaveBeenCalled();
    });

    //Test: verifica che i dati specifici del ruolo Torrefazione vengano caricati
    it('dovrebbe caricare dati role per Torrefazione', async () => {
        //Dati finti dell'utente con ruolo Torrefazione
        const mockUser = { uid: 'roastery123', role: 'Torrefazione' };
        //Dati finti specifici della Torrefazione
        const mockRoleData = { id: 'roastery123', city: 'Milano' };
        //Configura getRoleProfile per ritornare i dati finti
        getRoleProfile.mockResolvedValue(mockRoleData);

        //Esegue il hook useRoleData con l'utente Torrefazione
        const { result } = renderHook(() => useRoleData(mockUser));

        //Aspetta che il hook finisca di caricare i dati
        await waitFor(() => {
            //Verifica che il hook ritorni i dati specifici della Torrefazione
            expect(result.current).toEqual(mockRoleData);
        });

        //Verifica che getRoleProfile sia stato chiamato con i parametri corretti
        expect(getRoleProfile).toHaveBeenCalledWith('roasters', 'roastery123');
    });
});
