import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommentSection from '../../../components/CommentSection';

// Mock services
jest.mock('../../../services/postService');
jest.mock('../../../services/imageService');
jest.mock('../../../services/userService');

import * as postService from '../../../services/postService';
import * as imageService from '../../../services/imageService';
import { getUsersByUids } from '../../../services/userService';

// Mock AuthContext
const mockCurrentUser = { uid: 'user1', email: 'test@test.com' };
jest.mock('../../../context/AuthContext', () => ({
    useAuth: jest.fn(() => ({ currentUser: mockCurrentUser }))
}));

const { useAuth } = require('../../../context/AuthContext');

// Mock URL methods
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('CommentSection Component', () => {
    const mockPostId = 'post123';
    const mockComments = [
        {
            id: 'comment1',
            uid: 'user1',
            text: 'Great post!'
        },
        {
            id: 'comment2',
            uid: 'user2',
            text: 'I agree!',
            mediaUrls: ['video.mp4', 'image.jpg']
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock implementations
        postService.getComments.mockResolvedValue(mockComments);
        postService.addComment.mockResolvedValue({ id: 'new-comment' });
        imageService.uploadMultipleMedia.mockResolvedValue(['uploaded1.jpg']);
        imageService.validateMedia.mockReturnValue(true);

        getUsersByUids.mockResolvedValue([
            {
                uid: 'user1',
                name: 'User One',
                displayName: 'User One',
                profilePic: 'pic1.jpg'
            },
            {
                uid: 'user2',
                name: 'User Two',
                displayName: 'User Two',
                photoURL: null
            }
        ]);

        useAuth.mockReturnValue({ currentUser: mockCurrentUser });
    });

    describe('Loading and Display States', () => {
        it('shows loading state while fetching comments', () => {
            postService.getComments.mockImplementation(() => new Promise(() => { })); // Never resolves

            render(<CommentSection postId={mockPostId} postType="post" />);

            expect(screen.getByText('Caricamento commenti...')).toBeInTheDocument();
        });

        it('displays comments after loading', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            await waitFor(() => {
                expect(screen.getByText('Great post!')).toBeInTheDocument();
                expect(screen.getByText('I agree!')).toBeInTheDocument();
            });
        });

        it('shows empty state when no comments exist', async () => {
            postService.getComments.mockResolvedValue([]);

            render(<CommentSection postId={mockPostId} postType="post" />);

            await waitFor(() => {
                expect(screen.getByText('Nessun commento ancora. Sii il primo!')).toBeInTheDocument();
            });
        });

        it('fetches comments on mount', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            await waitFor(() => {
                expect(postService.getComments).toHaveBeenCalledWith(mockPostId);
            });
        });

        it('refetches comments when postId changes', async () => {
            const { rerender } = render(<CommentSection postId="post1" postType="post" />);

            await waitFor(() => {
                expect(postService.getComments).toHaveBeenCalledWith('post1');
            });

            jest.clearAllMocks();

            rerender(<CommentSection postId="post2" postType="post" />);

            await waitFor(() => {
                expect(postService.getComments).toHaveBeenCalledWith('post2');
            });
        });
    });

    describe('Comment Display', () => {
        it('displays comment author names and text', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            await waitFor(() => {
                expect(screen.getByText('User One')).toBeInTheDocument();
                expect(screen.getByText('User Two')).toBeInTheDocument();
                expect(screen.getByText('Great post!')).toBeInTheDocument();
                expect(screen.getByText('I agree!')).toBeInTheDocument();
            });
        });

        it('displays author profile picture when available', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            await waitFor(() => {
                const images = screen.getAllByRole('img');
                const profilePic = images.find(img => img.src.includes('pic1.jpg'));
                expect(profilePic).toBeInTheDocument();
            });
        });

        it('displays placeholder when author has no profile picture', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            await waitFor(() => {
                expect(screen.getByText('U')).toBeInTheDocument(); // First letter of "User Two"
            });
        });

        it('displays comment media (images and videos)', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            await waitFor(() => {
                const container = screen.getByText('I agree!').closest('.comment-content');
                const videos = container.querySelectorAll('video');
                expect(videos.length).toBeGreaterThan(0);

                const images = container.querySelectorAll('img');
                expect(images.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Comment Creation - Logged In User', () => {
        it('shows comment form when user is logged in', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Scrivi un commento...')).toBeInTheDocument();
                expect(screen.getByRole('button', { name: '➤' })).toBeInTheDocument();
            });
        });

        it('allows user to type a comment', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            const input = screen.getByPlaceholderText('Scrivi un commento...');
            fireEvent.change(input, { target: { value: 'New comment!' } });

            expect(input.value).toBe('New comment!');
        });

        it('submits comment with text only', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            const input = screen.getByPlaceholderText('Scrivi un commento...');
            fireEvent.change(input, { target: { value: 'New comment!' } });

            const submitButton = screen.getByRole('button', { name: '➤' });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(postService.addComment).toHaveBeenCalledWith(
                    mockPostId,
                    expect.objectContaining({
                        text: 'New comment!',
                        authorUid: 'user1',
                        parentComment: null,
                        mediaUrls: []
                    })
                );
            });
        });

        it('reloads comments after successful submission', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            jest.clearAllMocks();

            const input = screen.getByPlaceholderText('Scrivi un commento...');
            fireEvent.change(input, { target: { value: 'New comment!' } });

            const submitButton = screen.getByRole('button', { name: '➤' });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(postService.getComments).toHaveBeenCalledTimes(1);
            });
        });

        it('clears input after submission', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            const input = screen.getByPlaceholderText('Scrivi un commento...');
            fireEvent.change(input, { target: { value: 'New comment!' } });

            const submitButton = screen.getByRole('button', { name: '➤' });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(input.value).toBe('');
            });
        });

        it('disables submit button when input is empty', () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            const submitButton = screen.getByRole('button', { name: '➤' });
            expect(submitButton).toBeDisabled();
        });

        it('enables submit button when input has text', () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            const input = screen.getByPlaceholderText('Scrivi un commento...');
            fireEvent.change(input, { target: { value: 'Test' } });

            const submitButton = screen.getByRole('button', { name: '➤' });
            expect(submitButton).not.toBeDisabled();
        });

        it('does not submit when input is only whitespace', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            const input = screen.getByPlaceholderText('Scrivi un commento...');
            fireEvent.change(input, { target: { value: '   ' } });

            const submitButton = screen.getByRole('button', { name: '➤' });
            fireEvent.click(submitButton);

            expect(postService.addComment).not.toHaveBeenCalled();
        });
    });

    describe('Comment Creation - Not Logged In', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({ currentUser: null });
        });

        it('hides comment form when user is not logged in', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            await waitFor(() => {
                expect(screen.queryByPlaceholderText('Scrivi un commento...')).not.toBeInTheDocument();
            });
        });
    });

    describe('Media Upload - Review Posts', () => {
        it('shows media upload button for review posts', async () => {
            render(<CommentSection postId={mockPostId} postType="review" />);

            await waitFor(() => {
                const mediaLabel = screen.getByTitle('Aggiungi foto/video');
                expect(mediaLabel).toBeInTheDocument();
            });
        });

        it('does not show media upload button for regular posts', async () => {
            render(<CommentSection postId={mockPostId} postType="post" />);

            await waitFor(() => {
                const mediaInput = screen.queryByTitle('Aggiungi foto/video');
                expect(mediaInput).not.toBeInTheDocument();
            });
        });

        it('handles file selection and creates previews', async () => {
            render(<CommentSection postId={mockPostId} postType="review" />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Scrivi un commento...')).toBeInTheDocument();
            });

            const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
            const input = document.querySelector(`input[id="comment-media-${mockPostId}"]`);

            Object.defineProperty(input, 'files', {
                value: [file],
                writable: false
            });

            fireEvent.change(input);

            await waitFor(() => {
                expect(imageService.validateMedia).toHaveBeenCalledWith(file);
            });
        });

        it('limits media files to maximum 3', async () => {
            window.alert = jest.fn();

            render(<CommentSection postId={mockPostId} postType="review" />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Scrivi un commento...')).toBeInTheDocument();
            });

            const files = [
                new File(['1'], 'test1.jpg', { type: 'image/jpeg' }),
                new File(['2'], 'test2.jpg', { type: 'image/jpeg' }),
                new File(['3'], 'test3.jpg', { type: 'image/jpeg' }),
                new File(['4'], 'test4.jpg', { type: 'image/jpeg' })
            ];

            const input = document.querySelector(`input[id="comment-media-${mockPostId}"]`);
            Object.defineProperty(input, 'files', {
                value: files,
                writable: false
            });

            fireEvent.change(input);

            expect(window.alert).toHaveBeenCalledWith('Massimo 3 file per commento');
        });

        it('removes media from preview', async () => {
            render(<CommentSection postId={mockPostId} postType="review" />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Scrivi un commento...')).toBeInTheDocument();
            });

            const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
            const input = document.querySelector(`input[id="comment-media-${mockPostId}"]`);
            Object.defineProperty(input, 'files', {
                value: [file],
                writable: false
            });

            fireEvent.change(input);

            await waitFor(() => {
                const removeButtons = screen.getAllByText('×');
                expect(removeButtons.length).toBeGreaterThan(0);
            });

            const removeButton = screen.getAllByText('×')[0];
            fireEvent.click(removeButton);

            await waitFor(() => {
                expect(global.URL.revokeObjectURL).toHaveBeenCalled();
            });
        });

        it('uploads media files when submitting comment', async () => {
            render(<CommentSection postId={mockPostId} postType="review" />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Scrivi un commento...')).toBeInTheDocument();
            });

            const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
            const input = document.querySelector(`input[id="comment-media-${mockPostId}"]`);
            Object.defineProperty(input, 'files', {
                value: [file],
                writable: false
            });

            fireEvent.change(input);

            const textInput = screen.getByPlaceholderText('Scrivi un commento...');
            fireEvent.change(textInput, { target: { value: 'Comment with media' } });

            const submitButton = screen.getByRole('button', { name: '➤' });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(imageService.uploadMultipleMedia).toHaveBeenCalledWith([file], 'comments');
                expect(postService.addComment).toHaveBeenCalledWith(
                    mockPostId,
                    expect.objectContaining({
                        text: 'Comment with media',
                        mediaUrls: ['uploaded1.jpg']
                    })
                );
            });
        });

        it('clears media previews after successful submission', async () => {
            render(<CommentSection postId={mockPostId} postType="review" />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Scrivi un commento...')).toBeInTheDocument();
            });

            const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
            const input = document.querySelector(`input[id="comment-media-${mockPostId}"]`);
            Object.defineProperty(input, 'files', {
                value: [file],
                writable: false
            });

            fireEvent.change(input);

            await waitFor(() => {
                expect(screen.getByText('×')).toBeInTheDocument();
            });

            const textInput = screen.getByPlaceholderText('Scrivi un commento...');
            fireEvent.change(textInput, { target: { value: 'Comment' } });

            const submitButton = screen.getByRole('button', { name: '➤' });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.queryByText('×')).not.toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('handles error when loading comments fails', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
            postService.getComments.mockRejectedValue(new Error('Failed to load'));

            render(<CommentSection postId={mockPostId} postType="post" />);

            await waitFor(() => {
                expect(consoleError).toHaveBeenCalledWith('Error loading comments:', expect.any(Error));
            });

            consoleError.mockRestore();
        });

        it('handles error when adding comment fails', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
            postService.addComment.mockRejectedValue(new Error('Failed to add'));

            render(<CommentSection postId={mockPostId} postType="post" />);

            const input = screen.getByPlaceholderText('Scrivi un commento...');
            fireEvent.change(input, { target: { value: 'Test comment' } });

            const submitButton = screen.getByRole('button', { name: '➤' });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(consoleError).toHaveBeenCalledWith('Error adding comment:', expect.any(Error));
            });

            consoleError.mockRestore();
        });
    });
});
