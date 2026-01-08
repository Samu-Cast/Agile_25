import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App, { AppContent } from '../../App';

// Mock all major components
jest.mock('../../components/Header', () => {
    return function MockHeader({ onLoginClick, onLogoutClick, onCreatePostClick, isLoggedIn }) {
        return (
            <div data-testid="header">
                <button onClick={onLoginClick}>Login</button>
                <button onClick={onLogoutClick}>Logout</button>
                <button onClick={onCreatePostClick}>Create Post</button>
                <span>{isLoggedIn ? 'Logged In' : 'Logged Out'}</span>
            </div>
        );
    };
});

jest.mock('../../components/AuthModal', () => {
    return function MockAuthModal({ mode, onClose, onLoginSuccess }) {
        return (
            <div data-testid="auth-modal">
                <span>Auth Modal - {mode}</span>
                <button onClick={onClose}>Close</button>
                <button onClick={onLoginSuccess}>Login Success</button>
            </div>
        );
    };
});

jest.mock('../../components/CreatePostModal', () => {
    return function MockCreatePostModal({ onClose, onSuccess }) {
        return (
            <div data-testid="create-post-modal">
                <span>Create Post Modal</span>
                <button onClick={onClose}>Close</button>
                <button onClick={onSuccess}>Success</button>
            </div>
        );
    };
});

jest.mock('../../components/Chat/ChatPopup', () => ({
    ChatPopup: function MockChatPopup() {
        return <div data-testid="chat-popup">Chat Popup</div>;
    }
}));

jest.mock('../../pages/Home', () => {
    return function MockHome({ onLoginClick, isLoggedIn }) {
        return (
            <div data-testid="home-page">
                <span>Home Page - {isLoggedIn ? 'Logged In' : 'Logged Out'}</span>
            </div>
        );
    };
});

jest.mock('../../pages/Profile', () => {
    return function MockProfile() {
        return <div data-testid="profile-page">Profile Page</div>;
    };
});

jest.mock('../../pages/ForgotPassword', () => {
    return function MockForgotPassword() {
        return <div data-testid="forgot-password-page">Forgot Password Page</div>;
    };
});

// Mock contexts
const mockLogout = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../../context/AuthContext', () => ({
    AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
    useAuth: () => mockUseAuth()
}));

jest.mock('../../context/ChatContext', () => ({
    ChatProvider: ({ children }) => <div data-testid="chat-provider">{children}</div>
}));

describe('App Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAuth.mockReturnValue({
            currentUser: null,
            logout: mockLogout
        });
    });

    describe('Provider Setup', () => {
        it('wraps application with Router, AuthProvider, and ChatProvider', () => {
            render(<App />);

            expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
            expect(screen.getByTestId('chat-provider')).toBeInTheDocument();
        });
    });

    describe('AppContent - Not Logged In', () => {
        it('renders header with logged out state', () => {
            render(
                <MemoryRouter>
                    <AppContent />
                </MemoryRouter>
            );

            expect(screen.getByTestId('header')).toBeInTheDocument();
            expect(screen.getByText('Logged Out')).toBeInTheDocument();
        });



        it('does not show ChatPopup when user is not logged in', () => {
            render(
                <MemoryRouter>
                    <AppContent />
                </MemoryRouter>
            );

            expect(screen.queryByTestId('chat-popup')).not.toBeInTheDocument();
        });

        it('does not show AuthModal by default', () => {
            render(
                <MemoryRouter>
                    <AppContent />
                </MemoryRouter>
            );

            expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
        });

        it('does not show CreatePostModal by default', () => {
            render(
                <MemoryRouter>
                    <AppContent />
                </MemoryRouter>
            );

            expect(screen.queryByTestId('create-post-modal')).not.toBeInTheDocument();
        });
    });

    describe('AppContent - Logged In', () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({
                currentUser: { uid: 'user123', email: 'test@test.com' },
                logout: mockLogout
            });
        });

        it('renders header with logged in state', () => {
            render(
                <MemoryRouter>
                    <AppContent />
                </MemoryRouter>
            );

            expect(screen.getByText('Logged In')).toBeInTheDocument();
        });

        it('shows ChatPopup when user is logged in', () => {
            render(
                <MemoryRouter>
                    <AppContent />
                </MemoryRouter>
            );

            expect(screen.getByTestId('chat-popup')).toBeInTheDocument();
        });
    });

    describe('Modal State Management', () => {
        it('shows AuthModal in login mode when login is clicked', () => {
            render(
                <MemoryRouter>
                    <AppContent />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('Login'));

            expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
            expect(screen.getByText('Auth Modal - login')).toBeInTheDocument();
        });

        it('closes AuthModal when close button is clicked', () => {
            render(
                <MemoryRouter>
                    <AppContent />
                </MemoryRouter>
            );

            // Open modal
            fireEvent.click(screen.getByText('Login'));
            expect(screen.getByTestId('auth-modal')).toBeInTheDocument();

            // Close modal
            fireEvent.click(screen.getByText('Close'));
            expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
        });

        it('closes AuthModal on login success', () => {
            render(
                <MemoryRouter>
                    <AppContent />
                </MemoryRouter>
            );

            // Open modal
            fireEvent.click(screen.getByText('Login'));
            expect(screen.getByTestId('auth-modal')).toBeInTheDocument();

            // Trigger login success
            fireEvent.click(screen.getByText('Login Success'));
            expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
        });

        it('shows CreatePostModal when create post is clicked', () => {
            render(
                <MemoryRouter>
                    <AppContent />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('Create Post'));

            expect(screen.getByTestId('create-post-modal')).toBeInTheDocument();
        });

        it('closes CreatePostModal when close button is clicked', () => {
            render(
                <MemoryRouter>
                    <AppContent />
                </MemoryRouter>
            );

            // Open modal
            fireEvent.click(screen.getByText('Create Post'));
            expect(screen.getByTestId('create-post-modal')).toBeInTheDocument();

            // Close modal
            fireEvent.click(screen.getByText('Close'));
            expect(screen.queryByTestId('create-post-modal')).not.toBeInTheDocument();
        });

        it('reloads page on CreatePostModal success', () => {
            // Mock window.location.reload
            delete window.location;
            window.location = { reload: jest.fn() };

            render(
                <MemoryRouter>
                    <AppContent />
                </MemoryRouter>
            );

            // Open modal
            fireEvent.click(screen.getByText('Create Post'));

            // Trigger success
            fireEvent.click(screen.getByText('Success'));

            expect(window.location.reload).toHaveBeenCalled();
        });
    });

    describe('Logout Handling', () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({
                currentUser: { uid: 'user123', email: 'test@test.com' },
                logout: mockLogout.mockResolvedValue()
            });
        });

        it('calls logout and navigates to home on logout click', async () => {
            render(
                <MemoryRouter initialEntries={['/profile/user123']}>
                    <AppContent />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('Logout'));

            await waitFor(() => {
                expect(mockLogout).toHaveBeenCalled();
            });
        });
    });
});
