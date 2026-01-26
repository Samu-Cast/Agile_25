//Test per verificare che la pagina CreatePost funzioni correttamente
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreatePost from '../../../pages/CreatePost';
import * as imageService from '../../../services/imageService';
import * as postService from '../../../services/postService';

//Mock del context AuthContext
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    BrowserRouter: ({ children }) => <div>{children}</div>,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.mock('../../../context/AuthContext', () => ({
    useAuth: jest.fn()
}));

//Mock dei servizi
jest.mock('../../../services/imageService');
jest.mock('../../../services/postService');

//Import del mock AuthContext dopo il mock
import { useAuth } from '../../../context/AuthContext';

describe('CreatePost - Rendering e Autenticazione', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: rendering corretto con utente autenticato
    it('dovrebbe renderizzare correttamente con utente autenticato', () => {
        useAuth.mockReturnValue({
            currentUser: { uid: 'user123', email: 'test@test.com' }
        });

        render(
            <BrowserRouter>
                <CreatePost />
            </BrowserRouter>
        );

        expect(screen.getByText('Create a New Post')).toBeInTheDocument();
        expect(screen.getByLabelText('Content')).toBeInTheDocument();
        expect(screen.getByLabelText('Image (Optional)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    //Test: alert se utente non autenticato al submit
    it('dovrebbe mostrare alert se utente non autenticato al submit', async () => {
        useAuth.mockReturnValue({ currentUser: null });

        // Mock window.alert
        const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => { });

        render(
            <BrowserRouter>
                <CreatePost />
            </BrowserRouter>
        );

        const textarea = screen.getByLabelText('Content');
        fireEvent.change(textarea, { target: { value: 'Test post' } });

        const submitButton = screen.getByRole('button', { name: 'Post' });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('You must be logged in to create a post.');
        });

        alertMock.mockRestore();
    });
});

describe('CreatePost - Form Interactions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            currentUser: { uid: 'user123', email: 'test@test.com' }
        });
    });

    //Test: cambio valore textarea
    it('dovrebbe aggiornare il testo quando cambia la textarea', () => {
        render(
            <BrowserRouter>
                <CreatePost />
            </BrowserRouter>
        );

        const textarea = screen.getByLabelText('Content');
        fireEvent.change(textarea, { target: { value: 'My new post content' } });

        expect(textarea.value).toBe('My new post content');
    });

    //Test: selezione file immagine
    it('dovrebbe gestire la selezione del file immagine', () => {
        render(
            <BrowserRouter>
                <CreatePost />
            </BrowserRouter>
        );

        const fileInput = screen.getByLabelText('Image (Optional)');
        const file = new File(['image'], 'test.png', { type: 'image/png' });

        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(fileInput.files[0]).toBe(file);
        expect(fileInput.files).toHaveLength(1);
    });

    //Test: navigazione su click Cancel
    it('dovrebbe navigare alla home quando si clicca Cancel', () => {
        render(
            <BrowserRouter>
                <CreatePost />
            </BrowserRouter>
        );

        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        fireEvent.click(cancelButton);

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});

describe('CreatePost - Form Submission', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            currentUser: { uid: 'user123', email: 'test@test.com' }
        });
    });

    //Test: submit senza immagine (solo testo)
    it('dovrebbe creare post senza immagine', async () => {
        postService.createPost.mockResolvedValueOnce('post123');

        render(
            <BrowserRouter>
                <CreatePost />
            </BrowserRouter>
        );

        const textarea = screen.getByLabelText('Content');
        fireEvent.change(textarea, { target: { value: 'Post without image' } });

        const submitButton = screen.getByRole('button', { name: 'Post' });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(postService.createPost).toHaveBeenCalledWith({
                authorUid: 'user123',
                content: 'Post without image',
                imageUrl: null
            });
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    //Test: submit con immagine (upload + create)
    it('dovrebbe caricare immagine e creare post', async () => {
        imageService.validateImage.mockReturnValue(true);
        imageService.uploadImage.mockResolvedValueOnce('https://example.com/image.jpg');
        postService.createPost.mockResolvedValueOnce('post123');

        render(
            <BrowserRouter>
                <CreatePost />
            </BrowserRouter>
        );

        const textarea = screen.getByLabelText('Content');
        fireEvent.change(textarea, { target: { value: 'Post with image' } });

        const fileInput = screen.getByLabelText('Image (Optional)');
        const file = new File(['image'], 'test.png', { type: 'image/png' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        const submitButton = screen.getByRole('button', { name: 'Post' });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(imageService.validateImage).toHaveBeenCalledWith(file);
            expect(imageService.uploadImage).toHaveBeenCalledWith(file, 'posts');
            expect(postService.createPost).toHaveBeenCalledWith({
                authorUid: 'user123',
                content: 'Post with image',
                imageUrl: 'https://example.com/image.jpg'
            });
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    //Test: validazione immagine fallita
    it('dovrebbe fermare il submit se la validazione immagine fallisce', async () => {
        imageService.validateImage.mockReturnValue(false);

        render(
            <BrowserRouter>
                <CreatePost />
            </BrowserRouter>
        );

        const textarea = screen.getByLabelText('Content');
        fireEvent.change(textarea, { target: { value: 'Test content' } });

        const fileInput = screen.getByLabelText('Image (Optional)');
        const file = new File(['image'], 'test.png', { type: 'image/png' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        const submitButton = screen.getByRole('button', { name: 'Post' });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(imageService.validateImage).toHaveBeenCalledWith(file);
            expect(imageService.uploadImage).not.toHaveBeenCalled();
            expect(postService.createPost).not.toHaveBeenCalled();
        });
    });

    //Test: errore upload immagine
    it('dovrebbe mostrare alert in caso di errore upload', async () => {
        imageService.validateImage.mockReturnValue(true);
        imageService.uploadImage.mockRejectedValueOnce(new Error('Upload failed'));

        const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => { });

        render(
            <BrowserRouter>
                <CreatePost />
            </BrowserRouter>
        );

        const textarea = screen.getByLabelText('Content');
        fireEvent.change(textarea, { target: { value: 'Test content' } });

        const fileInput = screen.getByLabelText('Image (Optional)');
        const file = new File(['image'], 'test.png', { type: 'image/png' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        const submitButton = screen.getByRole('button', { name: 'Post' });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('Failed to create post: Upload failed');
        });

        alertMock.mockRestore();
    });

    //Test: errore createPost API
    it('dovrebbe mostrare alert in caso di errore API', async () => {
        postService.createPost.mockRejectedValueOnce(new Error('API Error'));

        const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => { });

        render(
            <BrowserRouter>
                <CreatePost />
            </BrowserRouter>
        );

        const textarea = screen.getByLabelText('Content');
        fireEvent.change(textarea, { target: { value: 'Test content' } });

        const submitButton = screen.getByRole('button', { name: 'Post' });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('Failed to create post: API Error');
        });

        alertMock.mockRestore();
    });
});

describe('CreatePost - Loading States', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            currentUser: { uid: 'user123', email: 'test@test.com' }
        });
    });

    //Test: disabilitazione pulsanti durante loading
    it('dovrebbe disabilitare il pulsante durante il submit', async () => {
        postService.createPost.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(
            <BrowserRouter>
                <CreatePost />
            </BrowserRouter>
        );

        const textarea = screen.getByLabelText('Content');
        fireEvent.change(textarea, { target: { value: 'Test content' } });

        const submitButton = screen.getByRole('button', { name: 'Post' });
        fireEvent.click(submitButton);

        // Durante il loading
        await waitFor(() => {
            expect(submitButton).toBeDisabled();
            expect(screen.getByText('Posting...')).toBeInTheDocument();
        });
    });

    //Test: testo "Posting..." durante submit
    it('dovrebbe mostrare testo "Posting..." durante il caricamento', async () => {
        let resolvePost;
        postService.createPost.mockReturnValue(new Promise(resolve => {
            resolvePost = resolve;
        }));

        render(
            <BrowserRouter>
                <CreatePost />
            </BrowserRouter>
        );

        const textarea = screen.getByLabelText('Content');
        fireEvent.change(textarea, { target: { value: 'Test content' } });

        const submitButton = screen.getByRole('button', { name: 'Post' });
        fireEvent.click(submitButton);

        // Durante loading
        expect(await screen.findByText('Posting...')).toBeInTheDocument();

        // Completa la promise
        resolvePost('post123');

        // Dopo loading dovrebbe tornare "Post"
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });
});
