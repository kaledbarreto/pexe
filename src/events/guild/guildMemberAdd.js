const config = require('../../../config.json');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        if (!config.features.autorename) return;

        console.log(`[guildMemberAdd] Evento disparado para: ${member.user.username}`);
        try {
            await member.setNickname('Pexe');
            console.log(`Nickname de ${member.user.tag} alterado para "Pexe".`);
        } catch (error) {
            console.error(`Não foi possível alterar o nickname de ${member.user.tag}:`, error);
        }
    }
};
