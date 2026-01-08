
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
    const mockCommunities = [
        { id: 'c1', name: 'Coffee Lovers', avatar: 'avatar1.jpg' },
        { id: 'c2', name: 'Espresso Enthusiasts', avatar: null }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ currentUser: mockUser });

        // Mock fetch for communities
        global.fetch = jest.fn((url) => {
            if (url.includes('/communities')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockCommunities
                });
            }
            // Default for post creation
            return Promise.resolve({
                ok: true,
                json: async () => ({ id: 'new-post' })
            });
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
        expect(screen.getByPlaceholderText("Racconta la tua esperienza con dati tencici o molto altro... (es. temperatura, pressione, tempo estrazione)")).toBeInTheDocument();
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
        fireEvent.change(screen.getByPlaceholderText("Racconta la tua esperienza con dati tencici o molto altro... (es. temperatura, pressione, tempo estrazione)"), {
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
        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/users/${mockUser.uid}/communities`));
        });
    });

    // NEW TESTS FOR UNCOVERED CODE

    describe('Comparison Mode', () => {
        it('enables comparison mode in review', async () => {
            render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

            fireEvent.click(screen.getByText('⭐ Recensione'));

            const comparisonCheckbox = screen.getByText('Confronto tra due miscele?');
            fireEvent.click(comparisonCheckbox);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Miscela 1')).toBeInTheDocument();
                expect(screen.getByPlaceholderText('Miscela 2')).toBeInTheDocument();
            });
        });

        it('validates comparison fields when enabled', async () => {
            window.alert = jest.fn();

            render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

            fireEvent.click(screen.getByText('⭐ Recensione'));
            fireEvent.click(screen.getByText('Confronto tra due miscele?'));

            // Fill review data but not comparison titles
            fireEvent.change(screen.getByLabelText('Nome articolo *'), {
                target: { value: 'Comparison Test' }
            });
            fireEvent.click(screen.getByTestId('coffee-rating'));

            fireEvent.click(screen.getByText('Pubblica Recensione'));

            expect(window.alert).toHaveBeenCalledWith('Per favore inserisci i nomi di entrambe le miscele per il confronto');
        });

        it('submits review with comparison data', async () => {
            render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

            fireEvent.click(screen.getByText('⭐ Recensione'));
            fireEvent.click(screen.getByText('Confronto tra due miscele?'));

            fireEvent.change(screen.getByLabelText('Nome articolo *'), {
                target: { value: 'Coffee Comparison' }
            });
            fireEvent.change(screen.getByPlaceholderText('Miscela 1'), {
                target: { value: 'Ethiopian Blend' }
            });
            fireEvent.change(screen.getByPlaceholderText('Miscela 2'), {
                target: { value: 'Colombian Blend' }
            });
            fireEvent.change(screen.getByPlaceholderText("Racconta la tua esperienza con dati tencici o molto altro... (es. temperatura, pressione, tempo estrazione)"), {
                target: { value: 'Comparison review' }
            });
            fireEvent.click(screen.getByTestId('coffee-rating'));

            fireEvent.click(screen.getByText('Pubblica Recensione'));

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/posts'),
                    expect.objectContaining({
                        body: expect.stringMatching(/Ethiopian Blend.*Colombian Blend/)
                    })
                );
            });
        });
    });

    describe('Media Handling', () => {
        it('handles too many media files (max 6)', async () => {
            window.alert = jest.fn();

            render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

            const files = Array.from({ length: 7 }, (_, i) =>
                new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
            );

            const input = document.querySelector('#modal-media');
            Object.defineProperty(input, 'files', {
                value: files,
                writable: false
            });

            fireEvent.change(input);

            expect(window.alert).toHaveBeenCalledWith('Massimo 6 file (5 immagini + 1 video)');
        });
    });

    describe('Community Selection', () => {
        it('opens and closes community dropdown', async () => {
            render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

            await waitFor(() => {
                expect(screen.getByText('Post to: My Profile')).toBeInTheDocument();
            });

            // Open dropdown
            fireEvent.click(screen.getByText('Post to: My Profile'));

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search community...')).toBeInTheDocument();
                expect(screen.getByText('Coffee Lovers')).toBeInTheDocument();
                expect(screen.getByText('Espresso Enthusiasts')).toBeInTheDocument();
            });
        });

        it('searches communities by name', async () => {
            render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

            fireEvent.click(screen.getByText('Post to: My Profile'));

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search community...')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search community...');
            fireEvent.change(searchInput, { target: { value: 'Espresso' } });

            await waitFor(() => {
                expect(screen.getByText('Espresso Enthusiasts')).toBeInTheDocument();
                expect(screen.queryByText('Coffee Lovers')).not.toBeInTheDocument();
            });
        });

        it('selects community target', async () => {
            render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

            fireEvent.click(screen.getByText('Post to: My Profile'));

            await waitFor(() => {
                expect(screen.getByText('Coffee Lovers')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Coffee Lovers'));

            await waitFor(() => {
                expect(screen.getByText('Post to: Coffee Lovers')).toBeInTheDocument();
            });
        });

        it('posts to selected community', async () => {
            render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

            // Select community
            fireEvent.click(screen.getByText('Post to: My Profile'));
            await waitFor(() => {
                expect(screen.getByText('Coffee Lovers')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Coffee Lovers'));

            // Create post
            fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
                target: { value: 'Community post' }
            });

            fireEvent.click(screen.getByText('Post'));

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/posts'),
                    expect.objectContaining({
                        body: expect.stringMatching(/"communityId":"c1"/)
                    })
                );
            });
        });
    });

    describe('Error Handling', () => {
        it('handles failed post creation (API error)', async () => {
            window.alert = jest.fn();

            // Reset fetch mock to return error for /posts endpoint
            global.fetch = jest.fn((url) => {
                if (url.includes('/communities')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => mockCommunities
                    });
                }
                if (url.includes('/posts')) {
                    return Promise.resolve({
                        ok: false,
                        json: async () => ({ error: 'Server error' })
                    });
                }
                return Promise.resolve({ ok: true, json: async () => ({}) });
            });

            render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
            });

            fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
                target: { value: 'Test post' }
            });

            fireEvent.click(screen.getByText('Post'));

            await waitFor(() => {
                expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to create post'));
            }, { timeout: 3000 });

            expect(mockOnSuccess).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('shows loading state during submission', async () => {
            // Make fetch take a while
            global.fetch.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({
                    ok: true,
                    json: async () => ({ id: 'new-post' })
                }), 100))
            );

            render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

            fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
                target: { value: 'Test post' }
            });

            fireEvent.click(screen.getByText('Post'));

            // Should show loading text
            await waitFor(() => {
                expect(screen.getByText('Posting...')).toBeInTheDocument();
            });

            // Wait for completion
            await waitFor(() => {
                expect(mockOnSuccess).toHaveBeenCalled();
            }, { timeout: 3000 });
        });

        it('prevents submission when not logged in', async () => {
            window.alert = jest.fn();
            useAuth.mockReturnValue({ currentUser: null });

            render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

            fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
                target: { value: 'Test post' }
            });

            fireEvent.click(screen.getByText('Post'));

            expect(window.alert).toHaveBeenCalledWith('You must be logged in to create a post.');
            expect(global.fetch).not.toHaveBeenCalledWith(
                expect.stringContaining('/posts'),
                expect.any(Object)
            );
        });
    });
});
