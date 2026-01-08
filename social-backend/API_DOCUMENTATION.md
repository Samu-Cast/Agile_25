# Backend API Documentation

This document details all available endpoints in the backend API.

## Base URL
All API routes are prefixed depending on the resource. The API generally accepts and returns JSON.

## Authentication
Check individual endpoints for authentication requirements. Many endpoints require a valid Firebase UID to be passed in the body or query parameters (e.g., `uid`, `currentUid`).

---

## 1. Posts (`/api/posts`)

### GET /api/posts
**Description:** Fetches a list of posts with optional filtering and sorting.
**Parameters (Query):**
- `uid` (string): Current user ID (used for checking vote status).
- `authorUid` (string): Filter posts by a specific author.
- `filter` (string): `followed` to show only posts from followed users.
- `sort` (string): `popular` (by votes) or default (newest first).
- `communityId` (string): Filter by community ID.
- `type` (string): Filter by post type (`post` or `review`).
**Response:** Array of post objects.

### POST /api/posts
**Description:** Creates a new post or review.
**Body:**
- `uid` (string, required): ID of the user creating the post.
- `text` (string, required): Content of the post.
- `type` (string): `post` (default) or `review`.
- `communityId` (string): Optional community ID.
- `imageUrl` (string): Optional legacy image URL.
- `mediaUrls` (array): Optional list of media URLs.
- `reviewData` (object): Required if `type` is `review`. Contains `rating` (0.5-5), `itemName`, `itemType`, `brand`.
**Response:** The created post object with its ID.

### GET /api/posts/:postId/comments
**Description:** Fetches comments for a specific post.
**Parameters:** `postId` (URL param).
**Response:** Array of comment objects.

### POST /api/posts/:postId/comments
**Description:** Adds a comment to a post.
**Body:**
- `uid` (string, required): User ID.
- `text` (string, required): Comment content.
- `parentComment` (string, optional): ID of parent comment for replies.
- `mediaUrls` (array, optional): Attached media.
**Response:** Created comment object.

### POST /api/posts/:postId/like
**Description:** Upvotes or downvotes a post. Toggles vote if same value sent.
**Body:**
- `uid` (string, required): User ID.
- `value` (number, required): `1` for upvote, `-1` for downvote.
**Response:** Message and `voteChange`.

### DELETE /api/posts/:postId/like
**Description:** Removes a vote from a post.
**Body:**
- `uid` (string, required): User ID.
**Response:** Success message.

### POST /api/posts/:postId/save
**Description:** Saves a post to the user's collection.
**Body:**
- `uid` (string, required): User ID.
**Response:** Success message.

### DELETE /api/posts/:postId/save
**Description:** Removes a post from the user's saved collection.
**Body:**
- `uid` (string, required): User ID.
**Response:** Success message.

### POST /api/posts/:postId/coffee
**Description:** "Gives coffee" (award) to the post author.
**Body:**
- `uid` (string, required): User ID of the giver.
**Response:** Message and new coffee count.

### DELETE /api/posts/:postId/coffee
**Description:** Removes coffee award.
**Body:**
- `uid` (string, required): User ID.
**Response:** Message and new coffee count.

### POST /api/posts/:postId/rating
**Description:** Rates a post (0-5 stars).
**Body:**
- `uid` (string, required): User ID.
- `rating` (number, required): Rating value (0-5).
**Response:** Message and updated `ratingBy` map.

### DELETE /api/posts/:postId
**Description:** Deletes a post. Only the owner can delete.
**Body:**
- `uid` (string, required): User ID of the requester.
**Response:** Success message.

---

## 2. Users (`/api/users`)

### GET /api/users/search
**Description:** Searches for users by nickname, name, or email.
**Parameters (Query):**
- `q` (string, required): Search query (min 2 chars).
- `role` (string, optional): Filter by user role.
**Response:** Array of user objects.

### GET /api/users/:uid
**Description:** Fetches a user's profile.
**Response:** User object.

### GET /api/users (Careful)
**Description:** Fetches a list of users (limit 20).
**Response:** Array of user objects.

### PUT /api/users/:uid
**Description:** Updates a user profile. Handles Base64 image upload for `profilePic`.
**Body:** Fields to update (e.g., `nickname`, `bio`). `profilePic` can be a base64 string.
**Response:** Message and updated `profilePic` URL.

### POST /api/users
**Description:** Creates or updates a user profile (upsert).
**Body:** `uid` (required) and other user data.
**Response:** Success message.

### POST /api/users/batch
**Description:** Fetches multiple users by ID.
**Body:**
- `uids` (array of strings): List of User IDs.
**Response:** Array of user objects.

### GET /api/users/:uid/savedPosts
**Description:** Gets IDs of posts saved by the user.
**Response:** Array of post IDs.

### GET /api/users/:uid/savedPosts/details
**Description:** Gets detailed post objects for posts saved by the user.
**Response:** Array of post objects with `userVote` context.

### GET /api/users/:uid/communities
**Description:** Fetches communities the user is part of.
**Response:** Array of community objects.

### GET /api/users/:uid/votedPosts
**Description:** Fetches posts a user has voted on.
**Parameters (Query):**
- `type` (number): `1` (upvoted) or `-1` (downvoted).
**Response:** Array of post objects.

### POST /api/users/:uid/follow
**Description:** Follows a user.
**Body:**
- `currentUid` (string, required): The ID of the follower.
**Response:** Success message.

### POST /api/users/:uid/unfollow
**Description:** Unfollows a user.
**Body:**
- `currentUid` (string, required): The ID of the user unfollowing.
**Response:** Success message.

### GET /api/users/:uid/checkFollow/:targetUid
**Description:** Checks if `uid` follows `targetUid`.
**Response:** `{ isFollowing: boolean }`

### GET /api/users/:uid/followers
**Description:** Gets a list of follower IDs.
**Response:** Array of user IDs.

### GET /api/users/:uid/following
**Description:** Gets a list of following user IDs.
**Response:** Array of user IDs.

---

## 3. Bars (`/api/bars`)

### GET /api/bars
**Description:** Fetches a list of bars (limit 20).
**Parameters (Query):**
- `ownerUid` (string, optional): Filter by owner.
**Response:** Array of bar objects.

### GET /api/bars/:id
**Description:** Fetches details of a specific bar.
**Response:** Bar object.

### POST /api/bars
**Description:** Creates a new bar.
**Body:** Bar data.
**Response:** Created bar object with ID.

### PUT /api/bars/:id
**Description:** Updates a bar.
**Body:** Updates to apply.
**Response:** Success message.

---

## 4. Roasters (`/api/roasters`)

### GET /api/roasters
**Description:** Fetches a list of roasters (limit 20).
**Parameters (Query):**
- `ownerUid` (string, optional): Filter by owner.
**Response:** Array of roaster objects.

### GET /api/roasters/:id
**Description:** Fetches details of a specific roaster.
**Response:** Roaster object.

### POST /api/roasteries (Note: Route is `/api/roasteries` in code comment but mounted at `/api/roasters`)
**Ref Correction:** The POST endpoint is mounted at `/api/roasters` (root of router).
**Description:** Creates a new roaster.
**Body:** Roaster data. Requires `name`.
**Response:** Created roaster object.

### PUT /api/roasters/:id
**Description:** Updates a roaster.
**Body:** Updates.
**Response:** Success message.

### GET /api/roasters/:id/products
**Description:** Fetches products for a roaster.
**Response:** Array of product objects.

### POST /api/roasters/:id/products
**Description:** Adds a product to a roaster. Handles file upload (`image` field).
**Body (Multipart):**
- `name` (string, required)
- `price` (required)
- `image` (file, optional)
- other fields...
**Response:** Created product object.

### DELETE /api/roasters/:id/products/:productId
**Description:** Deletes a product.
**Response:** Success message.

### GET /api/roasters/:id/collections
**Description:** Fetches collections for a roaster.
**Response:** Array of collection objects.

### POST /api/roasters/:id/collections
**Description:** Creates a collection.
**Body:** `name`, `description`, `products`, `uid` (owner check).
**Response:** Created collection object.

### PUT /api/roasters/:id/collections/:collectionId
**Description:** Updates a collection.
**Body:** `uid` (owner check) and updates.
**Response:** Success message.

### DELETE /api/roasters/:id/collections/:collectionId
**Description:** Deletes a collection.
**Body:** `uid` (owner check).
**Response:** Success message.

---

## 5. Search (`/api/search`)

### GET /api/search
**Description:** Universal search across Users, Bars, Roasters, and Posts.
**Parameters (Query):**
- `q` (string, required): Search term.
**Response:** Array of mixed objects, each with a `type` field (`user`, `bar`, `roaster`, `post`).

---

## 6. Comments (`/api/comments`)

### GET /api/comments
**Description:** Fetches all comments made by a specific user across all posts.
**Parameters (Query):**
- `uid` (string, required): User ID.
**Response:** Array of comment objects, enriched with `postTitle`.

---

## 7. Upload (`/api/upload`)

### POST /api/upload
**Description:** Uploads a file (image or video) to Firebase Storage.
**Body (Multipart):**
- `file` (file, required): Image (<5MB) or Video (<50MB).
- `folder` (string, optional): Target folder (default: `posts`).
**Response:** `{ url: string }`

---

## 8. Communities (`/api/communities`)

### GET /api/communities
**Description:** Lists all communities.
**Response:** Array of community objects.

### GET /api/communities/:id
**Description:** Fetches community details.
**Response:** Community object.

### POST /api/communities
**Description:** Creates a new community.
**Body:**
- `name` (string, required)
- `creatorId` (string, required)
- `description`, `avatar` (optional)
**Response:** Created community object.

### PUT /api/communities/:id
**Description:** Updates a community. Only creator can update.
**Body:** `updaterId` (required for auth check) and updates (`name`, `description`, etc.).
**Response:** Updated data.

### POST /api/communities/:id/join
**Description:** Toggles join/leave status for a user.
**Body:**
- `uid` (string, required): User ID.
**Response:** `{ success: true, joined: boolean }`

---

## 9. Chats (`/api/chats`)

### POST /api/chats/init
**Description:** Initializes or retrieves a chat between two users.
**Body:**
- `currentUid` (string, required)
- `targetUid` (string, required)
**Response:** Chat object (with ID).

### GET /api/chats/user/:uid
**Description:** Fetches all chats for a user.
**Response:** Array of chat objects (sorted by `updatedAt` desc).

### GET /api/chats/:chatId/messages
**Description:** Fetches messages for a chat.
**Parameters (Query):**
- `limit` (number, default: 20)
**Response:** Array of message objects (newest first).

### POST /api/chats/:chatId/messages
**Description:** Sends a message in a chat.
**Body:**
- `senderId` (string, required)
- `text` (string, required)
**Response:** the created message object.
