//Test per verificare che il modal CreateCommunity funzioni correttamente
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateCommunityModal from '../../../components/CreateCommunityModal';

//Mock del context AuthContext
jest.mock('../../../context/AuthContext', () => ({
    useAuth: jest.fn()
}));

//Import del mock AuthContext dopo il mock
import { useAuth } from '../../../context/AuthContext';

//Mock di fetch globale
global.fetch = jest.fn();

describe('CreateCommunityModal - Rendering', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            currentUser: { uid: 'user123', email: 'test@test.com' }
        });
    });

    //Test: rendering corretto modal con form
    it('dovrebbe renderizzare correttamente il modal', () => {
        const mockOnClose = jest.fn();
        const mockOnSuccess = jest.fn();

        render(<CreateCommunityModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        expect(screen.getByText('Create Community')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. Coffee Lovers')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('What is this community about?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
        expect(screen.getByText('×')).toBeInTheDocument();
    });

    //Test: presenza di tutti i campi
    it('dovrebbe mostrare tutti i campi del form', () => {
        const mockOnClose = jest.fn();

        render(<CreateCommunityModal onClose={mockOnClose} onSuccess={jest.fn()} />);

        const nameInput = screen.getByPlaceholderText('e.g. Coffee Lovers');
        const descriptionTextarea = screen.getByPlaceholderText('What is this community about?');

        expect(nameInput).toBeInTheDocument();
        expect(descriptionTextarea).toBeInTheDocument();
        expect(nameInput).toHaveAttribute('required');
    });
});

describe('CreateCommunityModal - User Interactions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            currentUser: { uid: 'user123', email: 'test@test.com' }
        });
    });

    //Test: cambio valore input name
    it('dovrebbe aggiornare il valore del campo name', () => {
        render(<CreateCommunityModal onClose={jest.fn()} onSuccess={jest.fn()} />);

        const nameInput = screen.getByPlaceholderText('e.g. Coffee Lovers');
        fireEvent.change(nameInput, { target: { value: 'Coffee Enthusiasts' } });

        expect(nameInput.value).toBe('Coffee Enthusiasts');
    });

    //Test: cambio valore textarea description
    it('dovrebbe aggiornare il valore del campo description', () => {
        render(<CreateCommunityModal onClose={jest.fn()} onSuccess={jest.fn()} />);

        const descriptionTextarea = screen.getByPlaceholderText('What is this community about?');
        fireEvent.change(descriptionTextarea, { target: { value: 'A community for coffee lovers' } });

        expect(descriptionTextarea.value).toBe('A community for coffee lovers');
    });

    //Test: click su close button chiama onClose
    it('dovrebbe chiamare onClose quando si clicca il pulsante close', () => {
        const mockOnClose = jest.fn();

        render(<CreateCommunityModal onClose={mockOnClose} onSuccess={jest.fn()} />);

        const closeButton = screen.getByText('×');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    //Test: click sull'overlay chiama onClose
    it('dovrebbe chiamare onClose quando si clicca sull\'overlay', () => {
        const mockOnClose = jest.fn();

        render(<CreateCommunityModal onClose={mockOnClose} onSuccess={jest.fn()} />);

        const overlay = screen.getByText('Create Community').closest('.modal-overlay');
        fireEvent.click(overlay);

        expect(mockOnClose).toHaveBeenCalled();
    });
});

describe('CreateCommunityModal - Form Submission', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            currentUser: { uid: 'user123', email: 'test@test.com' }
        });
    });

    //Test: submit con successo chiama API e callbacks
    it('dovrebbe creare community e chiamare callbacks con successo', async () => {
        const mockOnClose = jest.fn();
        const mockOnSuccess = jest.fn();

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'community123', name: 'Test Community' })
        });

        render(<CreateCommunityModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        const nameInput = screen.getByPlaceholderText('e.g. Coffee Lovers');
        const descriptionTextarea = screen.getByPlaceholderText('What is this community about?');

        fireEvent.change(nameInput, { target: { value: 'Test Community' } });
        fireEvent.change(descriptionTextarea, { target: { value: 'Test Description' } });

        const submitButton = screen.getByRole('button', { name: 'Create' });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3001/api/communities',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Test Community',
                        description: 'Test Description',
                        creatorId: 'user123'
                    })
                })
            );
            expect(mockOnSuccess).toHaveBeenCalledTimes(1);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    //Test: alert se utente non autenticato
    it('dovrebbe mostrare alert se utente non autenticato', async () => {
        useAuth.mockReturnValue({ currentUser: null });

        const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => { });

        render(<CreateCommunityModal onClose={jest.fn()} onSuccess={jest.fn()} />);

        const nameInput = screen.getByPlaceholderText('e.g. Coffee Lovers');
        fireEvent.change(nameInput, { target: { value: 'Test' } });

        const submitButton = screen.getByRole('button', { name: 'Create' });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('You must be logged in.');
        });

        alertMock.mockRestore();
    });

    //Test: gestione errore API (response.ok = false)
    it('dovrebbe mostrare alert in caso di errore API', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Community already exists' })
        });

        const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => { });

        render(<CreateCommunityModal onClose={jest.fn()} onSuccess={jest.fn()} />);

        const nameInput = screen.getByPlaceholderText('e.g. Coffee Lovers');
        fireEvent.change(nameInput, { target: { value: 'Test Community' } });

        const submitButton = screen.getByRole('button', { name: 'Create' });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('Failed: Community already exists');
        });

        alertMock.mockRestore();
    });

    //Test: gestione errore fetch
    it('dovrebbe gestire errori di rete', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => { });

        render(<CreateCommunityModal onClose={jest.fn()} onSuccess={jest.fn()} />);

        const nameInput = screen.getByPlaceholderText('e.g. Coffee Lovers');
        fireEvent.change(nameInput, { target: { value: 'Test Community' } });

        const submitButton = screen.getByRole('button', { name: 'Create' });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('Failed: Network error');
        });

        alertMock.mockRestore();
    });
});

describe('CreateCommunityModal - Loading States', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            currentUser: { uid: 'user123', email: 'test@test.com' }
        });
    });

    //Test: pulsante disabilitato durante loading
    it('dovrebbe disabilitare il pulsante durante il submit', async () => {
        global.fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(<CreateCommunityModal onClose={jest.fn()} onSuccess={jest.fn()} />);

        const nameInput = screen.getByPlaceholderText('e.g. Coffee Lovers');
        fireEvent.change(nameInput, { target: { value: 'Test Community' } });

        const submitButton = screen.getByRole('button', { name: 'Create' });
        fireEvent.click(submitButton);

        // Durante il loading
        await waitFor(() => {
            expect(submitButton).toBeDisabled();
            expect(screen.getByText('Creating...')).toBeInTheDocument();
        });
    });

    //Test: testo "Creating..." durante submit
    it('dovrebbe mostrare "Creating..." durante il caricamento', async () => {
        let resolveFetch;
        global.fetch.mockReturnValue(new Promise(resolve => {
            resolveFetch = resolve;
        }));

        render(<CreateCommunityModal onClose={jest.fn()} onSuccess={jest.fn()} />);

        const nameInput = screen.getByPlaceholderText('e.g. Coffee Lovers');
        fireEvent.change(nameInput, { target: { value: 'Test Community' } });

        const submitButton = screen.getByRole('button', { name: 'Create' });
        fireEvent.click(submitButton);

        // Durante loading
        expect(await screen.findByText('Creating...')).toBeInTheDocument();

        // Completa la promise
        resolveFetch({
            ok: true,
            json: async () => ({ id: 'community123' })
        });

        // Dopo il completamento dovrebbe tornare "Create"
        await waitFor(() => {
            expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
        });
    });
});
