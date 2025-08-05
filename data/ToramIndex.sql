CREATE TABLE IF NOT EXISTS ToramIndex (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `group_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `url` TEXT NOT NULL,
    `date` DATE NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `created_at` DATETIME NOT NULL
    UNIQUE KEY unique_group_title_date (`group_id`, `title`, `date`)
);