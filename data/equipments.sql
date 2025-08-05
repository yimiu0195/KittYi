CREATE TABLE IF NOT EXISTS `equipments` (
    `id` int(11) NOT NULL,
    `name` varchar(100) DEFAULT NULL,
    `type` varchar(50) DEFAULT NULL,
    `color` varchar(20) DEFAULT NULL,
    `sell_price` varchar(50) DEFAULT NULL,
    `process_cost` varchar(50) DEFAULT NULL,
    `stats_normal` text DEFAULT NULL,
    `stats_equipment_limited` text DEFAULT NULL,
    `obtained_from` text DEFAULT NULL
)