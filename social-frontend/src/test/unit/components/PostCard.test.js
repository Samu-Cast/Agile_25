
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostCard from '../../../components/PostCard';
import { act } from 'react';

// Mock AuthContext
jest.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({ currentUser: { uid: 'user123', displayName: 'Test User' } })
}));

// Mock Post Service
jest.mock('../../../services/postService', () => ({
    updateVotes: jest.fn(() => Promise.resolve()),
    toggleSavePost: jest.fn(() => Promise.resolve()),
    joinEvent: jest.fn(() => Promise.resolve()),
    leaveEvent: jest.fn(() => Promise.resolve()),
}));

// Mock User Service
import * as userService from '../../../services/userService';
jest.mock('../../../services/userService');

// Mock Child Components
jest.mock('../../../components/CoffeeCupRating', () => (props) => (
    <div data-testid="coffee-rating">Rating: {props.rating}</div>
));
jest.mock('../../../components/MediaGallery', () => (props) => (
    <div data-testid="media-gallery">{props.mediaUrls.length} items</div>
));
jest.mock('../../../components/CommentSection', () => () => (
    <div data-testid="comment-section">Comments</div>
));

describe('PostCard Component', () => {
    const mockPost = {
        id: 'post1',
        author: 'User One',
        authorAvatar: 'avatar.jpg',
        time: '1h ago',
        content: 'Hello World',
        votes: 10,
        comments: 5,
        userVote: 0,
        isSaved: false,
        type: 'post'
    };

    const mockReviewPost = {
        ...mockPost,
        type: 'review',
        reviewData: {
            itemName: 'Best Coffee',
            brand: 'Lavazza',
            rating: 4,
            itemType: 'coffee'
        }
    };

    const mockPostWithMedia = {
        ...mockPost,
        mediaUrls: ['url1.jpg', 'url2.mp4']
    };

    const currentUser = { uid: 'user123' };

    it('renders basic post info', () => {
        render(<PostCard post={mockPost} currentUser={currentUser} isLoggedIn={true} />);

        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('Hello World')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument(); // Votes
        expect(screen.getByText(/5 Comments/)).toBeInTheDocument();
    });

    it('renders review details for review type', () => {
        render(<PostCard post={mockReviewPost} currentUser={currentUser} isLoggedIn={true} />);

        expect(screen.getByText('⭐ Recensione')).toBeInTheDocument();
        expect(screen.getByText('Best Coffee')).toBeInTheDocument();
        expect(screen.getByText('Lavazza')).toBeInTheDocument();
        expect(screen.getByText('Rating: 4')).toBeInTheDocument();
    });

    it('renders media gallery when multiple media items exist', () => {
        render(<PostCard post={mockPostWithMedia} currentUser={currentUser} isLoggedIn={true} />);

        expect(screen.getByTestId('media-gallery')).toHaveTextContent('2 items');
    });

    it('renders single image if only one image provided (legacy support)', () => {
        const legacyPost = { ...mockPost, image: 'img.jpg' };
        render(<PostCard post={legacyPost} currentUser={currentUser} isLoggedIn={true} />);

        const img = screen.getByAltText('Post content');
        expect(img).toHaveAttribute('src', 'img.jpg');
    });

    it('handles upvote', () => {
        render(<PostCard post={mockPost} currentUser={currentUser} isLoggedIn={true} />);

        fireEvent.click(screen.getByText('▲'));
        expect(screen.getByText('11')).toBeInTheDocument();
    });

    it('handles downvote', () => {
        render(<PostCard post={mockPost} currentUser={currentUser} isLoggedIn={true} />);

        fireEvent.click(screen.getByText('▼'));
        expect(screen.getByText('9')).toBeInTheDocument();
    });

    it('toggles save status', () => {
        render(<PostCard post={mockPost} currentUser={currentUser} isLoggedIn={true} />);

        const saveBtn = screen.getByText(/Salva/);
        fireEvent.click(saveBtn);

        expect(screen.getByText(/Salvato/)).toBeInTheDocument();
    });

    it('toggles comment section', () => {
        render(<PostCard post={mockPost} currentUser={currentUser} isLoggedIn={true} />);

        expect(screen.queryByTestId('comment-section')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText(/Comments/));

        expect(screen.getByTestId('comment-section')).toBeInTheDocument();
    });

    it('displays community info if active', () => {
        const communityPost = { ...mockPost, communityName: 'Coffee Lovers' };
        render(<PostCard post={communityPost} currentUser={currentUser} isLoggedIn={true} showCommunityInfo={true} />);

        expect(screen.getByText('Coffee Lovers')).toBeInTheDocument();
    });

    describe('Event Post', () => {
        const mockEventPost = {
            ...mockPost,
            type: 'event',
            eventDetails: {
                title: 'Coffee Tasting',
                date: '2024-12-25',
                time: '10:00',
                location: 'Milan'
            },
            participants: ['u1'], // 1 participant
            hosts: []
        };

        it('renders event details', () => {
            render(<PostCard post={mockEventPost} currentUser={currentUser} isLoggedIn={true} />);

            expect(screen.getByText('📅 Evento')).toBeInTheDocument();
            expect(screen.getByText('Coffee Tasting')).toBeInTheDocument();
            expect(screen.getByText('Milan')).toBeInTheDocument();
            expect(screen.getByText('1')).toBeInTheDocument(); // Participant count
        });

        it('shows Join button for non-participants', () => {
            render(<PostCard post={mockEventPost} currentUser={currentUser} isLoggedIn={true} />);

            // Current user is "user123", participant is "u1". So not participating.
            expect(screen.getByText('Partecipa +')).toBeInTheDocument();
        });

        it('shows Participating button for participants', () => {
            const participatingPost = { ...mockEventPost, participants: ['user123'] };
            render(<PostCard post={participatingPost} currentUser={currentUser} isLoggedIn={true} />);

            expect(screen.getByText('✓ Parteciperai')).toBeInTheDocument();
        });

        it('shows View Participants button for Creator', () => {
            const creatorPost = { ...mockEventPost, uid: 'user123', authorId: 'user123' };
            render(<PostCard post={creatorPost} currentUser={currentUser} isLoggedIn={true} />);

            expect(screen.getByText('👥 Vedi Partecipanti')).toBeInTheDocument();
            expect(screen.queryByText('Partecipa +')).not.toBeInTheDocument();
        });

        it('opens participants modal on click', async () => {
            // Setup mock
            userService.getUsersByUids.mockResolvedValue([
                { uid: 'u1', nickname: 'Participant 1', profilePic: 'p1.jpg' }
            ]);

            render(<PostCard post={mockEventPost} currentUser={currentUser} isLoggedIn={true} />);

            // Click on the count text (which has 'pointer' cursor)
            const countText = screen.getByText('1'); // The number
            // We need to find the clickable container, usually the direct parent span
            // But testing-library finds by text. Let's click the text '1 persone parteciperanno' (partial match)
            fireEvent.click(screen.getByText(/persone parteciperanno/));

            // Use findByText which handles waiting automatically
            const participantName = await screen.findByText('Participant 1', {}, { timeout: 3000 });
            expect(participantName).toBeInTheDocument();
            expect(screen.getByText('Partecipanti (1)')).toBeInTheDocument();
        });
    });
});
