CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    profile_pic TEXT,
    language TEXT DEFAULT 'en',
    reset_token TEXT,
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE auth_providers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_id TEXT UNIQUE NOT NULL
);

CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    year INTEGER,
    imdb_rating NUMERIC(3,1),
    cover_image TEXT,
    description TEXT,
    length INTEGER,
    added_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE movie_sources (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    source_url TEXT UNIQUE NOT NULL,
    seeders INTEGER,
    leechers INTEGER
);

CREATE TABLE watchlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    progress NUMERIC(5,2) DEFAULT 0.00,
    last_watched_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    posted_at TIMESTAMP DEFAULT NOW()
);

-- Indexation pour optimiser les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_watchlist_user ON watchlist(user_id);
CREATE INDEX idx_comments_movie ON comments(movie_id);