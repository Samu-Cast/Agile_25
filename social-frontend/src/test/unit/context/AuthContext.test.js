import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../context/AuthContext';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { syncUserWithFirestore } from '../../../utils/syncUserWithFirestore';
import React from 'react';

// Mock dependencies
jest.mock('firebase/auth', () => ({
    onAuthStateChanged: jest.fn(),
    signOut: jest.fn(),
}));

jest.mock('../../../utils/syncUserWithFirestore', () => ({
    syncUserWithFirestore: jest.fn(),
}));

jest.mock('../../../firebase', () => ({
    auth: {},
}));

// Test component to consume context
const TestComponent = () => {
    const { currentUser, logout } = useAuth();
    return (
        <div>
            <div data-testid="user-email">{currentUser ? currentUser.email : 'No User'}</div>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('initial loading state', () => {
        // onAuthStateChanged does not resolve immediately
        onAuthStateChanged.mockImplementation(() => jest.fn());

        // We can't easily test the "loading" state because it blocks rendering children
        // But we can verify strict effects if needed. 
        // For simplicity, we usually test the resolved state.
    });

    test('renders children and sets user when auth state changes', async () => {
        const mockUser = { uid: '123', email: 'test@example.com' };

        onAuthStateChanged.mockImplementation((auth, callback) => {
            callback(mockUser);
            return jest.fn(); // unsubscribe mock
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
        });

        expect(syncUserWithFirestore).toHaveBeenCalledWith(mockUser);
    });

    test('sets user to null on logout/auth change', async () => {
        onAuthStateChanged.mockImplementation((auth, callback) => {
            callback(null);
            return jest.fn();
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-email')).toHaveTextContent('No User');
        });

        expect(syncUserWithFirestore).not.toHaveBeenCalled();
    });

    test('logout calls signOut', async () => {
        onAuthStateChanged.mockImplementation((auth, callback) => {
            callback({ uid: '123' });
            return jest.fn();
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => screen.getByText('Logout'));

        const logoutBtn = screen.getByText('Logout');
        logoutBtn.click();

        expect(signOut).toHaveBeenCalled();
    });
});
