const logger = require('../../utils/logger');
const config = require('../../../config.json');

const GATILHO = 'Pexe.';
const EMOJI_NOME = 'pexe';

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (config.features['pexe-reacao'] === false) return;
        if (message.author.bot || !message.guild) return;
        if (message.content.trim() !== GATILHO) return;

        const emoji = message.guild.emojis.cache.find(e => e.name === EMOJI_NOME);
        if (!emoji) {
            logger.error(`[messageCreate] Emoji :${EMOJI_NOME}: não encontrado em ${message.guild.name}`);
            return;
        }

        try {
            await message.react(emoji);
        } catch (error) {
            logger.error(`[messageCreate] Falha ao reagir à mensagem de ${message.author.tag}:`, error);
        }
    }
};
