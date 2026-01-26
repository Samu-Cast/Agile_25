
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sidebar from '../../../components/Sidebar';
import { AuthProvider } from '../../../context/AuthContext';

// Mock AuthContext
jest.mock('../../../context/AuthContext', () => ({
    useAuth: jest.fn()
}));

// Mock CreateCommunityModal
jest.mock('../../../components/CreateCommunityModal', () => (props) => (
    <div data-testid="create-community-modal">
        Create Community Modal
        <button onClick={props.onClose}>Close Modal</button>
    </div>
));

import { useAuth } from '../../../context/AuthContext';



describe('Sidebar Component', () => {
    const mockOnFeedChange = jest.fn();
    const mockUser = { uid: 'user1', email: 'test@test.com' };

    beforeEach(() => {
        jest.clearAllMocks();
        // Default auth state
        useAuth.mockReturnValue({
            currentUser: mockUser
        });
    });

    it('renders default sidebar items', async () => {
        render(<Sidebar activeFeed="home" onFeedChange={mockOnFeedChange} />);

        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Popular')).toBeInTheDocument();
        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('Explore')).toBeInTheDocument();
        expect(screen.getByText('COMMUNITIES')).toBeInTheDocument();
    });

    it('highlights active feed', async () => {
        render(<Sidebar activeFeed="popular" onFeedChange={mockOnFeedChange} />);

        // Use logic to check active class
        const popularItem = screen.getByText('Popular').closest('.sidebar-item');
        expect(popularItem).toHaveClass('active');

        const homeItem = screen.getByText('Home').closest('.sidebar-item');
        expect(homeItem).not.toHaveClass('active');
    });

    it('calls onFeedChange when item is clicked', async () => {
        render(<Sidebar activeFeed="home" onFeedChange={mockOnFeedChange} />);

        fireEvent.click(screen.getByText('Popular'));
        expect(mockOnFeedChange).toHaveBeenCalledWith('popular');
    });

    it('fetches and displays user communities', async () => {
        const mockCommunities = [
            { id: 'c1', name: 'My Community', creatorId: 'user1', avatar: null },
            { id: 'c2', name: 'Other Community', creatorId: 'user2', members: ['user1'], avatar: 'img.jpg' }
        ];

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockCommunities
        });

        render(<Sidebar activeFeed="home" onFeedChange={mockOnFeedChange} />);

        await waitFor(() => {
            expect(screen.getByText('MY COMMUNITIES')).toBeInTheDocument();
            expect(screen.getByText('My Community')).toBeInTheDocument();
            expect(screen.getByText('FOLLOWING')).toBeInTheDocument();
            expect(screen.getByText('Other Community')).toBeInTheDocument();
        });
    });

    it('handles create community modal visibility', async () => {
        render(<Sidebar activeFeed="home" onFeedChange={mockOnFeedChange} />);

        const createBtn = screen.getByTitle('Create Community');
        fireEvent.click(createBtn);

        expect(screen.getByTestId('create-community-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Close Modal'));
        expect(screen.queryByTestId('create-community-modal')).not.toBeInTheDocument();
    });

    it('collapses and expands sidebar', async () => {
        const { container } = render(<Sidebar activeFeed="home" onFeedChange={mockOnFeedChange} />);

        const toggleBtn = screen.getByLabelText('Toggle Sidebar');
        const sidebar = container.querySelector('aside');

        // Initially not collapsed
        expect(sidebar).not.toHaveClass('collapsed');

        // Click to collapse
        fireEvent.click(toggleBtn);
        expect(sidebar).toHaveClass('collapsed');
        expect(screen.queryByText('Home')).not.toBeNull(); // Text is still there but hidden via CSS usually, or just check class

        // Click to expand
        fireEvent.click(toggleBtn);
        expect(sidebar).not.toHaveClass('collapsed');
    });
});
