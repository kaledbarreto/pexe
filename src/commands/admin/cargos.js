const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cargos')
        .setDescription('Gerencia cargos em massa por filtro de nick (admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub
            .setName('adicionar')
            .setDescription('Adiciona um cargo a todos com o nick especificado')
            .addStringOption(opt => opt
                .setName('filtro')
                .setDescription('Nick exato a buscar (ex: Pexe, Pexe Batata)')
                .setRequired(true))
            .addRoleOption(opt => opt
                .setName('cargo')
                .setDescription('Cargo a adicionar')
                .setRequired(true)))
        .addSubcommand(sub => sub
            .setName('remover')
            .setDescription('Remove um cargo de todos com o nick especificado')
            .addStringOption(opt => opt
                .setName('filtro')
                .setDescription('Nick exato a buscar (ex: Pexe, Pexe Batata)')
                .setRequired(true))
            .addRoleOption(opt => opt
                .setName('cargo')
                .setDescription('Cargo a remover')
                .setRequired(true)))
        .addSubcommand(sub => sub
            .setName('substituir')
            .setDescription('Substitui um cargo por outro em todos com o nick especificado')
            .addStringOption(opt => opt
                .setName('filtro')
                .setDescription('Nick exato a buscar (ex: Pexe, Pexe Batata)')
                .setRequired(true))
            .addRoleOption(opt => opt
                .setName('remover')
                .setDescription('Cargo a remover')
                .setRequired(true))
            .addRoleOption(opt => opt
                .setName('adicionar')
                .setDescription('Cargo a adicionar')
                .setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const sub = interaction.options.getSubcommand();
        const filtro = interaction.options.getString('filtro').trim();
        const filtroNormalizado = filtro.toLowerCase();

        const alvos = interaction.guild.members.cache.filter(m =>
            (m.nickname ?? m.user.username).toLowerCase() === filtroNormalizado
        );

        if (alvos.size === 0) {
            return interaction.editReply({
                content: `🐟 Nenhum membro encontrado com o nick **${filtro}**.`
            });
        }

        let sucessos = 0;
        let falhas = 0;

        if (sub === 'adicionar') {
            const cargo = interaction.options.getRole('cargo');
            const resultados = await Promise.allSettled(
                alvos.map(m => m.roles.add(cargo.id))
            );
            sucessos = resultados.filter(r => r.status === 'fulfilled').length;
            falhas = resultados.filter(r => r.status === 'rejected').length;

            return interaction.editReply({
                content: resumo(filtro, alvos.size, `adicionado **${cargo.name}**`, sucessos, falhas)
            });
        }

        if (sub === 'remover') {
            const cargo = interaction.options.getRole('cargo');
            const resultados = await Promise.allSettled(
                alvos.map(m => m.roles.remove(cargo.id))
            );
            sucessos = resultados.filter(r => r.status === 'fulfilled').length;
            falhas = resultados.filter(r => r.status === 'rejected').length;

            return interaction.editReply({
                content: resumo(filtro, alvos.size, `removido **${cargo.name}**`, sucessos, falhas)
            });
        }

        if (sub === 'substituir') {
            const cargoRemover = interaction.options.getRole('remover');
            const cargoAdicionar = interaction.options.getRole('adicionar');
            const resultados = await Promise.allSettled(
                alvos.map(async m => {
                    await m.roles.remove(cargoRemover.id);
                    await m.roles.add(cargoAdicionar.id);
                })
            );
            sucessos = resultados.filter(r => r.status === 'fulfilled').length;
            falhas = resultados.filter(r => r.status === 'rejected').length;

            return interaction.editReply({
                content: resumo(filtro, alvos.size, `substituído **${cargoRemover.name}** → **${cargoAdicionar.name}**`, sucessos, falhas)
            });
        }
    }
};

function resumo(filtro, total, acao, sucessos, falhas) {
    const linhas = [
        `🐟 **${total}** membro(s) encontrado(s) com nick **${filtro}** — ${acao}.`,
        `> ✅ ${sucessos} atualizado(s) com sucesso.`
    ];
    if (falhas > 0) linhas.push(`> ⚠️ ${falhas} falha(s) — verifique a hierarquia de cargos do bot.`);
    return linhas.join('\n');
}
