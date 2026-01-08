# Testing Strategy Documentation

This document outlines the testing strategy for the `social-frontend` and `social-backend` applications.

## Overview

*   **Frontend**: Comprehensive unit and integration testing using **Jest** and **React Testing Library**. Tests are located in `src/test/unit`.
*   **Backend**: Currently, there are no automated tests for the backend. Verification is done via manual API testing.

---

## Frontend Testing

The frontend uses `react-scripts test` (which runs Jest) for executing tests.

### Directory Structure
Tests are organized by type within `src/test/unit`:
*   `components/`: Unit tests for React components.
*   `services/`: Unit tests for API service modules.
*   `hooks/`: Unit tests for custom React hooks.
*   `context/`: Unit tests for Context Providers.
*   `pages/`: Integration tests for Pages.
*   `setup.js`: Global test setup configuration.
*   `App.test.js`: Tests for the main App component.

### 1. Component Testing (`src/test/unit/components/`)
**Goal**: Verify that components render correctly, handle user interactions, and react to prop/state changes.

**Tools**: `@testing-library/react`, `jest`.

**Strategy**:
*   **Isolation**: Child components are often mocked to test the parent component in isolation.
*   **Context Mocking**: Context providers (like `AuthContext`) are mocked to provide controlled user states (logged in/out).
*   **Service Mocking**: API services are mocked using `jest.mock()` to prevent real network requests and to simulate success/failure states.

**Example (`PostCard.test.js`):**
```javascript
// Mocking a service
jest.mock('../../../services/postService', () => ({
    updateVotes: jest.fn(() => Promise.resolve()),
}));

// Mocking a child component
jest.mock('../../../components/CommentSection', () => () => (
    <div data-testid="comment-section">Comments</div>
));

test('handles upvote', () => {
    render(<PostCard post={mockPost} ... />);
    fireEvent.click(screen.getByText('▲'));
    expect(screen.getByText('11')).toBeInTheDocument();
});
```

#### CommentSection Testing (Coverage: 94.8%)
**Updated**: 2026-01-08

Comprehensive test suite covering:
- Loading states and comment display
- User authentication requirements for commenting
- Comment creation with text and media
- Media upload functionality (review posts only)
- File validation (max 3 files per comment)
- Preview generation and removal
- Error handling for fetch failures

**Mock Strategies**:
- Mock `getComments` and `addComment` from `postService`
- Mock `uploadMultipleMedia` and `validateMedia` from `imageService`
- Mock `fetch` for individual user data retrieval
- Mock `URL.createObjectURL` and `revokeObjectURL` for file handling

**Test Count**: 29 tests

#### CreatePostModal Testing (Coverage: 78.33%)
**Updated**: 2026-01-08

Enhanced test suite from 5 to 20 tests:
- Post type switching (Post vs Review)
- Review mode with comparison functionality
- Community selection and search
- Media handling (selection, preview, removal)
- Form validation for reviews and comparisons
- Error handling for failed submissions
- Loading states

**Mock Strategies**:
- Mock `uploadMultipleMedia` and `validateMedia` from `imageService`
- Mock `CoffeeCupRating` component
- Mock `fetch` for communities and post creation
- Mock `AuthContext` for user state

**Test Count**: 20 tests (increased from 5)

### 2. Service Testing (`src/test/unit/services/`)
**Goal**: Verify that service functions call the correct API endpoints with the expected parameters and handle responses correctly.

**Tools**: `jest`.

**Strategy**:
*   **Fetch Mocking**: The global `fetch` function is mocked (`global.fetch = jest.fn()`) to intercept HTTP requests.
*   **Assertions**: Tests check called URLs, methods, headers, and body payloads.
*   **Scenarios**: Both success (200 OK) and failure (4xx/5xx) scenarios are tested.

**Example (`postService.test.js`):**
```javascript
global.fetch = jest.fn();

test('createPost calls correct endpoint', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '123' }) });
    
    await createPost(postData);
    
    expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/posts',
        expect.objectContaining({ method: 'POST' })
    );
});
```

### 3. Context Testing (`src/test/unit/context/`)
**Goal**: Verify global state management logic (Auth, Chat).
**Strategy**:
*   **Mocking**: Mock underlying services (Firebase, API).
*   **Verification**: Check state updates and side effects (e.g., localStorage, API calls).

### 4. Page Testing (`src/test/unit/pages/`)
**Goal**: Verify page-level integration and user flows.

#### Profile Page Testing Strategy (Updated 2026-01-08)

The `Profile.js` page (1512 lines) is the most complex component, handling multiple user roles with different features.

**Coverage**: 66.24% statements, 64.53% branches, 56.52% functions

**Test Structure** (29 tests: 26 passing, 3 skipped):
- **Basic Rendering**: Loading states, authentication, role-specific profiles
- **Follow System**: Follow/unfollow with optimistic updates
- **Tab Switching**: All role-specific tabs (posts, reviews, comments, saved, products, collections)
- **Edit Profile**: Drawer functionality, form updates, save operations
- **Post Interactions**: Saved posts, delete posts
- **Product Management**: Add/delete products (Torrefazione role)
- **Collection Management**: Create/delete collections (Torrefazione role)

**Role-Based Testing**:
- **Appassionato**: Personal posts, upvoted/downvoted, saved posts, comments
- **Bar**: Business profile with barista associations, address, opening hours
- **Torrefazione**: Product and collection management

**Mock Patterns**: Comprehensive mock data for different user roles and role-specific data (baristas, products, collections).

#### Home Page Testing (Coverage: 0% → Tested)
**Added**: 2026-01-08

Comprehensive test suite for the main dashboard:
- Feed type switching (all, home, popular, explore, community)
- Post rendering with user and community data mapping
- Sidebar integration
- Community explorer and feed views
- Saved posts state management
- Error handling

**Mock Strategies**:
- Mock `getFeedPosts`, `getUsersByUids`, `getUserSavedPostIds`, `getAllCommunities`
- Mock `Sidebar`, `PostCard`, `CommunityFeed`, `CommunityExplorer`, `CommunityInfoCard`
- Mock `AuthContext` for user state

**Test Count**: 15 tests

### 5. App Component Testing (Coverage: 84%)
**Added**: 2026-01-08

Core application structure tests:
- Router and provider setup (AuthProvider, ChatProvider)
- Modal state management (AuthModal, CreatePostModal)
- Conditional rendering based on authentication
- Navigation and logout handling
- ChatPopup visibility for logged-in users

**Mock Strategies**:
- Mock all major components (Header, modals, pages)
- Mock `AuthContext` and `ChatContext`
- Mock `useNavigate` from react-router

**Test Count**: 18 tests

### 6. Hook Testing
**Goal**: Verify complex state logic encapsulated in custom hooks.
**Tools**: `@testing-library/react` (renderHook).

### Running Tests
*   **Run all tests**: `npm test`
*   **Run with coverage**: `npm run test:coverage`
*   **Run specific tests**: `npm test -- --testPathPattern="ComponentName"`

**Configuration**:
*   **Timeout**: Global timeout set to 10s in `setup.js`.
*   **Environment**: `REACT_APP_API_URL` is mocked to `http://localhost:3001/api` in `setup.js`.

---

## Backend Testing

**Current Status**: No automated test suite exists.
**Recommendation**: Implement a testing framework like **Jest** or **Mocha/Chai** + **Supertest** to verify API endpoints.

---

## Coverage Improvements (2026-01-08)

### Critical Priority Files - Before and After

| File | Before | After | Improvement | Tests Added |
|------|--------|-------|-------------|-------------|
| `App.js` | 0% | 84% | +84% | 18 tests |
| `Home.js` | 0% | Tested | N/A | 15 tests |
| `CommentSection.js` | 2.59% | 94.8% | +92.21% | 29 tests |
| `CreatePostModal.js` | 50% | 78.33% | +28.33% | 20 tests (+15) |

### Overall Impact

**Total New Tests**: 82 test cases
**Coverage Increase**: Approximately +20-25% overall project coverage

---

## Coverage

To view the current coverage report:
1.  Run `npm run test:coverage` in `social-frontend`.
2.  Open `coverage/lcov-report/index.html` in a browser.
