CREATE TABLE IF NOT EXISTS ToramDetail (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `group_id` INT NOT NULL,
    `content_type` VARCHAR(50) NOT NULL,
    `content` TEXT NOT NULL,
    `notified` TINYINT(1) DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `cron_expression` VARCHAR(64) DEFAULT NULL,
    `date` DATE DEFAULT NULL
);