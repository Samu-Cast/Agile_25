import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostDetails from '../../../pages/PostDetails';
import { getComments, addComment } from '../../../services/postService';

//Mock React Router
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
}));

//Mock PostService
jest.mock('../../../services/postService', () => ({
    getComments: jest.fn(),
    addComment: jest.fn(),
}));

describe('PostDetails Page', () => {
    //Dati di prova
    const mockPosts = [
        {
            id: 1,
            author: 'User One',
            time: '2h ago',
            title: 'My First Post',
            content: 'This is the content of the post.',
            votes: 5,
            image: 'post-image.jpg'
        },
        {
            id: 2,
            author: 'User Two',
            title: 'Second Post'
        }
    ];

    const mockComments = [
        { id: 101, author: 'Commenter', text: 'Nice post!', timestamp: '1h ago' }
    ];

    const currentUser = { uid: 'user123', email: 'test@example.com', displayName: 'Test User' };
    const mockOnVote = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        //Default: Post ID 1 exists
        mockUseParams.mockReturnValue({ id: '1' });
        //Default: Comments load successfully
        const { getComments } = require('../../../services/postService');
        getComments.mockResolvedValue(mockComments);
    });


    //Verifica che all'avvio venga chiamata getComments e che i commenti vengano renderizzati.
    it('loads and renders comments on mount', async () => {
        const { getComments } = require('../../../services/postService');

        render(<PostDetails posts={mockPosts} currentUser={currentUser} />);

        //Verifica chiamata API
        expect(getComments).toHaveBeenCalledWith(1);

        //Verifica render commenti
        await waitFor(() => {
            expect(screen.getByText('Comments (1)')).toBeInTheDocument();
            expect(screen.getByText('Nice post!')).toBeInTheDocument();
        });
    });


    //Verifica logica complessa: aggiornamento UI immediato + chiamata API in background.
    it('handles optimistic comment submission', async () => {
        const { addComment } = require('../../../services/postService');
        addComment.mockResolvedValue({
            id: 202,
            text: 'My new comment',
            author: 'Test User',
            timestamp: 'Just now'
        });

        render(<PostDetails posts={mockPosts} currentUser={currentUser} />);

        //Attesa render iniziale
        await waitFor(() => expect(screen.getByText('Comments (1)')).toBeInTheDocument());

        //Compilazione Form
        const input = screen.getByPlaceholderText(/Add a comment/i);
        fireEvent.change(input, { target: { value: 'My new comment' } });

        //Submit
        const submitBtn = screen.getByText('Post');
        fireEvent.click(submitBtn);

        //Verifica Optimistic Update
        await waitFor(() => {
            expect(screen.getByText('My new comment')).toBeInTheDocument();
            expect(screen.getByText('Comments (2)')).toBeInTheDocument();
        });

        //Verifica Chiamata API
        expect(addComment).toHaveBeenCalledWith(1, expect.objectContaining({
            text: 'My new comment',
            author: 'Test User'
        }));
    });

    //Verifica che se l'ID nell'URL non corrisponde a nessun post, mostri il messaggio di caricamento/errore.
    it('renders loading/not found state when post does not exist', () => {
        //Setup: ID non esistente
        mockUseParams.mockReturnValue({ id: '999' });

        render(<PostDetails posts={mockPosts} currentUser={currentUser} />);

        expect(screen.getByText(/Loading post or post not found/i)).toBeInTheDocument();
        //Verifica che il resto del componente non venga renderizzato
        expect(screen.queryByText('My First Post')).not.toBeInTheDocument();
    });

    //Verifica che se il post esiste, visualizzi titolo, contenuto, autore e pulsante home.
    it('renders post content correctly and header interactions', () => {
        render(
            <PostDetails
                posts={mockPosts}
                currentUser={currentUser}
                onVote={mockOnVote}
            />
        );

        //Verifica contenuto statico
        expect(screen.getByText('My First Post')).toBeInTheDocument();
        expect(screen.getByText('This is the content of the post.')).toBeInTheDocument();

        //Verifica Autore
        expect(screen.getByText('User One')).toBeInTheDocument();

        //Verifica pulsante Back
        fireEvent.click(screen.getByText(/Back to Feed/i));
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    //Verifica che cliccando i pulsanti di voto venga chiamata la prop onVote con l'ID corretto.
    it('calls onVote with correct params when vote buttons are clicked', () => {
        render(
            <PostDetails
                posts={mockPosts}
                currentUser={currentUser}
                onVote={mockOnVote}
            />
        );

        const upvoteBtn = screen.getByText('▲');
        const downvoteBtn = screen.getByText('▼');

        //Test Upvote
        fireEvent.click(upvoteBtn);
        expect(mockOnVote).toHaveBeenCalledWith(1, 1); // ID: 1, Delta: +1

        //Test Downvote
        fireEvent.click(downvoteBtn);
        expect(mockOnVote).toHaveBeenCalledWith(1, -1); // ID: 1, Delta: -1
    });

    //Verifica che se l'utente non è loggato, mostri il messaggio di login invece del form.
    it('shows login prompt instead of input when not logged in', async () => {
        render(<PostDetails posts={mockPosts} currentUser={null} />);

        //Attendi caricamento (per evitare warning di act)
        await waitFor(() => expect(screen.getByText('Comments (1)')).toBeInTheDocument());

        //Verifica blocco input
        expect(screen.queryByPlaceholderText(/Add a comment/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Please log in to comment/i)).toBeInTheDocument();
    });
});
