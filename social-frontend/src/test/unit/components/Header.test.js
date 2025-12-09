//Test per verificare che il componente Header (barra di navigazione) funzioni correttamente
//Importa React per creare componenti
import React from 'react';
//Importa le funzioni per testare i componenti React
import { render, screen, fireEvent } from '@testing-library/react';
//Importa il componente Header da testare
import Header from '../../../components/Header';

//Il mock di react-router-dom è in src/__mocks__/react-router-dom.js
//Jest lo usa automaticamente senza bisogno di configurazione qui

//Gruppo di test per il componente Header
describe('Header Component', () => {
    //Proprietà di default da passare al componente Header in ogni test
    const defaultProps = {
        onLoginClick: jest.fn(), //Funzione finta per il click su Login
        onLogoutClick: jest.fn(), //Funzione finta per il click su Logout
        showProfile: false, //Non mostrare il link al profilo
        isLoggedIn: false //Utente non loggato
    };

    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che il logo BrewHub venga mostrato
    it('dovrebbe renderizzare logo BrewHub', () => {
        //Mostra il componente Header con le proprietà di default
        render(<Header {...defaultProps} />);
        //Verifica che il testo "BrewHub" sia presente nella pagina
        expect(screen.getByText('BrewHub')).toBeInTheDocument();
    });

    //Test: verifica che il bottone Login venga mostrato quando l'utente non è loggato
    it('dovrebbe mostrare bottone Login quando non loggato', () => {
        //Mostra il componente Header con utente non loggato
        render(<Header {...defaultProps} isLoggedIn={false} />);
        //Verifica che il bottone "Log In" sia presente
        expect(screen.getByText('Log In')).toBeInTheDocument();
        //Verifica che il bottone "Log Out" NON sia presente
        expect(screen.queryByText('Log Out')).not.toBeInTheDocument();
    });

    //Test: verifica che il bottone Logout venga mostrato quando l'utente è loggato
    it('dovrebbe mostrare bottone Logout quando loggato', () => {
        //Mostra il componente Header con utente loggato
        render(<Header {...defaultProps} isLoggedIn={true} />);
        //Verifica che il bottone "Log Out" sia presente
        expect(screen.getByText('Log Out')).toBeInTheDocument();
        //Verifica che il bottone "Log In" NON sia presente
        expect(screen.queryByText('Log In')).not.toBeInTheDocument();
    });

    //Test: verifica che cliccando Login venga chiamata la funzione corretta
    it('dovrebbe chiamare onLoginClick quando si clicca Login', () => {
        //Crea una funzione finta per tracciare i click
        const mockOnLoginClick = jest.fn();
        //Mostra il componente Header con la funzione finta
        render(<Header {...defaultProps} onLoginClick={mockOnLoginClick} isLoggedIn={false} />);

        //Simula un click sul bottone "Log In"
        fireEvent.click(screen.getByText('Log In'));
        //Verifica che la funzione onLoginClick sia stata chiamata esattamente 1 volta
        expect(mockOnLoginClick).toHaveBeenCalledTimes(1);
    });

    //Test: verifica che cliccando Logout venga chiamata la funzione corretta
    it('dovrebbe chiamare onLogoutClick quando si clicca Logout', () => {
        //Crea una funzione finta per tracciare i click
        const mockOnLogoutClick = jest.fn();
        //Mostra il componente Header con la funzione finta
        render(<Header {...defaultProps} onLogoutClick={mockOnLogoutClick} isLoggedIn={true} />);

        //Simula un click sul bottone "Log Out"
        fireEvent.click(screen.getByText('Log Out'));
        //Verifica che la funzione onLogoutClick sia stata chiamata esattamente 1 volta
        expect(mockOnLogoutClick).toHaveBeenCalledTimes(1);
    });

    //Test: verifica che il link al profilo venga mostrato quando richiesto
    it('dovrebbe mostrare link profilo quando showProfile è true', () => {
        //Mostra il componente Header con link profilo abilitato
        render(<Header {...defaultProps} isLoggedIn={true} showProfile={true} currentUser={{ uid: 'test-user', photoURL: null }} />);
        //Trova il link al profilo usando l'etichetta "Profile"
        const profileLink = screen.getByLabelText('Profile');
        //Verifica che il link sia presente
        expect(profileLink).toBeInTheDocument();
        //Verifica che il link punti alla pagina /profile
        expect(profileLink).toHaveAttribute('href', '/profile');
    });

    //Test: verifica che il link al profilo NON venga mostrato quando non richiesto
    it('non dovrebbe mostrare link profilo quando showProfile è false', () => {
        //Mostra il componente Header con link profilo disabilitato
        render(<Header {...defaultProps} isLoggedIn={true} showProfile={false} />);
        //Verifica che il link al profilo NON sia presente
        expect(screen.queryByLabelText('Profile')).not.toBeInTheDocument();
    });

    //Test: verifica che la barra di ricerca venga mostrata di default
    it('dovrebbe mostrare search bar di default', () => {
        //Mostra il componente Header con le proprietà di default
        render(<Header {...defaultProps} />);
        //Verifica che la barra di ricerca con il placeholder corretto sia presente
        expect(screen.getByPlaceholderText('Search BrewHub...')).toBeInTheDocument();
    });
});
