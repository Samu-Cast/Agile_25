import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../../../pages/Home';
import * as postService from '../../../services/postService';
import * as userService from '../../../services/userService';
import * as communityService from '../../../services/communityService';

// Mock services
jest.mock('../../../services/postService');
jest.mock('../../../services/userService');
jest.mock('../../../services/communityService');

// Mock components
jest.mock('../../../components/Sidebar', () => {
    return function MockSidebar({ activeFeed, onFeedChange, refreshTrigger }) {
        return (
            <div data-testid="sidebar">
                <button onClick={() => onFeedChange('all')}>All</button>
                <button onClick={() => onFeedChange('home')}>Home</button>
                <button onClick={() => onFeedChange('popular')}>Popular</button>
                <button onClick={() => onFeedChange('explore')}>Explore</button>
                <button onClick={() => onFeedChange('community-c1')}>Community 1</button>
                <span data-testid="refresh-trigger">{refreshTrigger}</span>
            </div>
        );
    };
});

jest.mock('../../../components/PostCard', () => {
    return function MockPostCard({ post, currentUser, isLoggedIn }) {
        return (
            <div data-testid={`post-card-${post.id}`}>
                <span>{post.author}</span>
                <span>{post.content}</span>
                <span>{isLoggedIn ? 'Logged In' : 'Logged Out'}</span>
                <span data-testid={`post-saved-${post.id}`}>{post.isSaved ? 'Saved' : 'Not Saved'}</span>
            </div>
        );
    };
});

jest.mock('../../../components/CommunityExplorer', () => {
    return function MockCommunityExplorer({ currentUser, onNavigate, onCommunityUpdate }) {
        return (
            <div data-testid="community-explorer">
                <span>Community Explorer</span>
                <button onClick={() => onNavigate('community-c1')}>Join Community</button>
                <button onClick={onCommunityUpdate}>Update Communities</button>
            </div>
        );
    };
});

jest.mock('../../../components/CommunityFeed', () => {
    const React = require('react');
    return function MockCommunityFeed({ communityId, isLoggedIn, user, onCommunityUpdate, onCommunityLoaded }) {
        React.useEffect(() => {
            // Simulate loading community data
            if (onCommunityLoaded) {
                onCommunityLoaded({ id: communityId, name: 'Test Community' });
            }
        }, [communityId, onCommunityLoaded]);

        return (
            <div data-testid="community-feed">
                <span>Community Feed - {communityId}</span>
                <button onClick={onCommunityUpdate}>Update</button>
            </div>
        );
    };
});

jest.mock('../../../components/CommunityInfoCard', () => {
    return function MockCommunityInfoCard({ community, currentUser, onCommunityUpdate }) {
        return (
            <div data-testid="community-info-card">
                <span>{community?.name}</span>
                <button onClick={onCommunityUpdate}>Update</button>
            </div>
        );
    };
});

// Mock AuthContext
const mockCurrentUser = { uid: 'user1', email: 'test@test.com' };
jest.mock('../../../context/AuthContext', () => ({
    useAuth: jest.fn(() => ({ currentUser: mockCurrentUser }))
}));

const { useAuth } = require('../../../context/AuthContext');

describe('Home Component', () => {
    const mockPosts = [
        {
            id: 'post1',
            uid: 'user1',
            text: 'Test post 1',
            votes: 10,
            commentsCount: 5,
            createdAt: new Date('2024-01-01').toISOString(),
            type: 'post'
        },
        {
            id: 'post2',
            uid: 'user2',
            text: 'Test post 2',
            votes: 20,
            commentsCount: 3,
            createdAt: new Date('2024-01-02').toISOString(),
            type: 'review',
            reviewData: { rating: 4, itemName: 'Coffee' }
        }
    ];

    const mockUsers = [
        { uid: 'user1', name: 'User One', nickname: 'u1', profilePic: 'pic1.jpg' },
        { uid: 'user2', name: 'User Two', photoURL: 'pic2.jpg' }
    ];

    const mockCommunities = [
        { id: 'c1', name: 'Community 1', avatar: 'avatar1.jpg' }
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock implementations
        postService.getFeedPosts.mockResolvedValue(mockPosts);
        userService.getUsersByUids.mockResolvedValue(mockUsers);
        userService.getUserSavedPostIds.mockResolvedValue(['post1']);
        communityService.getAllCommunities.mockResolvedValue(mockCommunities);

        useAuth.mockReturnValue({ currentUser: mockCurrentUser });
    });

    describe('Basic Rendering', () => {
        it('renders Sidebar component', async () => {
            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        });

        it('renders Feed by default (feedType: all)', async () => {
            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(postService.getFeedPosts).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(screen.getByTestId('post-card-post1')).toBeInTheDocument();
                expect(screen.getByTestId('post-card-post2')).toBeInTheDocument();
            });
        });
    });

    describe('Feed Type Switching', () => {
        it('switches to home feed and fetches followed posts', async () => {
            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            // Click Home button in sidebar
            const homeButton = screen.getByText('Home');
            homeButton.click();

            await waitFor(() => {
                expect(postService.getFeedPosts).toHaveBeenCalledWith(
                    expect.objectContaining({
                        uid: 'user1',
                        filter: 'followed'
                    })
                );
            });
        });

        it('switches to popular feed with sort parameter', async () => {
            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            const popularButton = screen.getByText('Popular');
            popularButton.click();

            await waitFor(() => {
                expect(postService.getFeedPosts).toHaveBeenCalledWith(
                    expect.objectContaining({
                        sort: 'popular'
                    })
                );
            });
        });

        it('switches to explore view and shows CommunityExplorer', async () => {
            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            const exploreButton = screen.getByText('Explore');
            exploreButton.click();

            await waitFor(() => {
                expect(screen.getByTestId('community-explorer')).toBeInTheDocument();
            });

            // Should not show regular feed
            expect(screen.queryByTestId('post-card-post1')).not.toBeInTheDocument();
        });

        it('switches to community feed view', async () => {
            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            const communityButton = screen.getByText('Community 1');
            communityButton.click();

            await waitFor(() => {
                expect(screen.getByTestId('community-feed')).toBeInTheDocument();
                expect(screen.getByText('Community Feed - c1')).toBeInTheDocument();
            });
        });
    });

    describe('Data Fetching and Mapping', () => {
        it('fetches posts, users, and communities on mount', async () => {
            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(postService.getFeedPosts).toHaveBeenCalled();
                expect(userService.getUsersByUids).toHaveBeenCalledWith(['user1', 'user2']);
                expect(communityService.getAllCommunities).toHaveBeenCalled();
            });
        });

        it('maps user data correctly to posts', async () => {
            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            await waitFor(() => {
                const post1 = screen.getByTestId('post-card-post1');
                expect(post1).toHaveTextContent('u1'); // nickname is used
            });
        });

        it('fetches saved posts for logged in user', async () => {
            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(userService.getUserSavedPostIds).toHaveBeenCalledWith('user1');
            });

            await waitFor(() => {
                expect(screen.getByTestId('post-saved-post1')).toHaveTextContent('Saved');
                expect(screen.getByTestId('post-saved-post2')).toHaveTextContent('Not Saved');
            });
        });

        it('does not fetch saved posts when user is not logged in', async () => {
            useAuth.mockReturnValue({ currentUser: null });

            render(
                <BrowserRouter>
                    <Home isLoggedIn={false} />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(postService.getFeedPosts).toHaveBeenCalled();
            });

            // Should not call getSavedPostIds
            expect(userService.getUserSavedPostIds).not.toHaveBeenCalled();
        });
    });

    describe('Community View Features', () => {
        it('shows CommunityInfoCard when viewing a community', async () => {
            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            // Switch to community view
            const communityButton = screen.getByText('Community 1');
            communityButton.click();

            await waitFor(() => {
                expect(screen.getByTestId('community-info-card')).toBeInTheDocument();
                expect(screen.getByText('Test Community')).toBeInTheDocument();
            });
        });

        it('refreshes sidebar when community is updated from explorer', async () => {
            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            // Go to explore
            const exploreButton = screen.getByText('Explore');
            exploreButton.click();

            await waitFor(() => {
                expect(screen.getByTestId('community-explorer')).toBeInTheDocument();
            });

            const refreshTriggerBefore = screen.getByTestId('refresh-trigger').textContent;

            // Trigger update
            const updateButton = screen.getByText('Update Communities');
            updateButton.click();

            await waitFor(() => {
                const refreshTriggerAfter = screen.getByTestId('refresh-trigger').textContent;
                expect(refreshTriggerAfter).not.toBe(refreshTriggerBefore);
            });
        });

        it('navigates to community when selected from explorer', async () => {
            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            // Go to explore
            screen.getByText('Explore').click();

            await waitFor(() => {
                expect(screen.getByTestId('community-explorer')).toBeInTheDocument();
            });

            // Join community (which navigates to it)
            screen.getByText('Join Community').click();

            await waitFor(() => {
                expect(screen.getByTestId('community-feed')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('handles error when fetching posts fails', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
            postService.getFeedPosts.mockRejectedValue(new Error('Failed to fetch'));

            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(consoleError).toHaveBeenCalledWith('Error fetching posts:', expect.any(Error));
            });

            consoleError.mockRestore();
        });

        it('handles error when fetching saved posts fails', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
            userService.getUserSavedPostIds.mockRejectedValue(new Error('Failed to fetch saved'));

            render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(consoleError).toHaveBeenCalledWith('Error fetching saved posts:', expect.any(Error));
            });

            consoleError.mockRestore();
        });
    });

    describe('Layout and Styling', () => {
        it('applies community-view class when viewing a community', async () => {
            const { container } = render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            // Switch to community view
            screen.getByText('Community 1').click();

            await waitFor(() => {
                const mainContainer = container.querySelector('.main-container');
                expect(mainContainer).toHaveClass('community-view');
            });
        });

        it('does not apply community-view class for regular feeds', async () => {
            const { container } = render(
                <BrowserRouter>
                    <Home isLoggedIn={true} />
                </BrowserRouter>
            );

            await waitFor(() => {
                const mainContainer = container.querySelector('.main-container');
                expect(mainContainer).not.toHaveClass('community-view');
            });
        });
    });
});
