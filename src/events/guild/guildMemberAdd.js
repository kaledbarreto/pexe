const config = require('../../../config.json');

const CARGO_REGRAS_ID = '936280227414425711';   // Cargo "Li as Regras e Concordo"
const CARGO_PERDIDOS_ID = '1508865619838107700'; // Cargo "Perdidos"

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        if (!config.features.autorename) return;

        console.log(`[guildMemberAdd] Evento disparado para: ${member.user.username}`);

        try {
            await member.setNickname('Pexe');
        } catch (error) {
            console.error(`[guildMemberAdd] Falha ao alterar nickname de ${member.user.tag}:`, error);
        }

        try {
            await member.roles.add([CARGO_REGRAS_ID, CARGO_PERDIDOS_ID]);
        } catch (error) {
            console.error(`[guildMemberAdd] Falha ao adicionar cargos de ${member.user.tag}:`, error);
        }
    }
};
