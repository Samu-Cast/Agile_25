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

### 2. Service Testing (`src/test/unit/services/`)
**Goal**: Verify that service functions call the correct API endpoints with the expected parameters and handle responses correctly.

**Tools**: `jest`.

**Strategy**:
*   **Fetch Mocking**: The global `fetch` function is mocked (`global.fetch = jest.fn()`) to intercept HTTP requests.
*   **Assertions**: Tests check called URLs, methods, headers, and body payloads.
*   **scenarios**: Both success (200 OK) and failure (4xx/5xx) scenarios are tested.

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
**Example**: `Login.test.js` verifies form submission and error handling.

### 5. Hook Testing
**Goal**: Verify complex state logic encapsulated in custom hooks.
**Tools**: `@testing-library/react` (renderHook).

### Running Tests
*   **Run all tests**: `npm test`
*   **Run with coverage**: `npm run test:coverage`

**Configuration**:
*   **Timeout**: Global timeout set to 10s in `setup.js`.
*   **Environment**: `REACT_APP_API_URL` is mocked to `http://localhost:3001/api` in `setup.js`.

---

## Backend Testing

**Current Status**: No automated test suite exists.
**Recommendation**: Implement a testing framework like **Jest** or **Mocha/Chai** + **Supertest** to verify API endpoints.

---

## Coverage
To view the current coverage report:
1.  Run `npm run test:coverage` in `social-frontend`.
2.  Open `coverage/lcov-report/index.html` in a browser.
