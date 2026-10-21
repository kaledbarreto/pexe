const path = require('path');
const fs = require('fs');
const { AttachmentBuilder } = require('discord.js');
const {
    joinVoiceChannel,
    getVoiceConnection,
    createAudioPlayer,
    createAudioResource,
    entersState,
    StreamType,
    VoiceConnectionStatus,
    AudioPlayerStatus
} = require('@discordjs/voice');
const logger = require('../../utils/logger');
const config = require('../../../config.json');

// Cada letra pode se repetir: "simudar", "siiimuudar", "SIIIIIIMUDAR"...
const GATILHO = /s+i+m+u+d+a+r+/i;
const AUDIO_PATH = path.join(__dirname, '../../../assets/simudar.mp3');
// Versão Ogg Opus do mesmo áudio: tocada direto na call, sem ffmpeg/encoder
const VOZ_PATH = path.join(__dirname, '../../../assets/simudar.ogg');

async function tocarNaCall(canal) {
    // Já está em alguma call nesse servidor (ex.: tocando outro "simudar")
    if (getVoiceConnection(canal.guild.id)) return;
    if (!canal.joinable || !canal.speakable) {
        logger.warn(`[simudar] Sem permissão para entrar/falar em #${canal.name}`);
        return;
    }

    const connection = joinVoiceChannel({
        channelId: canal.id,
        guildId: canal.guild.id,
        adapterCreator: canal.guild.voiceAdapterCreator
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

        const player = createAudioPlayer();
        connection.subscribe(player);
        player.play(createAudioResource(fs.createReadStream(VOZ_PATH), { inputType: StreamType.OggOpus }));

        await entersState(player, AudioPlayerStatus.Playing, 5_000);
        await entersState(player, AudioPlayerStatus.Idle, 60_000);
    } finally {
        connection.destroy();
    }
}

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

        if (config.features['simudar-call'] === false) return;
        const canal = message.member?.voice.channel;
        if (!canal) return;

        if (!fs.existsSync(VOZ_PATH)) {
            logger.error(`[simudar] Áudio de voz não encontrado em ${VOZ_PATH}`);
            return;
        }

        try {
            await tocarNaCall(canal);
        } catch (error) {
            logger.error(`[simudar] Falha ao tocar na call #${canal.name}:`, error);
        }
    }
};
