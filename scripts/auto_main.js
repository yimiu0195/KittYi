const cron = require('node-cron');
const runSchedules = require('./schedule_runner');
const updateIndex = require('./toram_index');
const updateDetail = require('./toram_detail');
const notifyBot = require('./toram_notify');

function setupAllTasks(client) {
    cron.schedule('* * * * *', async () => {
        try {
            await runSchedules(client);
        } catch (err) {
            console.error("Run schedules err:", err.message);
        }
    });

    cron.schedule('*/1 * * * *', async () => {
        try {
            await updateIndex();
            await updateDetail();
            await notifyBot(client);
        } catch (err) {
            console.error("Run Toram err:", err.message);
        }
    });
}

module.exports = setupAllTasks;