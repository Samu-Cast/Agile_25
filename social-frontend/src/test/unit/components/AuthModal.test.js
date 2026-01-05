import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AuthModal from '../../../components/AuthModal';

// Mock child components to test AuthModal in isolation
jest.mock('../../../pages/Login', () => ({ onLoginSuccess }) => (
    <div data-testid="login-component">
        Login Component
        <button onClick={onLoginSuccess}>Simulate Login Success</button>
    </div>
));

jest.mock('../../../pages/Register', () => () => (
    <div data-testid="register-component">
        Register Component
        <button>Simulate Register Success</button>
    </div>
));

describe('AuthModal Component', () => {
    const mockOnClose = jest.fn();
    const mockOnLoginSuccess = jest.fn();

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders login mode by default', () => {
        render(<AuthModal onClose={mockOnClose} onLoginSuccess={mockOnLoginSuccess} />);

        expect(screen.getByTestId('login-component')).toBeInTheDocument();
        expect(screen.queryByTestId('register-component')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Login' })).toHaveClass('active');
    });

    it('renders register mode initially if specified', () => {
        render(<AuthModal mode="register" onClose={mockOnClose} onLoginSuccess={mockOnLoginSuccess} />);

        expect(screen.getByTestId('register-component')).toBeInTheDocument();
        expect(screen.queryByTestId('login-component')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Register' })).toHaveClass('active');
    });

    it('switches between login and register tabs', () => {
        render(<AuthModal onClose={mockOnClose} onLoginSuccess={mockOnLoginSuccess} />);

        // Switch to Register
        fireEvent.click(screen.getByRole('button', { name: 'Register' }));
        expect(screen.getByTestId('register-component')).toBeInTheDocument();
        expect(screen.queryByTestId('login-component')).not.toBeInTheDocument();

        // Switch back to Login
        fireEvent.click(screen.getByRole('button', { name: 'Login' }));
        expect(screen.getByTestId('login-component')).toBeInTheDocument();
        expect(screen.queryByTestId('register-component')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        render(<AuthModal onClose={mockOnClose} onLoginSuccess={mockOnLoginSuccess} />);

        fireEvent.click(screen.getByLabelText('Close'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking overlay', () => {
        const { container } = render(<AuthModal onClose={mockOnClose} onLoginSuccess={mockOnLoginSuccess} />);

        // Find the overlay div which has the click handler
        // Since we can't easily query by class, we can look at the structure if needed, 
        // or just click the first div which is the overlay.
        // Assuming the overlay is the outermost div as per AuthModal.js
        fireEvent.click(container.firstChild);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking modal content', () => {
        render(<AuthModal onClose={mockOnClose} onLoginSuccess={mockOnLoginSuccess} />);

        // Click on the modal content (e.g. the tab header)
        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        // Should catch stopPropagation, so onClose should NOT be called (except 0 times)
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('propagates onLoginSuccess from Login component', () => {
        render(<AuthModal onClose={mockOnClose} onLoginSuccess={mockOnLoginSuccess} />);

        fireEvent.click(screen.getByText('Simulate Login Success'));
        expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1);
    });
});
