# Frontend Service Documentation

This document details the frontend services located in `src/services/`. These modules handle API communication and business logic abstraction.

## `chatService.js`
Handles real-time chat operations.

### `initChat(currentUid, targetUid)`
Initializes or retrieves an existing private chat between two users.
- **POST** `/chats/init`
- **Returns**: Chat object.

### `getUserChats(uid)`
Retrieves all chats for a specific user.
- **GET** `/chats/user/:uid`
- **Returns**: Array of chat objects.

### `getChatMessages(chatId)`
Retrieves message history for a chat.
- **GET** `/chats/:chatId/messages`
- **Returns**: Array of message objects.

### `sendMessage(chatId, senderId, text)`
Sends a new message to a chat.
- **POST** `/chats/:chatId/messages`
- **Returns**: Created message object.

---

## `collectionService.js`
Manages product collections for Roasteries.

### `getCollections(roasterId)`
Fetches all collections for a specific roastery.
- **GET** `/roasters/:roasterId/collections`

### `createCollection(roasterId, collectionData)`
Creates a new product collection.
- **POST** `/roasters/:roasterId/collections`
- **Params**: `collectionData` includes `name`, `description`, `products` (array of IDs).

### `updateCollection(roasterId, collectionId, updates)`
Updates an existing collection.
- **PUT** `/roasters/:roasterId/collections/:collectionId`

### `deleteCollection(roasterId, collectionId, uid)`
Deletes a collection. Requires owner UID for verification.
- **DELETE** `/roasters/:roasterId/collections/:collectionId`

### `getUserSavedCollections(userId)`
Fetches collections saved by a user.
- **GET** `/users/:userId/saved-collections`

### `saveCollection(userId, roasteryId, collectionId)`
Saves a collection for a user.
- **POST** `/users/:userId/saved-collections`

### `unsaveCollection(userId, collectionId)`
Removes a collection from user's saved list.
- **DELETE** `/users/:userId/saved-collections/:collectionId`

---

## `communityService.js`
Handles community data fetching. Uses in-memory caching (`communityCache`) to optimize performance.

### `getCommunitiesByIds(ids)`
Fetches details for a list of community IDs.
- Checks cache first, then fetches missing IDs individually (optimization candidate).
- **GET** `/communities/:id` for each missing ID.

### `getCommunity(id)`
Fetches single community details.
- Checks cache first.
- **GET** `/communities/:id`

### `getAllCommunities()`
Fetches all available communities.
- **GET** `/communities`
- Populates cache.

### `getUserCommunities(uid)`
Fetches communities a user has joined.
- **GET** `/users/:uid/communities`

### `createCommunity(communityData)`
Creates a new community.
- **POST** `/communities`
- **Returns**: Created community object.

### `joinCommunity(communityId, userId)`
Joins or leaves a community (toggle).
- **POST** `/communities/:communityId/join`

### `updateCommunity(communityId, data)`
Updates community details.
- **PUT** `/communities/:communityId`

---

## `imageService.js`
Utilities for handling media uploads (images and videos).

### `uploadImage(file, folder)`
Uploads a single image to the backend.
- **POST** `/upload`
- **Returns**: URL string.

### `validateImage(file)` / `validateVideo(file)` / `validateMedia(file)`
Client-side validation helpers for file type and size limitations (Images: 5MB, Videos: 50MB).

### `uploadVideo(file, folder)`
Uploads a single video to the backend.
- **POST** `/upload`
- **Returns**: URL string.

### `uploadMultipleMedia(files, folder)`
Batch uploads mixed media types.
- returns: Array of URL strings.

---

## `postService.js`
Core service for Posts, Feed, and Interactions.

### `createPost(postData)`
Creates a new post.
- **POST** `/posts`
- **Params**: `postData` maps frontend fields to backend expected `text`, `imageUrl`, `entityType`, `taggedUsers` (array of user UIDs).

### `getFeedPosts(params)`
Fetches the main feed with optional filters.
- **GET** `/posts` (with query params: `uid`, `filter`, `limit`, `communityId`, etc.)

### `updateVotes(postId, userId, value)`
Handles Upvote/Downvote interactions.
- **POST** `/posts/:postId/like`

### `toggleCoffee(postId, userId)`
Toggles the "Coffee" (super-like) status on a post.
- **POST** / **DELETE** `/posts/:postId/coffee`

### `addComment(postId, commentData)`
Adds a comment to a post.
- **POST** `/posts/:postId/comments`

### `toggleSavePost(postId, userId, isSaved)`
Saves or unsaves a post for a user.
- **POST** / **DELETE** `/posts/:postId/save`

### `joinEvent(postId, userId)` / `leaveEvent(postId, userId)`
Manages event participation.
- **POST** `/posts/:postId/join` / `/leave`
- Updates local participant list and backend record.

### `getUserPosts(userId, currentUserId)`
Fetches posts created by specific user.
- **GET** `/users/:userId/posts`

### `getUserVotedPosts(userId, voteValue)`
Fetches posts upvoted/downvoted by user.
- **GET** `/users/:userId/votes` (with query `value`)

### `getUserSavedPosts(userId)`
Fetches posts saved by user.
- **GET** `/users/:userId/saved-posts`

### `getUserComments(userId)`
Fetches comments made by user.
- **GET** `/users/:userId/comments`

### `getUserEvents(userId)`
Fetches events created by or participating in by user.
- **GET** `/users/:userId/events`

### `deletePost(postId, userId)`
Deletes a post.
- **DELETE** `/posts/:postId`

---

## `userService.js`
Manages User profiles, Roles, and Social Graph.

### `searchUsers(queryText, role)`
Searches for users by nickname/name.
- **GET** `/users/search`

### `searchGlobal(queryText)`
Global search across Users, Bars, Roasters, and contents.
- **GET** `/search`

### `getUsersByUids(uids)`
Batch fetches user profiles. Uses in-memory `userCache`.
- **POST** `/users/batch`

### `createUserProfile(uid, userData)` / `updateUserProfile(uid, updates)`
CRUD operations for basic user profiles.

### `createRoleProfile(collectionName, data)` / `updateRoleProfile(...)`
Manages specific role profiles (`bars`, `roasters`). Note: Frontend uses `roasteries` key which maps to backend `roasters` endpoint.

### `followUser(targetUid, currentUid)` / `unfollowUser(...)`
Manages user follow relationships.
- **POST** `/users/:id/follow` or `/unfollow`

### `getRoasteryProducts(roasteryId)`
Fetches products catalog for a roastery.
- **GET** `/roasters/:roasteryId/products`

### `createProduct(roasteryId, productData)`
Creates a new product. Supports `FormData` for image upload if `image` is a File object.
- **POST** `/roasters/:roasteryId/products`
