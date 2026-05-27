const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pexe')
        .setDescription('Verifica se o Pexe tá vivo'),

    async execute(interaction) {
        const { resource } = await interaction.reply({
            content: '🐟 Checando se o Pexe tá vivo...',
            flags: MessageFlags.Ephemeral,
            withResponse: true
        });

        const rest = resource.message.createdTimestamp - interaction.createdTimestamp;
        const ws = interaction.client.ws.ping;

        await interaction.editReply(
            `🐟 **Pexe tá vivo!**\n> 💓 Batimento: \`${ws}ms\`\n> ⚡ Reflexo: \`${rest}ms\``
        );
    }
};
