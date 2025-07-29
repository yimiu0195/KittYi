const fs = require('fs');
const path = require('path');
const { REST, Routes, Collection } = require('discord.js');
require('dotenv').config();


async function registerCommands(commands) {
    if (!commands || commands.size === 0) {
        console.warn("⚠️ No commands to register");
        return;
    }

    const commandsArray = [];

    for (const command of commands.values()) {
        if (Array.isArray(command.data)) {
            for (const cmd of command.data) {
                if (cmd?.name) {
                    commandsArray.push(cmd.toJSON());
                }
            }
        } else if (command.data?.name) {
            commandsArray.push(command.data.toJSON());
        }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    const isGlobal = !process.env.GUILD_ID;

    try {
        console.log(`🔁 Registering ${commandsArray.length} slash command...`);
        console.log("📋 Commands name:");

        for (const cmd of commandsArray) {
            console.log(` - /${cmd.name}`);
        }

        const route = isGlobal
            ? Routes.applicationCommands(process.env.CLIENT_ID)
            : Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID);

        const location = isGlobal ? '🌐 Global' : `🏠 Guild (${process.env.GUILD_ID})`;

        await rest.put(route, { body: commandsArray });

        console.log(`✅ Slash commands have been registered ${location}.`);
    } catch (error) {
        console.error("❌ Err when registering commands:", error);
        if (error.code) {
            console.error(`🔺 Discord API code: ${error.code}`);
        }
        console.error(error.message || error);
    }
}

module.exports = registerCommands;

if (require.main === module) {
    const commands = new Collection();
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const commandModule = require(path.join(commandsPath, file));

        const modules = Array.isArray(commandModule) ? commandModule : [commandModule];

        for (const cmd of modules) {
            if (!cmd?.data) {
                console.warn(`⚠️ Skip "${file}" no 'data'`);
                continue;
            }

            const dataArray = Array.isArray(cmd.data) ? cmd.data : [cmd.data];

            for (const sub of dataArray) {
                if (!sub?.name) {
                    console.warn(`Skip file "${file}"`);
                    continue;
                }

                if (commands.has(sub.name)) {
                    console.warn(`⚠️ File /${sub.name} (file: ${file}) → has been skipped`);
                    continue;
                }

                commands.set(sub.name, cmd);
                console.log(`✅ Loaded "/${sub.name}" from file ${file}`);
            }
        }
    }

    registerCommands(commands).catch(console.error);
}