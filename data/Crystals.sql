CREATE TABLE Crystals (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) DEFAULT NULL,
    `type` VARCHAR(50) DEFAULT NULL,
    `color` VARCHAR(20) DEFAULT NULL,
    `sell_price` VARCHAR(50) DEFAULT NULL,
    `process_cost` VARCHAR(50) DEFAULT NULL,
    `stats_normal` TEXT DEFAULT NULL,
    `stats_equipment_limited` TEXT DEFAULT NULL,
    `obtained_from` TEXT DEFAULT NULL
);