CREATE TABLE steam_channels (
    `guild_id` VARCHAR(32),
    `channel_id` VARCHAR(32),
    PRIMARY KEY (`guild_id`, `channel_id`)
);