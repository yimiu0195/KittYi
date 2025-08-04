const cron = require('node-cron');
const runSchedules = require('./schedule_runner');
const updateIndex = require('./toram_index');
const updateDetail = require('./toram_detail');
const notifyBot = require('./toram_notify');
const notifySteamSales = require('./steam_notify');

function setupAllTasks(client) {
    cron.schedule('* * * * *', async () => {
        try {
            await runSchedules(client);
        } catch (err) {
            console.error("Run schedules err:", err.message);
        }
    });

    setInterval(async () => {
        try {
            await updateIndex();
            await updateDetail();
            await notifyBot(client);
        } catch (err) {
            console.error("Run Toram err:", err.message);
        }
    }, 30_000);

    cron.schedule('*/30 * * * *', async () => {
        try {
            await notifySteamSales(client);
        } catch (err) {
            console.error("❌ Cron Steam Notify err:", err.message);
        }
    });
}

module.exports = setupAllTasks;