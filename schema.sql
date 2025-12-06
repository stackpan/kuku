CREATE TABLE IF NOT EXISTS giveaways (
    message_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    channel_id VARCHAR(20) NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    winner_count SMALLINT NOT NULL,
    hosted_by VARCHAR(20) NOT NULL,
    active_weighted_roles_config_id SMALLINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guild_giveaway_weighted_roles (
    guild_id VARCHAR(20) NOT NULL,
    id SMALLSERIAL NOT NULL,
    role_id VARCHAR(20) NOT NULL,
    weight NUMERIC NOT NULL,
    weight_normalized INTEGER NOT NULL,
    PRIMARY KEY (guild_id, id, role_id)
);

CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY NOT NULL,
    giveaway_message_id VARCHAR(20) REFERENCES giveaways(message_id) ON DELETE CASCADE,
    user_id VARCHAR(20) NOT NULL,
    role_id VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (giveaway_message_id, user_id)
);

CREATE TABLE IF NOT EXISTS participant_requests (
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    win_at_position INTEGER NOT NULL,
    content VARCHAR(30) NOT NULL,
    PRIMARY KEY (participant_id, win_at_position)
);