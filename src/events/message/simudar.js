const path = require('path');
const fs = require('fs');
const { AttachmentBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const config = require('../../../config.json');

// Cada letra pode se repetir: "simudar", "siiimuudar", "SIIIIIIMUDAR"...
const GATILHO = /s+i+m+u+d+a+r+/i;
const AUDIO_PATH = path.join(__dirname, '../../../assets/simudar.mp3');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (config.features['simudar-audio'] === false) return;
        if (message.author.bot || !message.guild) return;
        if (!GATILHO.test(message.content)) return;

        if (!fs.existsSync(AUDIO_PATH)) {
            logger.error(`[simudar] Áudio não encontrado em ${AUDIO_PATH}`);
            return;
        }

        try {
            await message.reply({
                files: [new AttachmentBuilder(AUDIO_PATH, { name: 'simudar.mp3' })],
                allowedMentions: { repliedUser: false }
            });
        } catch (error) {
            logger.error(`[simudar] Falha ao responder ${message.author.tag}:`, error);
        }
    }
};
