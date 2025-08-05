const fs = require('fs');
const path = require('path');
const pool = require('../utils/db');


async function runAllSqlFiles() {
    const dir = path.join(__dirname, '../data');

    const files = fs.readdirSync(dir).filter(file => file.endsWith('.sql'));

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const sql = fs.readFileSync(fullPath, 'utf8');

        try {
            console.log(`Running ${file}...`);
            await pool.query(sql);
            console.log(`✅ Done: ${file}`);
        } catch (err) {
            console.error(`Error in ${file}:`, err.message);
        }
    }

    console.log('✅ All SQL files executed.');
}

if (require.main === module) {
    runAllSqlFiles().catch(err => {
        console.error('Failed to initialize DB:', err);
        process.exit(1);
    });

} else {
    module.exports = runAllSqlFiles;
}