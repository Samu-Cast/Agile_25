import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPassword from '../../../pages/ForgotPassword';
import { MemoryRouter } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';

jest.mock('../../../firebase', () => ({
    auth: { fake: 'auth' }
}));

jest.mock('firebase/auth', () => ({
    sendPasswordResetEmail: jest.fn()
}));

describe('ForgotPassword', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the component', () => {
        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );
        expect(screen.getByText('Password Dimenticata?')).toBeInTheDocument();
    });

    //test per errore se non è stata scritta la mail
    it('shows error message when email is empty', async () => {
        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        const submitButton = screen.getByText('Invia Link');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Inserisci la tua email per resettare la password')).toBeInTheDocument();
        });
    });

    //test per verificare che la mail sia inviata
    it('calls sendPasswordResetEmail with the correct email', async () => {
        sendPasswordResetEmail.mockResolvedValue();

        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        const emailInput = screen.getByPlaceholderText('esempio@email.com');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        const submitButton = screen.getByText('Invia Link');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(sendPasswordResetEmail).toHaveBeenCalled();
        });
    });

    //test per verificare se si è creato un errore nell'invio della mail
    it('shows error message when sendPasswordResetEmail fails', async () => {
        sendPasswordResetEmail.mockRejectedValue(new Error('Firebase error'));

        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );
        const emailInput = screen.getByPlaceholderText('esempio@email.com');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        const submitButton = screen.getByText('Invia Link');
        fireEvent.click(submitButton);
        await waitFor(() => {
            expect(screen.getByText("Errore durante l'invio dell'email: Firebase error")).toBeInTheDocument();
        });
    });
});