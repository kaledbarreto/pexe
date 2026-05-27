const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../../config.json');

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log(`🐟 Pexe online — ${client.user.tag}`);

        const commands = [];
        const commandsPath = path.join(__dirname, '..', '..', 'commands');

        if (fs.existsSync(commandsPath)) {
            for (const folder of fs.readdirSync(commandsPath)) {
                const folderPath = path.join(commandsPath, folder);
                for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))) {
                    const command = require(path.join(folderPath, file));
                    if ('data' in command && config.features[command.data.name] !== false) {
                        commands.push(command.data.toJSON());
                    }
                }
            }
        }

        const rest = new REST().setToken(process.env.DISCORD_TOKEN);

        // Se usando guild commands, limpa comandos globais para evitar duplicatas
        if (process.env.GUILD_ID) {
            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
        }

        // Limpa overrides de guild para evitar resquícios de implementações anteriores
        for (const guild of client.guilds.cache.values()) {
            await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id), { body: [] });
        }

        const route = process.env.GUILD_ID
            ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
            : Routes.applicationCommands(process.env.CLIENT_ID);

        try {
            await rest.put(route, { body: commands });
            const scope = process.env.GUILD_ID ? `servidor ${process.env.GUILD_ID}` : 'global';
            console.log(`✅ ${commands.length} comando(s) registrado(s) [${scope}]`);
        } catch (error) {
            console.error('Failed to register commands:', error);
        }
    }
};
