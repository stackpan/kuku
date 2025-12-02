CREATE TABLE IF NOT EXISTS giveaways (
    id UUID PRIMARY KEY,
    message_id VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS participants (
    giveaway_id UUID REFERENCES giveaways(id) ON DELETE CASCADE,
    user_id VARCHAR(20) PRIMARY KEY,
    role_id VARCHAR(20) NOT NULL,
    probability_cache FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(giveaway_id, user_id)
);
