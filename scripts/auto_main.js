const cron = require('node-cron');
const runSchedules = require('./schedule_runner');
const updateIndex = require('./toram_index');
const updateDetail = require('./toram_detail');
const notifyBot = require('./toram_notify');
const notifySteamSales = require('./steam_notify');

let isToramTaskRunning = false;
let isRunSchedulesRunning = false;
let isSteamNotifyRunning = false;

function setupAllTasks(client) {
    cron.schedule('* * * * *', async () => {
        if (isRunSchedulesRunning) return;
        isRunSchedulesRunning = true;
        try {
            await runSchedules(client);
        } catch (err) {
            console.error("Run schedules err:", err.message);
        } finally {
            isRunSchedulesRunning = false;
        }
    });

    setInterval(async () => {
        if (isToramTaskRunning) return;
        isToramTaskRunning = true;
        try {
            await updateIndex();
            await updateDetail();
            await notifyBot(client);
        } catch (err) {
            console.error("Run Toram err:", err.message);
        } finally {
            isToramTaskRunning = false;
        }
    }, 30_000);

    cron.schedule('*/30 * * * *', async () => {
        if (isSteamNotifyRunning) return;
        isSteamNotifyRunning = true;
        try {
            await notifySteamSales(client);
        } catch (err) {
            console.error("❌ Cron Steam Notify err:", err.message);
        } finally {
            isSteamNotifyRunning = false;
        }
    });
}

module.exports = setupAllTasks;