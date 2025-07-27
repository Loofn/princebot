const { ApplicationCommandType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Track TTS users per channel: { [guildId_channelId]: Set<userId> }
const ttsUsers = {};

module.exports = {
    name: 'tts',
    description: 'Speak a message in your voice channel using TTS',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'text',
            description: 'Text to speak',
            type: 3,
            required: true
        },
        {
            name: 'lang',
            description: 'Language code (default: en)',
            type: 3,
            required: false
        }
    ],
    run: async (client, interaction) => {
        const { member, options, guild } = interaction;
        let text = options.getString('text');
        const lang = options.getString('lang') || 'en';
        const voiceChannel = member.voice?.channel;
        if (!voiceChannel) {
            return await interaction.reply({ content: 'You must be in a voice channel to use TTS.', ephemeral: true });
        }
        if (!text || text.length > 200) {
            return await interaction.reply({ content: 'Text must be between 1 and 200 characters.', ephemeral: true });
        }
        // Prepend username to speech
        const username = member.displayName || member.user.username || member.user.tag;
        text = `${username} said. ${text}`;
        // Track user for this channel
        const key = `${guild.id}_${voiceChannel.id}`;
        if (!ttsUsers[key]) ttsUsers[key] = new Set();
        ttsUsers[key].add(member.id);

        // Google Translate TTS URL
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
        const tempFile = path.join(__dirname, '../../data/tts_temp.mp3');
        // Download TTS audio
        const file = fs.createWriteStream(tempFile);
        https.get(ttsUrl, (response) => {
            response.pipe(file);
            file.on('finish', async () => {
                file.close();
                // Join voice channel and play audio
                let connection = getVoiceConnection(guild.id);
                if (!connection) {
                    connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: guild.id,
                        adapterCreator: guild.voiceAdapterCreator
                    });
                }
                const player = createAudioPlayer();
                const resource = createAudioResource(tempFile);
                player.play(resource);
                connection.subscribe(player);
                player.on(AudioPlayerStatus.Idle, () => {
                    fs.unlinkSync(tempFile);
                });
            });
        }).on('error', async (err) => {
            fs.unlinkSync(tempFile);
            await interaction.reply({ content: 'Failed to generate TTS audio.', ephemeral: true });
        });
        await interaction.reply({ content: 'Speaking your message...', ephemeral: true });
    }
};

// Voice state update handler to disconnect when all TTS users have left
if (!global.ttsVoiceHandlerAdded) {
    global.ttsVoiceHandlerAdded = true;
    const { Events } = require('discord.js');
    module.exports.voiceStateHandler = async (oldState, newState) => {
        // Only run if user left a channel
        if (oldState.channelId && oldState.channelId !== newState.channelId) {
            const key = `${oldState.guild.id}_${oldState.channelId}`;
            if (ttsUsers[key] && ttsUsers[key].has(oldState.id)) {
                ttsUsers[key].delete(oldState.id);
                // Check if any tracked users remain
                const channel = oldState.guild.channels.cache.get(oldState.channelId);
                const stillTracked = channel && channel.members.some(m => ttsUsers[key].has(m.id));
                if (!stillTracked) {
                    // Disconnect bot from channel
                    const connection = getVoiceConnection(oldState.guild.id);
                    if (connection) connection.destroy();
                    delete ttsUsers[key];
                }
            }
        }
    };
}
