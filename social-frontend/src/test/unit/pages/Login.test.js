import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../../pages/Login';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
    signInWithEmailAndPassword: jest.fn(),
    getAuth: jest.fn(),
}));

jest.mock('../../../firebase', () => ({
    auth: {}
}));

const renderWithRouter = (ui) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Login Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders login form', () => {
        renderWithRouter(<Login />);
        expect(screen.getByLabelText(/Email:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password:/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    test('handles successful login', async () => {
        const mockUser = {
            uid: '123',
            getIdToken: jest.fn().mockResolvedValue('fake-token')
        };
        signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

        const onLoginSuccess = jest.fn();
        renderWithRouter(<Login onLoginSuccess={onLoginSuccess} />);

        fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /Login/i }));

        await waitFor(() => {
            expect(signInWithEmailAndPassword).toHaveBeenCalled();
            expect(onLoginSuccess).toHaveBeenCalled();
            expect(screen.getByText('Login riuscito')).toBeInTheDocument();
        });
    });

    test('handles login error', async () => {
        signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Invalid credentials'));

        renderWithRouter(<Login />);

        fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'wrong-pass' } });
        fireEvent.click(screen.getByRole('button', { name: /Login/i }));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });
});
