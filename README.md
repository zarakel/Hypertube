# Hypertube

Hypertube is a video streaming web application that allows users to search and watch videos directly via the BitTorrent protocol without waiting for the complete file download. The project is based on a decoupled architecture featuring a React client, a Node.js streaming server, and a PostgreSQL database, all orchestrated and containerized using Docker.

## Architecture and Technologies

### Client (Frontend)
- React 18: Main library for building the user interface.
- React Router DOM: Route and navigation management within the application.
- React Player: Integrated video player supporting standard HTML5 streaming and subtitle track display.
- Axios: HTTP client used to communicate with the backend API.

### Server (Backend)
- Node.js and Express: API server and streaming engine.
- torrent-stream: Node.js module used to interface with the BitTorrent protocol to download file pieces on demand.
- JSON Web Tokens (JWT) and BcryptJS: Secure authentication management and password hashing.
- Nodemailer: Email sending service for account validation or password reset.

### Database
- PostgreSQL 15: Relational database to store user profiles, watch history, comments, and movie sources.

### Infrastructure and Deployment
- Docker and Docker Compose: Containerization of the different services (frontend, backend, database) ensuring an identical and reproducible development environment.

## Implemented Techniques

### 1. On-the-fly Streaming via BitTorrent
The server uses the `torrent-stream` library to initialize a download engine from a magnet link. As soon as the first essential pieces of the video file are downloaded, the stream is sent to the client in real time. The system automatically identifies the largest video file within the torrent to launch the appropriate viewing stream.

### 2. Handling Partial Requests (HTTP 206 / Range Requests)
To offer a smooth playback experience, the backend implements full support for byte-range requests (HTTP Range Requests). When a user seeks forward or backward in the video timeline, the browser sends a `Range` header. The server then extracts the precise corresponding bytes from the torrent stream and responds with an HTTP 206 (Partial Content) status. This avoids downloading the file sequentially from the beginning.

### 3. Dynamic Subtitle Conversion (SRT to VTT)
Native HTML5 video players require the WebVTT (.vtt) format to display subtitles. Since torrents often contain subtitles in SubRip (.srt) format, the server implements an on-the-fly converter. It reads the SRT stream, applies regular expressions to adapt timestamp formatting, and returns the converted data directly as a `text/vtt` stream to the client player.

### 4. Smart Resource Management (Torrent Garbage Collector)
To avoid saturating the server's storage and memory, a periodic cleanup mechanism (`enginesCleanup`) is implemented. Every 30 seconds, the server checks the inactivity of the torrent engines. If an engine has not been requested for more than 30 seconds, it is destroyed and the associated resources are freed.

### 5. Database Design and Optimization
The SQL schema implements strategic indexes on frequently queried columns such as `email`, `username`, movie title, or user ID in the watchlist. Additionally, the architecture supports advanced features like linking third-party accounts (OAuth via the `auth_providers` table) and precise tracking of user watch progress (`watchlist` table).

## Acquired Skills

Completing this project allows mastering several fundamental software development concepts:
- Network Protocols and P2P: Deep understanding of the BitTorrent protocol, managing peers, seeds, and leechers.
- Data Stream Handling (Streams): Manipulating Node.js streams (`ReadStream`, `pipe`) to transfer data efficiently and asynchronously without overloading RAM.
- HTTP Protocol Management: Precise implementation of caching mechanisms, specific HTTP statuses such as 206 Partial Content, and content negotiation.
- Architecture and Containerization: Modeling a multi-service application with Docker Compose, configuring isolated networks, and managing startup dependencies between containers (healthchecks).
- SQL Optimization: Structuring complex relational databases and indexing to guarantee minimal response times.

## Installation and Startup

### Prerequisites
- Docker and Docker Compose installed on your machine.

### Launch Instructions
1. Duplicate the environment variables example file:
   ```bash
   cp .env.example .env
   ```
2. Fill in the required variables in the `.env` file.
3. Start the containers with Docker Compose using the Makefile:
   ```bash
   make
   ```
   This command will build the images and start the frontend on port 3000, the backend on port 5001, and the PostgreSQL database.

### Useful Makefile Commands
- Start services: `make up`
- Stop services: `make down`
- Clean volumes and networks: `make clean`
- View logs of a service (e.g. backend): `make logs SERVICE=backend`
- Open a terminal in a container (e.g. backend): `make shell SERVICE=backend`
