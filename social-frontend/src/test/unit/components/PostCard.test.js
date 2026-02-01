
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostCard from '../../../components/PostCard';
import { act } from 'react';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

//Mock AuthContext
jest.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({ currentUser: { uid: 'user123', displayName: 'Test User' } })
}));

//Mock Post Service
jest.mock('../../../services/postService', () => ({
    updateVotes: jest.fn(() => Promise.resolve()),
    toggleSavePost: jest.fn(() => Promise.resolve()),
    joinEvent: jest.fn(() => Promise.resolve()),
    leaveEvent: jest.fn(() => Promise.resolve()),
}));

//Mock Child Components
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

    //Rendering Iniziale
    it('renders correct initial state', () => {
        render(<PostCard post={mockPost} currentUser={currentUser} />);
        expect(screen.getByTestId('vote-count')).toHaveTextContent('10');
        expect(screen.getByTestId('upvote-btn')).not.toHaveClass('active');
    });

    //Nuovo Voto (+1)
    it('increments vote count when clicking upvote', () => {
        render(<PostCard post={mockPost} currentUser={currentUser} isLoggedIn={true} />);

        fireEvent.click(screen.getByTestId('upvote-btn'));
        expect(screen.getByTestId('vote-count')).toHaveTextContent('11');
        expect(screen.getByTestId('upvote-btn')).toHaveClass('active');
    });

    //Nuovo Voto (-1)
    it('decrements vote count when clicking downvote', () => {
        render(<PostCard post={mockPost} currentUser={currentUser} isLoggedIn={true} />);

        fireEvent.click(screen.getByTestId('downvote-btn'));
        expect(screen.getByTestId('vote-count')).toHaveTextContent('9');
        expect(screen.getByTestId('downvote-btn')).toHaveClass('active');
    });

    //Annullamento Voto (Toggle)
    it('removes vote when clicking same button again (Toggle)', () => {
        const votedPost = { ...mockPost, userVote: 1, votes: 11 };
        render(<PostCard post={votedPost} currentUser={currentUser} isLoggedIn={true} />);

        fireEvent.click(screen.getByTestId('upvote-btn'));
        expect(screen.getByTestId('vote-count')).toHaveTextContent('10');
        expect(screen.getByTestId('upvote-btn')).not.toHaveClass('active');
    });

    //Error Handling
    it('handles vote API errors gracefully (Optimistic Rollback)', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const errorPost = { ...mockPost, userVote: 0, votes: 10 };
        const { updateVotes } = require('../../../services/postService'); //Re-import to get the mocked function
        updateVotes.mockRejectedValue(new Error('Network error'));

        render(<PostCard post={errorPost} currentUser={currentUser} isLoggedIn={true} />);

        //1. Initial State
        expect(screen.getByTestId('vote-count')).toHaveTextContent('10');

        //2. Click Upvote
        fireEvent.click(screen.getByTestId('upvote-btn'));

        //3. Optimistic Update (Verification might be tricky with async failure, but we verify the rollback eventually)
        //Ideally we'd check availability of '11' momentarily, but waitFor will catch the final state.

        //4. Wait for Rollback
        await waitFor(() => {
            expect(screen.getByTestId('vote-count')).toHaveTextContent('10'); // Back to 10
        });

        expect(consoleSpy).toHaveBeenCalledWith("Error voting:", expect.any(Error));
        consoleSpy.mockRestore();
    });

    //handle saving 
    it('handle save post optimistic rollback', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const { toggleSavePost } = require('../../../services/postService');
        toggleSavePost.mockRejectedValue(new Error('Save failed'));

        render(<PostCard post={mockPost} currentUser={currentUser} isLoggedIn={true} />);

        const saveButton = screen.getByText(/Salva/i);
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText(/Salva/i)).toBeInTheDocument();
            expect(screen.queryByText(/Salvato/i)).not.toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    //Error catch 
    it('result error while voting if someting go wrong', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const { updateVotes } = require('../../../services/postService');
        updateVotes.mockRejectedValue(new Error('Vote failed'));

        render(<PostCard post={mockPost} currentUser={currentUser} isLoggedIn={true} />);

        fireEvent.click(screen.getByTestId('upvote-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('vote-count')).toHaveTextContent('10');
        });

        expect(consoleSpy).toHaveBeenCalledWith("Error voting:", expect.any(Error));
        consoleSpy.mockRestore();
    });

    //Image Fallback
    it('uses fallback image on avatar load error', () => {
        render(<PostCard post={mockPost} currentUser={currentUser} />);

        const avatar = screen.getByAltText(mockPost.author);
        //Simulo l'errore di caricamento immagine
        fireEvent.error(avatar);
        //Verifico che il src sia cambiato con quello di fallback
        expect(avatar.src).toBe("https://cdn-icons-png.flaticon.com/512/847/847969.png");
    });

    //Community Info
    it('shows community name when showCommunityInfo is true because the user is logged in', () => {
        const postWithCommunity = { ...mockPost, communityName: 'Coffee Lovers' };

        //showCommunityInfo = true
        const { rerender } = render(
            <PostCard
                post={postWithCommunity}
                currentUser={currentUser}
                showCommunityInfo={true}
            />
        );
        expect(screen.getByText('Coffee Lovers')).toBeInTheDocument();
        expect(screen.getByText('in')).toBeInTheDocument();

        //showCommunityInfo = false (default o esplicito)
        rerender(
            <PostCard
                post={postWithCommunity}
                currentUser={currentUser}
                showCommunityInfo={false}
            />
        );
        expect(screen.queryByText('Coffee Lovers')).not.toBeInTheDocument();
    });

    //Tagged user
    it('shows tagged user when data is available', () => {
        const postWithTaggedUser = {
            ...mockPost,
            taggedUsers: ['user123'],
            taggedUsersData: [
                { uid: 'user123', nickname: 'Mario Rossi' } // Dati necessari per il render
            ]
        };

        render(<PostCard post={postWithTaggedUser} currentUser={currentUser} />);

        // Verifica che il nome dell'utente taggato sia visibile
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument();
    });

    //click on profile
    it('navigates to profile when clicking on tagged user', () => {
        const postWithTaggedUser = {
            ...mockPost,
            taggedUsers: ['user123'],
            taggedUsersData: [{ uid: 'user123', nickname: 'Mario Rossi' }]
        };

        render(<PostCard post={postWithTaggedUser} currentUser={currentUser} />);

        // Find by nickname (as rendered in component)
        const profileLink = screen.getByText('Mario Rossi');
        fireEvent.click(profileLink);

        expect(mockNavigate).toHaveBeenCalledWith('/profile/user123');
    });

    //Comment section
    it('toggles comment section when comment button is clicked', () => {
        render(<PostCard post={mockPost} currentUser={currentUser} />);

        // Find button by partial text (e.g., "5 Comments")
        const commentButton = screen.getByText(/Comments/i);
        fireEvent.click(commentButton);

        // Verify CommentSection appears
        expect(screen.getByTestId('comment-section')).toBeInTheDocument();
    });

    //Cancel comment section
    it('closes comment section when clicked again', () => {
        render(<PostCard post={mockPost} currentUser={currentUser} />);

        const commentButton = screen.getByText(/Comments/i);

        // Open
        fireEvent.click(commentButton);
        expect(screen.getByTestId('comment-section')).toBeInTheDocument();

        // Close
        fireEvent.click(commentButton);
        expect(screen.queryByTestId('comment-section')).not.toBeInTheDocument();
    });

    //Delete Button
    it('calls onDelete when delete button is clicked', () => {
        const onDeleteMock = jest.fn();
        // Renderizza come autore per vedere il bottone
        render(
            <PostCard
                post={{ ...mockPost, authorId: 'user123' }}
                currentUser={{ uid: 'user123' }}
                onDelete={onDeleteMock}
            />
        );

        const deleteButton = screen.getByTitle('Elimina');
        expect(deleteButton).toBeInTheDocument();

        fireEvent.click(deleteButton);
        expect(onDeleteMock).toHaveBeenCalledWith('post1', expect.anything());
    });

});
