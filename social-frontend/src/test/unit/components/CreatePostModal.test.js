import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreatePostModal from '../../../components/CreatePostModal';
import { AuthProvider } from '../../../context/AuthContext';
import * as imageService from '../../../services/imageService';

//Mock userService
jest.mock('../../../services/userService', () => ({
    searchGlobal: jest.fn()
}));
import { searchGlobal } from '../../../services/userService';

jest.mock('../../../components/CoffeeCupRating', () => (props) => (
    <div data-testid="coffee-rating" onClick={() => props.onChange(5)}>
        Coffee Rating {props.rating}
    </div>
));

import { useAuth } from '../../../context/AuthContext';
jest.mock('../../../context/AuthContext', () => ({
    useAuth: jest.fn()
}));


//Mock URL.createObjectURL and revokeObjectURL
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

        //Spy on imageService methods
        jest.spyOn(imageService, 'validateMedia').mockReturnValue(true);
        jest.spyOn(imageService, 'uploadMultipleMedia').mockResolvedValue(['mock-url']);
        jest.spyOn(imageService, 'validateImage').mockReturnValue(true);
        jest.spyOn(imageService, 'validateVideo').mockReturnValue(true);

        useAuth.mockReturnValue({ currentUser: mockUser });

        //Mock fetch for communities
        global.fetch = jest.fn((url) => {
            if (url.includes('/communities')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockCommunities
                });
            }
            //Default for post creation
            return Promise.resolve({
                ok: true,
                json: async () => ({ id: 'new-post' })
            });
        });
    });

    //initial state
    it('renders basic post form by default', () => {
        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        expect(screen.getByText('Crea Contenuto')).toBeInTheDocument();
        expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
        expect(screen.queryByLabelText('Nome articolo *')).not.toBeInTheDocument();
    });



    it('fetches user communities', async () => {
        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/users/${mockUser.uid}/communities`));
        });
    });

    //remove media
    it('removes media', async () => {
        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        //Upload media first
        const file = new File(['test'], 'test.png', { type: 'image/png' });
        const input = document.querySelector('#modal-media');

        Object.defineProperty(input, 'files', {
            value: [file],
            writable: false
        });
        fireEvent.change(input);
        const previewImage = await screen.findByRole('img');
        expect(previewImage).toBeInTheDocument();
        //Click Remove button
        const removeButtons = screen.getAllByLabelText('Remove media');
        fireEvent.click(removeButtons[0]);
        //Verify removal
        await waitFor(() => {
            expect(screen.queryByRole('img')).not.toBeInTheDocument();
        });
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

    //mancato inserimeno di entrambi i nomi delle miscele
    it('return alert if one of title names are missing', async () => {
        window.alert = jest.fn();

        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        fireEvent.click(screen.getByText('⚖️ Confronto')); // Attiva modalità confronto

        const input = screen.getAllByPlaceholderText("Nome prodotto");
        fireEvent.change(input[0], { target: { value: 'Il mio caffè preferito' } });

        expect(input[0].value).toBe('Il mio caffè preferito');

        fireEvent.click(screen.getByText('Pubblica Confronto'));
        expect(window.alert).toHaveBeenCalledWith('Per favore inserisci i nomi di entrambe le miscele per il confronto');
    });


    it('validates comparison fields', async () => {
        window.alert = jest.fn();

        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        fireEvent.click(screen.getByText('⚖️ Confronto'));

        //Try to submit without filling item names
        fireEvent.click(screen.getByText('Pubblica Confronto'));

        expect(window.alert).toHaveBeenCalledWith('Per favore inserisci i nomi di entrambe le miscele per il confronto');
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

    it('shows loading state during submission', async () => {
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

    it('submits a review', async () => {
        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        //Switch to Review
        fireEvent.click(screen.getByText('⭐ Recensione'));

        //Fill fields
        fireEvent.change(screen.getByLabelText('Nome articolo *'), {
            target: { value: 'Good Coffee' }
        });
        fireEvent.change(screen.getByPlaceholderText("Racconta la tua esperienza..."), {
            target: { value: 'Best coffee ever' }
        });

        //Interact with rating mock
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

    it('submits a comparison post', async () => {
        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        fireEvent.click(screen.getByText('⚖️ Confronto'));

        //Fill inputs 
        const nameInputs = screen.getAllByPlaceholderText('Nome prodotto');
        fireEvent.change(nameInputs[0], { target: { value: 'Ethiopian Blend' } });
        fireEvent.change(nameInputs[1], { target: { value: 'Colombian Blend' } });

        const brandInputs = screen.getAllByPlaceholderText('Marca');
        fireEvent.change(brandInputs[0], { target: { value: 'Brand A' } });
        fireEvent.change(brandInputs[1], { target: { value: 'Brand B' } });

        fireEvent.change(screen.getByPlaceholderText("Descrivi le differenze, i pro e i contro..."), {
            target: { value: 'Comparison review text' }
        });

        //Submit
        fireEvent.click(screen.getByText('Pubblica Confronto'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/posts'),
                expect.objectContaining({
                    body: expect.stringMatching(/Ethiopian Blend.*Colombian Blend/)
                })
            );
        });
    });

    it('handles failed post creation (API error)', async () => {
        window.alert = jest.fn();

        //Reset fetch mock to return error for /posts endpoint
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

    it('switches to review mode', () => {
        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        fireEvent.click(screen.getByText('⭐ Recensione'));

        expect(screen.getByLabelText('Nome articolo *')).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Racconta la tua esperienza...")).toBeInTheDocument();
    });

    it('enables comparison mode', async () => {
        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        fireEvent.click(screen.getByText('⚖️ Confronto'));

        await waitFor(() => {
            expect(screen.getByText('Prodotto 1')).toBeInTheDocument();
            expect(screen.getByText('Prodotto 2')).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Descrivi le differenze, i pro e i contro...")).toBeInTheDocument();
        });
    });

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

    });


    it('handles user tagging flow', async () => {
        //Setup mock response
        searchGlobal.mockResolvedValue([
            { uid: 'u2', name: 'JohnDoe', type: 'user' }
        ]);

        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        //Open tagging section
        fireEvent.click(screen.getByText(/Tagga Utenti/));

        //Type in search
        const searchInput = screen.getByPlaceholderText('Cerca utente da taggare...');
        fireEvent.change(searchInput, { target: { value: 'John' } });

        //Wait for debounce and search
        await waitFor(() => {
            expect(searchGlobal).toHaveBeenCalledWith('John');
        });

        //Select user
        await waitFor(() => {
            expect(screen.getByText('JohnDoe')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('JohnDoe'));

        //Verify tagged
        expect(screen.getByText(/JohnDoe/)).toBeInTheDocument();
        const removeBtns = screen.getAllByText('×');
        const removeTagBtn = removeBtns[removeBtns.length - 1]; // Assuming it's the last one added
        fireEvent.click(removeTagBtn);

        expect(screen.queryByText('JohnDoe')).not.toBeInTheDocument();
    });

    // Smart Test: Logic Guard Clause
    it('ignores invalid comparison image', async () => {
        // Mock validation failure
        imageService.validateMedia.mockReturnValueOnce(false);

        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        // Switch to comparison
        fireEvent.click(screen.getByText('⚖️ Confronto'));

        const file = new File(['test'], 'invalid.png', { type: 'image/png' });
        // Use hidden input
        const input = document.querySelector('#comp-img-1');
        Object.defineProperty(input, 'files', {
            value: [file],
            writable: false
        });

        fireEvent.change(input);

        // Verify NO preview is rendered (alt text "Preview 1")
        expect(screen.queryByAltText('Preview 1')).not.toBeInTheDocument();
        // Verify validateMedia was called
        expect(imageService.validateMedia).toHaveBeenCalledWith(file);
    });

    // Smart Test: State Management
    it('resets community to My Profile', async () => {
        render(<CreatePostModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        // 1. Select a community first
        fireEvent.click(screen.getByText('Post to: My Profile'));
        await waitFor(() => {
            expect(screen.getByText('Coffee Lovers')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Coffee Lovers'));

        // Verify changed state
        expect(screen.getByText('Post to: Coffee Lovers')).toBeInTheDocument();

        // 2. Reset to My Profile
        fireEvent.click(screen.getByText('Post to: Coffee Lovers')); // Open dropdown again

        // Find the "My Profile" option in dropdown (contains user emoji or text)
        // In component: <strong>👤 My Profile</strong> (Public)
        // We can search by text "My Profile" and filter or use regex
        await waitFor(() => {
            const options = screen.getAllByText(/My Profile/i);
            // One is the header (now hidden/replaced?), one is dropdown. 
            // Actually header says "Post to: Coffee Lovers", so "My Profile" shouldn't be in header anymore.
            // But let's be safe. The dropdown item has (Public).
            const myProfileOption = options.find(el => el.textContent.includes('(Public)'));
            if (myProfileOption) fireEvent.click(myProfileOption);
            else fireEvent.click(options[0]); // Fallback
        });

        // 3. Verify reset state
        expect(screen.getByText('Post to: My Profile')).toBeInTheDocument();
    });

    //Funzinoi tipo: onChange={(e) => setText(e.target.value)} non testate perchè banali e intrinsevche di React
});

