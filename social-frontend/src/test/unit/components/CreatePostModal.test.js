
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreatePostModal from '../../../components/CreatePostModal';
import { AuthProvider } from '../../../context/AuthContext';
import { uploadMultipleMedia } from '../../../services/imageService';

// Mock dependencies
jest.mock('../../../services/imageService', () => ({
    uploadMultipleMedia: jest.fn(),
    validateMedia: jest.fn().mockReturnValue(true)
}));

jest.mock('../../../components/CoffeeCupRating', () => (props) => (
    <div data-testid="coffee-rating" onClick={() => props.onChange(5)}>
        Coffee Rating {props.rating}
    </div>
));

import { useAuth } from '../../../context/AuthContext';
jest.mock('../../../context/AuthContext', () => ({
    useAuth: jest.fn()
}));


// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('CreatePostModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSuccess = jest.fn();
    const mockUser = { uid: 'user1', email: 'test@test.com' };

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ currentUser: mockUser });
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ id: 'new-post' })
        });
    });

    it('renders basic post form by default', () => {
        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        expect(screen.getByText('Crea Contenuto')).toBeInTheDocument();
        expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
        expect(screen.queryByLabelText('Nome articolo *')).not.toBeInTheDocument();
    });

    it('switches to review mode', () => {
        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        fireEvent.click(screen.getByText('⭐ Recensione'));

        expect(screen.getByLabelText('Nome articolo *')).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Racconta la tua esperienza...")).toBeInTheDocument();
    });

    it('submits a simple post', async () => {
        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
            target: { value: 'Hello World' }
        });

        fireEvent.click(screen.getByText('Post'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/posts'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('Hello World')
                })
            );
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('submits a review', async () => {
        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        // Switch to Review
        fireEvent.click(screen.getByText('⭐ Recensione'));

        // Fill fields
        fireEvent.change(screen.getByLabelText('Nome articolo *'), {
            target: { value: 'Good Coffee' }
        });
        fireEvent.change(screen.getByPlaceholderText("Racconta la tua esperienza..."), {
            target: { value: 'Best coffee ever' }
        });

        // Interact with rating mock
        fireEvent.click(screen.getByTestId('coffee-rating'));

        fireEvent.click(screen.getByText('Pubblica Recensione'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/posts'),
                expect.objectContaining({
                    body: expect.stringMatching(/Good Coffee/)
                })
            );
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });

    it('validates review fields', async () => {
        window.alert = jest.fn(); // Mock alert

        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        fireEvent.click(screen.getByText('⭐ Recensione'));

        // Try submitting empty
        fireEvent.click(screen.getByText('Pubblica Recensione'));

        expect(global.fetch).not.toHaveBeenCalledWith(
            expect.stringContaining('/posts'),
            expect.any(Object)
        );
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Per favore inserisci'));
    });

    it('fetches user communities', async () => {
        const mockCommunities = [{ id: 'c1', name: 'Comm1' }];
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockCommunities
        });

        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/users/${mockUser.uid}/communities`));
        });
    });
});
