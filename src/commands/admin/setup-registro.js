const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-registro')
        .setDescription('Envia a mensagem de registro no canal atual (admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🪪 Cartório do Cardume')
            .setDescription(
                'Cansou de nadar por aí sem identidade? Aqui você tira o seu RG Pexe e garante o seu cantinho no cardume.\n\n' +
                'Clique no botão, escolha um sobrenome e saia do anonimato de uma vez.\n\n' +
                '> Não precisa ser peixe de verdade — pode ser qualquer coisa!\n' +
                '> Sobrenome já ocupado? Sem drama, o mar é grande — tenta outro.'
            )
            .setColor(0x57F287)
            .setFooter({ text: 'Todos são Pexe.' });

        const button = new ButtonBuilder()
            .setCustomId('trigger_registro_pexe')
            .setLabel('📥 Registrar-se')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Mensagem de registro enviada!', flags: MessageFlags.Ephemeral });
    }
};
