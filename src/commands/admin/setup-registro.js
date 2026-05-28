const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags
} = require('discord.js');

const AUTOR_ICON_URL = 'https://media.discordapp.net/attachments/516766479178399744/1509384177294774462/Gato_Brabo.png?ex=6a18fb0e&is=6a17a98e&hm=66717666eab47b63a1047d8ed641f6fe8021a6aed8231d739a2c8c3022c54097&=&format=webp&quality=lossless';
const BANNER_URL = 'https://media.discordapp.net/attachments/516766479178399744/1509384464684290198/image.png?ex=6a18fb53&is=6a17a9d3&hm=ae535c3131550f99d49c845c7b559dcf97f5dfe985d66a70256bff6e4464d796&=&format=webp&quality=lossless&width=550&height=266';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-registro')
        .setDescription('Envia a mensagem de registro no canal atual (admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Atum', iconURL: AUTOR_ICON_URL })
            .setTitle('🪪 Tire seu RG Pexe!')
            .setDescription(
                'Cansou de nadar por aí sem identidade?\n' +
                'Aqui você tira o seu RG Pexe e garante o seu cantinho no cardume!\n\n' +
                'Clique no botão e escolha seu sobrenome Pexe!\n\n' +
                '> Não precisa ser peixe de verdade!\n' +
                '> Já ocupado? Tenta um diferente.'
            )
            .setColor(0x00B0F4)
            .setImage(BANNER_URL)
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
