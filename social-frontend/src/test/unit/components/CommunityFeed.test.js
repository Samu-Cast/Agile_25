import { render, screen, waitFor } from '@testing-library/react';
import CommunityFeed from '../../../components/CommunityFeed';
import { getUsersByUids } from '../../../services/userService';
import React from 'react';

// Mock dependencies
jest.mock('../../../services/userService');
jest.mock('../../../components/PostCard', () => ({ post }) => (
    <div data-testid="post-card">{post.content}</div>
));

global.fetch = jest.fn();

describe('CommunityFeed', () => {
    const mockCommunity = {
        id: 'c1',
        name: 'Coffee Lovers',
        description: 'Best coffee',
        creatorId: 'creator1',
        avatar: 'avatar.png',
        banner: 'banner.png'
    };
    const mockPosts = [
        { id: 'p1', uid: 'u1', text: 'Hello World', createdAt: new Date().toISOString() }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock community details fetch
        fetch.mockImplementation((url) => {
            if (url.includes('/communities/c1')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockCommunity
                });
            }
            if (url.includes('/posts')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockPosts
                });
            }
            return Promise.resolve({ ok: false });
        });

        getUsersByUids.mockResolvedValue([
            { uid: 'u1', name: 'User 1', profilePic: 'pic.png' }
        ]);
    });

    test('renders loading state initially', () => {
        render(<CommunityFeed communityId="c1" />);
        expect(screen.getByText('Loading Community...')).toBeInTheDocument();
    });

    test('renders community info and posts', async () => {
        render(<CommunityFeed communityId="c1" user={{ uid: 'currentUser' }} />);

        await waitFor(() => {
            expect(screen.getByText('Coffee Lovers')).toBeInTheDocument();
            expect(screen.getByText('Best coffee')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByTestId('post-card')).toHaveTextContent('Hello World');
        });
    });

    test('renders empty state when no posts', async () => {
        fetch.mockImplementation((url) => {
            if (url.includes('/communities/c1')) {
                return Promise.resolve({ ok: true, json: async () => mockCommunity });
            }
            if (url.includes('/posts')) {
                return Promise.resolve({ ok: true, json: async () => [] });
            }
            return Promise.resolve({ ok: false });
        });

        render(<CommunityFeed communityId="c1" user={{ uid: 'currentUser' }} />);

        await waitFor(() => {
            expect(screen.getByText(/No posts yet/i)).toBeInTheDocument();
        });
    });
});
