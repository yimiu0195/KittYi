const cron = require('node-cron');
const runSchedules = require('./schedule_runner');
const updateDetail = require('./update_detail');
const updateIndex = require('./update_index');
const notifyBot = require('./notifyBot');

function setupAllTasks(client) {
    cron.schedule('* * * * *', async () => {
        try {
            await runSchedules(client);
        } catch (err) {
            console.error("❌ Cron job runSchedules err:", err.message);
        }
    });

    cron.schedule('*/1 * * * *', async () => {
        try {
            await updateIndex();
            await updateDetail();
            await notifyBot(client);
        } catch (err) {
            console.error("❌ Cron job err:", err.message);
        }
    });
}

module.exports = setupAllTasks;