CREATE TABLE IF NOT EXISTS ToramSearch (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `category` ENUM('Item', 'Monster') NOT NULL,
    `info` TEXT,
    `author` VARCHAR(100),
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_category` (`category`),
    INDEX `idx_type` (type),
    INDEX `idx_name` (name)
);