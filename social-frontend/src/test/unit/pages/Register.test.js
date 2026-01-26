import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '../../../pages/Register';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { createUserProfile, createRoleProfile } from '../../../services/userService';
import React from 'react';

// Mock Firebase
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
}));

jest.mock('../../../firebase', () => ({
    auth: {}
}));

// Mock Services
jest.mock('../../../services/userService', () => ({
    createUserProfile: jest.fn(),
    createRoleProfile: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({
        // Register.js uses useAuth but doesn't seem to destruct anything critical for these tests
        // or updateProfile might be used in some version, but we just provide a default mock
    }),
}));

describe('Register Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders register form correctly', () => {
        render(<Register />);
        expect(screen.getByText(/Crea Account/i)).toBeInTheDocument();
        expect(screen.getByText(/Tipo di Account:/i)).toBeInTheDocument();
        expect(screen.getByLabelText('Nome:')).toBeInTheDocument();
        expect(screen.getByLabelText('Cognome:')).toBeInTheDocument();
        expect(screen.getByLabelText('Email:')).toBeInTheDocument();
        expect(screen.getByLabelText('Password:')).toBeInTheDocument();
    });

    test('changes form fields based on role selection', () => {
        render(<Register />);

        // Default is Appassionato (Nome/Cognome)
        expect(screen.getByLabelText('Nome:')).toBeInTheDocument();

        // Change to Torrefazione
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Torrefazione' } });

        expect(screen.queryByLabelText('Nome:')).not.toBeInTheDocument(); // First name shouldn't be main field
        expect(screen.getByLabelText('Nome Torrefazione:')).toBeInTheDocument();
        expect(screen.getByLabelText('Città:')).toBeInTheDocument();
    });

    test('handles successful registration for Appassionato', async () => {
        const mockUser = { uid: 'user123', getIdToken: jest.fn().mockResolvedValue('token123') };
        createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
        createUserProfile.mockResolvedValueOnce();

        const onLoginSuccess = jest.fn();

        render(<Register onLoginSuccess={onLoginSuccess} />);

        fireEvent.change(screen.getByLabelText('Nome:'), { target: { value: 'Mario' } });
        fireEvent.change(screen.getByLabelText('Cognome:'), { target: { value: 'Rossi' } });
        fireEvent.change(screen.getByLabelText('Email:'), { target: { value: 'mario@test.com' } });
        fireEvent.change(screen.getByLabelText('Password:'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Registrati/i }));

        await waitFor(() => {
            expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'mario@test.com', 'password123');
            expect(createUserProfile).toHaveBeenCalledWith('user123', expect.objectContaining({
                name: 'Mario Rossi',
                role: 'Appassionato',
                email: 'mario@test.com'
            }));
            expect(onLoginSuccess).toHaveBeenCalled();
        });
    });

    test('handles successful registration for Torrefazione', async () => {
        const mockUser = { uid: 'roaster123', getIdToken: jest.fn().mockResolvedValue('token123') };
        createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
        createUserProfile.mockResolvedValueOnce();
        createRoleProfile.mockResolvedValueOnce();

        render(<Register />);

        // Switch role - using combobox since there is a select
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Torrefazione' } });

        fireEvent.change(screen.getByLabelText('Nome Torrefazione:'), { target: { value: 'Best Roast' } });
        fireEvent.change(screen.getByLabelText('Città:'), { target: { value: 'Milan' } });
        fireEvent.change(screen.getByLabelText('Email:'), { target: { value: 'roast@test.com' } });
        fireEvent.change(screen.getByLabelText('Password:'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Registrati/i }));

        await waitFor(() => {
            expect(createUserProfile).toHaveBeenCalledWith('roaster123', expect.objectContaining({
                name: 'Best Roast',
                role: 'Torrefazione'
            }));
            expect(createRoleProfile).toHaveBeenCalledWith('roasters', expect.objectContaining({
                name: 'Best Roast',
                city: 'Milan'
            }));
        });
    });

    test('displays error message on failure', async () => {
        createUserWithEmailAndPassword.mockRejectedValueOnce(new Error('Email already in use'));

        render(<Register />);

        fireEvent.change(screen.getByLabelText('Nome:'), { target: { value: 'Mario' } });
        fireEvent.change(screen.getByLabelText('Cognome:'), { target: { value: 'Rossi' } });
        fireEvent.change(screen.getByLabelText('Email:'), { target: { value: 'existing@test.com' } });
        fireEvent.change(screen.getByLabelText('Password:'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Registrati/i }));

        await waitFor(() => {
            expect(screen.getByText('Email already in use')).toBeInTheDocument();
        });
    });
});
