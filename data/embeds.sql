CREATE TABLE IF NOT EXISTS embeds (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(64) NOT NULL,
    `title` TEXT DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `footer` VARCHAR(128) DEFAULT NULL,
    `color` VARCHAR(10) DEFAULT NULL,
    `timestamp` DATETIME DEFAULT NULL,
    `guild_id` VARCHAR(64) DEFAULT NULL,
	`image_url` TEXT DEFAULT NULL,
    `author` VARCHAR(100) DEFAULT NULL,
    `avatar_url` TEXT DEFAULT NULL,
    UNIQUE KEY `uniq_embed_name` (`name`, `guild_id`),
    INDEX `idx_guild` (`guild_id`)
);