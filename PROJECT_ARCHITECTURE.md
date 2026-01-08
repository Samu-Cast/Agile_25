# Project Architecture Documentation

## Overview

This project describes the architecture of the **BrewHub** social platform (codenamed `Agile_25`). It is a full-stack web application designed to connect coffee enthusiasts ("Appassionato"), professionals ("Barista"), and businesses ("Bar", "Torrefazione").

The system follows a standard **Client-Server** architecture, leveraging **Firebase** for persistence and real-time capabilities.

### High-Level Diagram
```mermaid
graph TD
    User[User Browser] <--> Client[Frontend (React)]
    Client <-->|REST API| Server[Backend (Node.js/Express)]
    Server <-->|Admin SDK| DB[(Firestore / Storage)]
    
    subgraph "Backend Services"
    Server
    MockDB[In-Memory Mock DB]
    Server -.->|Fallback| MockDB
    end
```

---

## 1. Directory Structure

The repository is organized as a monorepo containing both frontend and backend:

*   **`social-frontend/`**: The React client application.
*   **`social-backend/`**: The Node.js API server.
*   **Root**: Contains general project config (Git, Docs).

---

## 2. Backend Architecture (`social-backend`)

### Technology Stack
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database Interface**: `firebase-admin`
*   **Persistence**: Google Firestore (primary) / In-Memory Mock (fallback)
*   **File Storage**: Firebase Storage

### core Components

#### A. Server Entry Point (`server.js`, `app.js`)
*   `server.js`: Handles system process tasks like listening on the PORT (3001) and loading `.env`.
*   `app.js`: Configures the Express application, middleware (CORS, JSON parsing), and mounts all route modules.

#### B. Configuration & The "Mock DB" (`src/config/firebase.js`)
This is a critical architectural feature for developer experience.
1.  **Production/Dev Mode**: Tries to load `firebase-key.json` to connect to real Firestore.
2.  **Fallback Mode**: If the key is missing, it initializes a custom **In-Memory Mock Database**.
    *   This mock mimics the Firestore API (`collection()`, `doc()`, `get()`, `add()`, `update()`, `where()`).
    *   Allows the backend to run and pass basic functional tests without requiring valid Firebase credentials.
    *   **Data Persistence**: Data in mock mode is **lost on server restart**.

#### C. Route Layer (`src/routes/`)
The routes not only define endpoints but currently contain most of the business logic.
*   `users.js`: Profile management, followers.
*   `posts.js`: Feed fetching, creating posts, likes.
*   `communities.js`: Community management, membership.
*   `chats.js`: Real-time chat initiation and message history.
*   `upload.js`: Handles file uploads (multipart/form-data) to Firebase Storage.

---

## 3. Frontend Architecture (`social-frontend`)

### Technology Stack
*   **Framework**: React 18+ (Create React App)
*   **Routing**: React Router v6
*   **Styling**: Vanilla CSS (Component-scoped and Global vars)
*   **Testing**: Jest + React Testing Library

### Core Design Patterns

#### A. Service Layer (`src/services/`)
To decouple UI from API details, all network requests are encapsulated in service modules.
*   UI components call `postService.createPost(...)`.
*   `postService` handles `fetch`, headers, error parsing, and response mapping.

#### B. State Management
*   **Context API**: Used for global, app-wide state.
    *   `AuthContext`: Manages current user session (`currentUser`, `login`, `logout`) via Firebase Client SDK.
    *   `ChatContext`: Manages global chat widget state (open/minimized).
*   **Local State**: `useState` / `useReducer` for component-level logic (form inputs, toggle states).

#### C. Component Hierarchy
*   **Pages** (`src/pages/`): High-level views (e.g., `Home`, `Profile`, `Login`). They orchestrate fetching data and layout.
*   **Components** (`src/components/`): Reusable UI blocks.
    *   *Smart Components*: `PostCard`, `ChatPopup` (contain internal logic/state).
    *   *Presentational Components*: `StarRating` (render based on props usually).

---

## 4. Data Flow Example: "Creating a Post"

1.  **User Action**: User clicks "Post" in `CreatePostModal` (Frontend).
2.  **Service Call**: Component calls `uploadImage()` (if media exists) then `postService.createPost()`.
3.  **API Request**: `POST /api/posts` sent to Backend.
4.  **Backend Processing**:
    *   `posts.js` route receives request.
    *   Validates input (uid, text).
    *   Calls `db.collection('posts').add()`.
5.  **Persistence**:
    *   **Real Mode**: Data written to Firestore Cloud.
    *   **Mock Mode**: Data pushed to `mockData.posts` array in memory.
6.  **Response**: Backend returns 201 Created and the new Post ID.
7.  **UI Update**: Frontend modal closes, and the Feed re-fetches or optimistic updates occur.

---

## 5. Security & Authentication Model

*   **Client-Side**: Firebase Auth (Identity Platform) handles login/signup.
*   **Server-Side**:
    *   Usually, specific endpoints expect a `uid` in the body or query params to identify the actor.
    *   *Note*: A strict Token Verification middleware (decoding JWT) is implemented in some paths (referenced in code comments) but widespread reliance is currently on "Trusted UID" for the MVP stage or Mock usage.
    *   **Authorization**: Specific checks exist (e.g., "Only Creator can edit Community") within route logic.

## 6. Key Data Models (NoSQL)

*   **Users**: `uid`, name, role (Appassionato, Bar, ...), specific role data.
*   **Posts**: text, authorRef, media, likes, comments (subcollection or top-level).
*   **Communities**: name, description, creator, members (array of UIDs).
*   **Chats**: participants (array), lastMessage.
