CREATE TABLE embeds (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(64) NOT NULL,
    `title` TEXT,
    `description` TEXT,
    `footer` VARCHAR(128),
    `color` VARCHAR(10),
    `timestamp` DATETIME,
    `guild_id` VARCHAR(64),
	`image_url` TEXT,
    `author` VARCHAR(100),
    `avatar_url` TEXT,
    UNIQUE KEY `uniq_embed_name` (`name`, `guild_id`),
    INDEX `idx_guild` (`guild_id`)
);