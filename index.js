const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const registerCommands = require('./utils/registerCommands');
const setupAutoTasks = require('./scripts/auto_main');
const echoManager = require('./utils/activeEcho');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

const prefix = process.env.PREFIX;
const prefixCommands = new Map();

// Load prefix commands
const prefixCommandsPath = path.join(__dirname, 'prefix_commands');

if (fs.existsSync(prefixCommandsPath)) {
    const prefixCommandFiles = fs.readdirSync(prefixCommandsPath).filter(file => file.endsWith('.js'));
    for (const file of prefixCommandFiles) {
        const command = require(`./prefix_commands/${file}`);
        if (command.name) {
            prefixCommands.set(command.name, command);
        }
    }
}

// Load slash commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const commandModule = require(`./commands/${file}`);
    const commands = Array.isArray(commandModule) ? commandModule : [commandModule];

    for (const command of commands) {
        if (!command?.data?.name) {
            console.warn(`⚠️ Skipped "${file}": Missing data.name`);
            continue;
        }
        if (client.commands.has(command.data.name)) {
            console.warn(`⚠️ Duplicate /${command.data.name}, skipping ${file}`);
            continue;
        }
        client.commands.set(command.data.name, command);
    }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Ready
client.once('ready', async () => {
    console.log(`🤖 Bot ready: ${client.user.tag}`);
    await registerCommands(client.commands); // Register slash commands
    setupAutoTasks(client); // Setup auto jobs

    client.user.setPresence({
        activities: [{ name: `You ✿ ⋆｡ ﾟ ☁︎｡⋆｡ ﾟ ☾ ﾟ ｡⋆`, type: 3 }], // type 3: watching
        status: 'idle',
    });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const content = message.content;
    const loweredPrefix = prefix.toLowerCase();

    if (!content.toLowerCase().startsWith(loweredPrefix)) {
        
        if (message.guild && echoManager.isEnabled(message.guild.id, message.author.id)) {
            const content = message.content?.trim();
            if (!content) return;

            try {
                await message.delete();
                await message.channel.send(content);
            } catch (err) {
                console.error('Echo message err: ', err);
            }
        }
        return;
    }

    const matchedPrefix = content.match(new RegExp(`^${prefix}`, 'i'))?.[0];
    if (!matchedPrefix) return;

    const args = content.slice(matchedPrefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    const command = prefixCommands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(error);
        await message.channel.send('**Oof**');
    }
});

client.login(process.env.TOKEN);