# Project Ode

A backend for a video sharing platform, built with Node.js, Express and MongoDB. It covers user accounts with JWT authentication, video publishing with cloud media storage, and the social features around them: comments, likes, tweets, subscriptions and playlists.

## Features

- **Authentication:** registration and login with bcrypt-hashed passwords, short-lived access tokens and long-lived refresh tokens (delivered as HTTP-only cookies), logout, token refresh and password change.
- **User profiles:** avatar and cover image uploads, account detail updates, public channel profiles, and watch history.
- **Videos:** publish with a video file and thumbnail, update, delete, publish/unpublish toggle, and a listing endpoint with text search, sorting and pagination.
- **Comments:** add, edit, delete and list comments on a video (paginated).
- **Likes:** toggle likes on videos, comments and tweets, and fetch all liked videos.
- **Tweets:** short community posts that users can create, edit, delete and list.
- **Subscriptions:** subscribe or unsubscribe to channels, list a channel's subscribers, and list the channels a user follows.
- **Playlists:** create, update and delete playlists, add or remove videos, and fetch playlists by user.
- **Media handling:** uploads are received with Multer and stored on Cloudinary.
- **Consistent API layer:** shared `ApiResponse` and `ApiError` classes plus an async handler wrapper, so every route returns the same response shape and errors are handled centrally.

## Tech Stack

| Area | Tools |
| --- | --- |
| Runtime and framework | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Auth | JSON Web Tokens, bcrypt, cookie-parser |
| File uploads | Multer, Cloudinary |
| Tooling | Nodemon, Prettier, dotenv |

## Project Structure

```
src/
├── index.js            # Entry point: loads env, connects to MongoDB, starts the server
├── app.js              # Express app, middleware and route mounting
├── constants.js        # Database name
├── db/                 # MongoDB connection
├── models/             # Mongoose schemas (user, video, comment, like, tweet, subscription, playlist)
├── controllers/        # Request handlers
├── routes/             # Route definitions
├── middlewares/        # JWT verification, Multer upload config
└── utils/              # ApiResponse, ApiError, asyncHandler, Cloudinary helper
public/temp/            # Temporary storage for files before they are uploaded to Cloudinary
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- A MongoDB instance (local or MongoDB Atlas)
- A Cloudinary account

### Installation

```bash
git clone https://github.com/aditya26mishra/projectOde.git
cd projectOde
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=8000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net
CORS_ORIGIN=http://localhost:3000

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

`MONGODB_URI` should not include a database name. The app appends `videode` automatically.

### Run

```bash
npm run dev
```

The server starts on `http://localhost:8000` (or the port you set).

## API Reference

All routes are prefixed with `/api/v1`. Every route requires a valid access token, except the ones marked **Public**.

### Users: `/users`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/register` | **Public.** Register (multipart: `avatar`, `coverImage`) |
| POST | `/login` | **Public.** Log in and receive tokens |
| POST | `/refresh-token` | **Public.** Issue a new access token |
| POST | `/logout` | Log out |
| POST | `/change-password` | Change password |
| GET | `/current-user` | Get the logged-in user |
| PATCH | `/update-account` | Update account details |
| PATCH | `/avatar` | Update avatar |
| PATCH | `/cover-image` | Update cover image |
| GET | `/c/:username` | Get a channel profile |
| GET | `/history` | Get watch history |

### Videos: `/videos`

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | List videos (supports `query`, `sortBy`, `sortType` and pagination) |
| POST | `/` | Publish a video (multipart: `videoFile`, `thumbnail`) |
| GET | `/:videoId` | Get a video |
| PATCH | `/:videoId` | Update a video (optional `thumbnail`) |
| DELETE | `/:videoId` | Delete a video |
| PATCH | `/toggle/publish/:videoId` | Toggle publish status |

### Comments: `/comments`

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/:videoId` | List comments on a video |
| POST | `/:videoId` | Add a comment |
| PATCH | `/c/:commentId` | Update a comment |
| DELETE | `/c/:commentId` | Delete a comment |

### Likes: `/likes`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/toggle/v/:videoId` | Toggle like on a video |
| POST | `/toggle/c/:commentId` | Toggle like on a comment |
| POST | `/toggle/t/:tweetId` | Toggle like on a tweet |
| GET | `/videos` | Get liked videos |

### Tweets: `/tweets`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/` | Create a tweet |
| GET | `/user/:userId` | Get a user's tweets |
| PATCH | `/:tweetId` | Update a tweet |
| DELETE | `/:tweetId` | Delete a tweet |

### Subscriptions: `/subscriptions`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/c/:channelId` | Toggle subscription to a channel |
| GET | `/c/:channelId` | Get a channel's subscribers |
| GET | `/u/:userId` | Get channels a user has subscribed to |

### Playlists: `/playlists`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/` | Create a playlist |
| GET | `/:playlistId` | Get a playlist |
| PATCH | `/:playlistId` | Update a playlist |
| DELETE | `/:playlistId` | Delete a playlist |
| PATCH | `/add/:videoId/:playlistId` | Add a video to a playlist |
| PATCH | `/remove/:videoId/:playlistId` | Remove a video from a playlist |
| GET | `/user/:userId` | Get a user's playlists |

## Notes

- Auth cookies are set with `httpOnly` and `secure`, so browsers only send them over HTTPS. When testing over plain HTTP, send the access token in an `Authorization: Bearer <token>` header instead, or use a tool such as Postman.
- Uploaded files are written to `public/temp` first, then pushed to Cloudinary.

## Author

**Aditya Mishra**
[GitHub](https://github.com/aditya26mishra) · [LinkedIn](https://linkedin.com/in/aditya26mishra)
