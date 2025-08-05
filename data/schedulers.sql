CREATE TABLE IF NOT EXISTS schedulers (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name_scheduler` VARCHAR(100) NOT NULL,
    `content` TEXT NOT NULL,
    `message_type` ENUM('text', 'embed') NOT NULL,
    `send_time` DATETIME NOT NULL,
    `timezone` VARCHAR(50),
    `repeat_time` ENUM('none', 'minutes', 'hourly', 'daily', 'weekly', 'monthly') DEFAULT 'none',
    `interval_minutes` INT DEFAULT NULL,
    `status_scheduler` ENUM('pending', 'sent') DEFAULT 'pending',
    `guild_id` VARCHAR(50) NOT NULL,
    `channel_id` VARCHAR(50) NOT NULL,

    UNIQUE (`name_scheduler`, `guild_id`),
    INDEX `idx_guild` (`guild_id`),
    INDEX `idx_channel` (`channel_id`),
    INDEX `idx_send_time` (`send_time`)
);