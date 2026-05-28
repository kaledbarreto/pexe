const { MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

const CARGO_MEMBRO_ID = '681926568653750342';   // Cargo "🐟 | Cardume"
const CARGO_PENDENTE_ID = '1508865619838107700'; // Cargo de quem ainda não fez o registro

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction) {

        // --- Slash Commands ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Erro no comando "${interaction.commandName}":`, error);
                const reply = { content: '🐟 Algo deu errado por aqui. Tenta de novo ou chama um staff.', flags: MessageFlags.Ephemeral };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            }
            return;
        }

        // --- Botão: Iniciar Registro ---
        if (interaction.isButton() && interaction.customId === 'trigger_registro_pexe') {
            if (!interaction.member.roles.cache.has(CARGO_PENDENTE_ID)) {
                return interaction.reply({
                    content: '🐟 Calma lá, você já tem o seu RG Pexe!',
                    flags: MessageFlags.Ephemeral
                });
            }

            const modal = new ModalBuilder()
                .setCustomId('modal_registro_pexe')
                .setTitle('RG Pexe - Escolha seu sobrenome');

            const sobrenomeInput = new TextInputBuilder()
                .setCustomId('sobrenome')
                .setLabel('Qual é o seu sobrenome Pexe?')
                .setPlaceholder('Ex: Frito, Tsunami, Sol...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(50);

            modal.addComponents(new ActionRowBuilder().addComponents(sobrenomeInput));
            return interaction.showModal(modal);
        }

        // --- Modal Submit: Finalizar Registro ---
        if (interaction.isModalSubmit() && interaction.customId === 'modal_registro_pexe') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const sobrenome = interaction.fields.getTextInputValue('sobrenome').trim().replace(/^pexe\s*/i, '').trim();

            if (!sobrenome) {
                return interaction.editReply({
                    content: '🐟 "Pexe" sozinho não conta. Adiciona um sobrenome depois!'
                });
            }

            const nomeCompleto = `Pexe ${sobrenome}`;
            const nomeNormalizado = nomeCompleto.toLowerCase();

            const members = interaction.guild.members.cache;
            const duplicata = members.find(m =>
                m.nickname?.toLowerCase() === nomeNormalizado ||
                m.user.username.toLowerCase() === nomeNormalizado
            );

            if (duplicata) {
                return interaction.editReply({
                    content: `🐠 Já tem um **${nomeCompleto}** nadando por aqui. Tenta outro sobrenome!`
                });
            }

            try {
                await interaction.member.setNickname(nomeCompleto);
            } catch (error) {
                console.error(`[registro] Falha ao alterar nickname de ${interaction.user.tag}:`, error);
                return interaction.editReply({
                    content: '🐟 Não consegui registrar o seu nome. Chama um staff pra dar uma olhada.'
                });
            }

            try {
                await interaction.member.roles.remove(CARGO_PENDENTE_ID);
                await interaction.member.roles.add(CARGO_MEMBRO_ID);
            } catch (error) {
                console.error(`[registro] Falha ao atualizar cargos de ${interaction.user.tag}:`, error);
                return interaction.editReply({
                    content: '🐟 Nome definido, mas não consegui atualizar seus cargos. Chama um staff.'
                });
            }

            return interaction.editReply({
                content: `🐟 Pronto! Você agora é **${nomeCompleto}**.`
            });
        }
    }
};
