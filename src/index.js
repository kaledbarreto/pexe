require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    for (const folder of fs.readdirSync(commandsPath)) {
        const folderPath = path.join(commandsPath, folder);
        for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))) {
            const command = require(path.join(folderPath, file));
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            }
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
for (const folder of fs.readdirSync(eventsPath)) {
    const folderPath = path.join(eventsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;
    for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))) {
        const event = require(path.join(folderPath, file));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

client.login(process.env.DISCORD_TOKEN);
