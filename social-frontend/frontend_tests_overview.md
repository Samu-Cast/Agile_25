# Frontend Test Documentation

This document provides an overview of the unit tests implemented in the `social-frontend` application. Tests are located in `src/test/unit` and are categorized by type: Components, Services, and Hooks.

## 1. Component Tests (`src/test/unit/components`)

These tests verify the rendering, interaction, and state management of React components. They mock external dependencies like API services and Context providers (`AuthContext`, `ChatContext`).

### `AuthModal.test.js`
**Tested Component:** `AuthModal.js`
- **Purpose:** Verifies the authentication modal behavior.
- **Key Tests:**
    - Renders in "Login" mode by default.
    - Switches between "Login" and "Register" tabs.
    - Integration with mocked `Login` and `Register` pages.
    - Prevents closing when clicking inside the modal content.
    - Propagates success events (e.g., login success) to the parent.

### `CreatePostModal.test.js`
**Tested Component:** `CreatePostModal.js`
- **Purpose:** Tests the creation of posts and reviews.
- **Key Tests:**
    - Renders basic post form elements.
    - Switches to "Review" mode, displaying additional fields (item name, type, rating).
    - Submits a simple post via `fetch` (POST `/posts`).
    - Submits a review with specialized data.
    - **Validation:** Ensures required fields (e.g., item name) are present for reviews.
    - **Accessibility:** Verifies inputs are correctly associated with labels.
    - Fetches user communities to populate the "Post to" dropdown.

### `Header.test.js`
**Tested Component:** `Header.js`
- **Purpose:** Verifies the main application header.
- **Key Tests:**
    - Renders logo and navigation elements.
    - Shows "Login" button when user is authenticated.
    - Displays user profile and dropdown menu when logged in.
    - Toggles chat window.
    - Handles logout via `userService.logout`.

### `PostCard.test.js`
**Tested Component:** `PostCard.js`
- **Purpose:** A comprehensive test suite for the feed item component.
- **Key Tests:**
    - **Rendering:** Displays user info, timestamp, text, and media (images/videos).
    - **Reviews:** Shows "Coffee Cup Rating" and review details (brand, item name) if the post is a review.
    - **Interactions:**
        - Like/Unlike functionality.
        - Save/Unsave post.
        - Toggling the comment section.
    - **Community:** Displays community badge if the post belongs to one.
    - **Media:** Handles single images and multi-image galleries.

### `Sidebar.test.js`
**Tested Component:** `Sidebar.js`
- **Purpose:** Verifies the side navigation bar.
- **Key Tests:**
    - Renders standard navigation links (Home, Explore, etc.).
    - Highlights the active link based on the current feed type.
    - Fetches and displays the user's communities.
    - Opens the "Create Community" modal.
    - Handles collapsible state (expand/collapse sidebar).

### `StarRating.test.js`
**Tested Component:** `StarRating.js`
- **Purpose:** Tests the interactive star rating input.
- **Key Tests:**
    - visualises correct number of stars (5).
    - Calculates and displays average rating (e.g., "4.0 ☕").
    - Interactive voting works for logged-in users.
    - Shows an alert if a non-logged-in user attempts to vote.

---

## 2. Service Tests (`src/test/unit/services`)

These tests verify the logic of API wrapper functions. They use `jest.spyOn(global, 'fetch')` to mock network requests and assert that the correct endpoints and payloads are sent.

### `collectionService.test.js`
- **Purpose:** Tests CRUD operations for Roastery Collections.
- **Functions Tested:**
    - `getCollections`: Fetches collections for a specific roaster.
    - `createCollection`: Sends POST request to create a new collection.
    - `updateCollection`: Sends PUT request to update details.
    - `deleteCollection`: Sends DELETE request.

### `communityService.test.js`
- **Purpose:** Tests fetching of Community data.
- **Functions Tested:**
    - `getCommunitiesByIds`: Retrieves multiple communities, handling locally cached items to minimize API calls.
    - `getCommunity`: Fetches a single community by ID.
    - `getAllCommunities`: Fetches the list of all communities.

### `imageService.test.js`
- **Purpose:** Tests image validation and uploading utilities.
- **Functions Tested:**
    - `validateImage`: Checks file type (JPEG, PNG, etc.) and size limits (< 5MB).
    - `uploadImage`: Simulates uploading a file by creating `FormData` and sending a POST request. Verifies correct return of the image URL or error handling.

### `postService.test.js`
- **Purpose:** Tests post-related API calls.
- **Functions Tested:**
    - `getPosts`: Fetches feed posts with pagination and filters.
    - `toggleLikePost`: Handles liking/unliking logic.
    - `toggleSavePost`: Handles saving/unsaving posts.

### `userService.test.js`
- **Purpose:** Tests user management API calls.
- **Functions Tested:**
    - `getUser`: Fetches user profile data.
    - `searchUsers`: Helper for user search functionality.
    - `updateUserProfile`: Sends updates to user profile fields.

---

## 3. Hook Tests (`src/test/unit/hooks`)

These tests verify custom React hooks using `@testing-library/react-hooks` (or `renderHook` from the main library).

### `useUserData.test.js`
- **Purpose:** Tests hooks that fetch and provide user data.
- **Hooks Tested:**
    - `useUserData`: Verifies it calls `userService.getUser` and returns the resolved user object.
    - `useRoleData`: Verifies it conditionally fetches extra profile data based on user role (e.g., fetching "Roastery" details if role is "Torrefazione", or "Bar" details if role is "Bar"). Returns `null` for roles without extra profiles (e.g., "Appassionato").

---

## Summary of Coverage
- **Core User Flow:** Authentication, Posting, Feed viewing, and Navigation are well-covered.
- **Data Layer:** All major services have unit tests verifying network interactions.
- **Edge Cases:** Tests cover error states (fetch failures), validation errors (file size, form requirements), and empty states.
