# Frontend Component Documentation

This document provides a detailed overview of the frontend components in the `social-frontend` application.

## Core Layout & Navigation

### `App.js`
**Path**: `src/App.js`

**Description**: The root component that sets up the application structure. It configures the Router, Context Providers (`AuthProvider`, `ChatProvider`), and defines the main Routes. It also handles global UI elements like the `Header`, `AuthModal`, `CreatePostModal`, and `ChatPopup`.

**Key Features**:
*   React Router setup (`BrowserRouter`).
*   Context Provider wrapping.
*   Global Modal state management (`showAuthModal`, `isCreatePostOpen`).
*   Global Chat Popup rendering (if logged in).

### `Header.js`
**Path**: `src/components/Header.js`

**Description**: The main navigation bar at the top of the application.

**Props**:
*   `onLoginClick` (func): Callback to open login modal.
*   `onLogoutClick` (func): Callback to handle logout.
*   `showProfile` (bool): Whether to show profile-related controls.
*   `isLoggedIn` (bool): User authentication status.
*   `currentUser` (object): Current user object.
*   `onCreatePostClick` (func): Callback to open create post modal.

**Functionality**:
*   **Search**: Real-time user search with debouncing.
*   **Navigation**: Links to Home and branding.
*   **User Actions**: Login/Register buttons or Profile/Chat/Logout controls.
*   **Profile Data**: Fetches and displays user profile picture.

### `Sidebar.js`
**Path**: `src/components/Sidebar.js`

**Description**: The side navigation drawer containing feed filters and community lists.

**Props**:
*   `activeFeed` (string): Current active feed identifier ('home', 'popular', 'all', 'explore', 'community-ID').
*   `onFeedChange` (func): Callback to change the active feed.
*   `refreshTrigger` (any): Dependency to trigger re-fetching of communities.

**Functionality**:
*   **Feed Navigation**: Switch between Home, Popular, All, and Explore.
*   **Community Management**: Lists user's joined and created communities.
*   **Collapsible**: Can be collapsed/expanded.

## Feed & Content Display

### `PostCard.js`
**Path**: `src/components/PostCard.js`

**Description**: A reusable card component to display posts and reviews.

**Props**:
*   `post` (object): The post data (content, author, votes, media, review data, etc.).
*   `currentUser` (object): The current logged-in user.
*   `isLoggedIn` (bool): Authentication status.

**Functionality**:
*   **Display**: Shows author, timestamp, content, media (via `MediaGallery`), and community info.
<<<<<<< HEAD
*   **Event Support**: Displays event details (Date, Time, Location, Hosts, Participant Count) and "Join" button. Handles expiration with "Concluded" tag.
*   **Review Support**: Specialized display for reviews (Rating, Item Name, Brand, Comparison).
=======
*   **Review Support**: Specialized display for reviews (Rating, Item Name, Brand).
*   **Comparison Support**: Distinct "VS" layout for comparison posts, showing two items side-by-side.
>>>>>>> 3966d619975d322f00e2c274514b5ac329c28cba
*   **Interactions**: Upvote/Downvote logic, Save/Unsave post.
*   **Comments**: Toggleable `CommentSection`.
*   **Social**: Share functionality (copies link).
*   **Tagged Users**: Displays tagged users as clickable badges that navigate to their profiles.

### `CommentSection.js`
**Path**: `src/components/CommentSection.js`

**Description**: Manages displaying and adding comments to a post.

**Props**:
*   `postId` (string): ID of the post.
*   `currentUser` (object): Current user for authorship.
*   `isLoggedIn` (bool): Determines if user can comment.

**Functionality**:
*   **List**: Fetches and lists comments with author details.
*   **Creation**: Input for text and optional media (image/video) upload.
*   **Media**: Handles uploading media for comments via `imageService`.

### `MediaGallery.js`
**Path**: `src/components/MediaGallery.js`

**Description**: A carousel component for displaying multiple media items (images/videos).

**Props**:
*   `mediaUrls` (array): List of media URL strings.

**Functionality**:
*   **Carousel**: Navigation arrows to cycle through media.
*   **Format Support**: Renders `<img>` or `<video>` based on file extension/type.
*   **Indicators**: Dots to show current slide position.

## Community System

### `CommunityExplorer.js`
**Path**: `src/components/CommunityExplorer.js`

**Description**: A page-like component to browse new communities.

**Props**:
*   `currentUser` (object): For join/leave logic.
*   `onNavigate` (func): Callback to switch to a specific community feed.
*   `onCommunityUpdate` (func): Callback to refresh parent/sidebar data.

**Functionality**:
*   **Listing**: Fetches all communities.
*   **Membership**: Users can Join/Leave communities.
*   **Visuals**: Displays banners and avatars in a card grid.

### `CommunityFeed.js`
**Path**: `src/components/CommunityFeed.js`

**Description**: Displays the feed and details for a specific community.

**Props**:
*   `communityId` (string): ID of the community to view.
*   `isLoggedIn` (bool), `user` (object): Auth state.
*   `onCommunityUpdate` (func): Trigger refresh on changes.
*   `onCommunityLoaded` (func): Pass updated community data back to parent.

**Functionality**:
*   **Content**: Fetches posts specific to the community. Maps posts to include `comparisonData` for correct display.
*   **Management**: Owner can edit banner/avatar and details.
*   **Layout**: Rich header with banner and info.

### `CommunityInfoCard.js`
**Path**: `src/components/CommunityInfoCard.js`

**Description**: A sidebar widget showing community details and rules.

**Props**:
*   `community` (object): Community data.
*   `currentUser` (object): Used to check ownership.
*   `onCommunityUpdate` (func): Callback after editing.

**Functionality**:
*   **Info**: Description, creation date, member count.
*   **Rules**: List of rules.
*   **Editing**: Owner can edit description and rules.

## User & Profile

### `ChatPopup.js`
**Path**: `src/components/Chat/ChatPopup.js`

**Description**: A persistent chat widget.

**Dependencies**: `ChatContext`.

**Functionality**:
*   **States**: Open, Minimized, or Closed.
*   **List View**: Search users, list recent chats.
*   **Chat Window**: Real-time messaging interface.

### `Profile.js` (Page)
**Path**: `src/pages/Profile.js`

**Description**: A comprehensive profile page handling various user roles (Appassionato, Bar, Torrefazione).

*   **Functionality**:
*   **Tabs**: Posts, Upvoted, Downvoted, Reviews, Comments, Saved, Products, Collections, etc.
*   **Post Display**: Uses `PostCard` to display all content types (Posts, Reviews, Comparisons, Saved Posts, Votes) as full cards instead of grid items.
*   **Statistics**: Displays user stats including Post count, Review count, Comparison count, Followers, and Following.
*   **Role Logic**: Different layout and data for standard users vs. business accounts.
*   **Editing**: Edit profile details, styling (Bar/Roastery), and associated users (Baristas).
*   **Torrefazione Features**: Product and Collection management (add/edit/delete).

### `CollectionManager.js`
**Path**: `src/components/CollectionManager.js`

**Description**: Modal for creating/editing product collections (Roastery role).

**Props**:
*   `roasterId`, `currentUser`, `products`: Context data.
*   `initialData`: If editing an existing collection.
*   `onClose`, `onSave`: Callbacks.

### `StarRating.js` / `CoffeeCupRating.js`
**Path**: `src/components/StarRating.js` / `src/components/CoffeeCupRating.js`

**Description**: Input components for ratings. `CoffeeCupRating` uses custom SVG icons with half-cup support.

## Modals & Forms

### `AuthModal.js`
**Description**: Container for `Login` and `Register` forms, switching between them.

### `CreatePostModal.js`
**Description**: Complex form for creating content.
*   **Modes**: Post, Review, or Event.
*   **Event Features**: Scheduled date/time, location, and host tagging.
*   **Review Features**: Item type, brand, rating, and "Comparison" mode (User vs User).
*   **Media**: Drag-and-drop or file select for multiple images/video.
*   **Target**: Publish to Profile or a specific Community.
*   **User Tagging**: Search and tag other users in the post with a dedicated search interface.

### `CreateCommunityModal.js`
**Description**: Simple form to create a new community (Name, Description).

## Pages

### `Home.js`
**Description**: The main dashboard.
*   **Layout**: Sidebar (left), Feed (center), Info/Widgets (right).
*   **Feeds**: Aggregates `PostCard` components based on `feedType`.

### `PostDetails.js`
**Description**: Standalone page for a single post.
*   **Features**: Full content view and expanded comment section.

### `Login.js` / `Register.js` / `ForgotPassword.js`
**Description**: Authentication forms using Firebase Auth. `Register` handles profile creation for different roles.
