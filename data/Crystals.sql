CREATE TABLE Crystals (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100),
    `type` VARCHAR(50),
    `color` VARCHAR(20),
    `sell_price` VARCHAR(50),
    `process_cost` VARCHAR(50),
    `stats_normal` TEXT,
    `stats_equipment_limited` TEXT,
    `obtained_from` TEXT
);