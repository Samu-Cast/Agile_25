
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
}));

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
});
