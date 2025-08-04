const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { isStaff } = require('../../function/roles');
const serverChannels = require('../../data/channels.json');

// Track TTS users per channel: { [guildId_channelId]: Set<userId> }
const ttsUsers = {};

module.exports = {
    name: 'tts',
    description: 'Speak a message in your voice channel using TTS',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'speak',
            description: 'Speak a message in your voice channel using TTS',
            type: 1, // Subcommand
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
            ]
        },
        {
            name: 'timeout',
            description: 'Timeout user from using TTS for set duration',
            type: 1, // Subcommand
            options: [
                {
                    name: 'user',
                    description: 'User to timeout',
                    type: 6, // User
                    required: true
                },
                {
                    name: 'duration',
                    description: 'Duration in minutes (default: 60)',
                    type: 4, // Integer
                    required: false
                },
                {
                    name: 'reason',
                    description: 'Reason for timeout',
                    type: 3, // String
                    required: false
                }
            ]
        }
    ],
    run: async (client, interaction) => {
        const { member, options, guild } = interaction;

        if(options.getSubcommand() === 'speak') {
            // Check if user is timed out
            const timeoutKey = `tts_timeout_${member.id}`;
            const now = Date.now();
            if (client.ttsTimeouts && client.ttsTimeouts[timeoutKey] && client.ttsTimeouts[timeoutKey] > now) {
                const remaining = Math.ceil((client.ttsTimeouts[timeoutKey] - now) / 60000);
                return await interaction.reply({ content: `You are currently timed out from using TTS for another ${remaining} minute(s).`, ephemeral: true });
            }

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
        } else if(options.getSubcommand() === 'timeout') {
            if(!await isStaff(member.id)) {
                return await interaction.reply({ content: 'You do not have permission to timeout users.', ephemeral: true });
            }
            const user = options.getUser('user');
            const duration = options.getInteger('duration') || 60; // Default to 60 minutes
            const reason = options.getString('reason') || 'No reason provided';
            const timeoutKey = `tts_timeout_${user.id}`;
            const now = Date.now();
            const timeoutDuration = duration * 60 * 1000; // Convert to ms

            // Check if user is already timed out
            if (client.ttsTimeouts && client.ttsTimeouts[timeoutKey] && client.ttsTimeouts[timeoutKey] > now) {
                const remaining = Math.ceil((client.ttsTimeouts[timeoutKey] - now) / 60000);
                return await interaction.reply({ content: `User is already timed out for another ${remaining} minute(s).`, ephemeral: true });
            }

            // Set timeout
            if (!client.ttsTimeouts) client.ttsTimeouts = {};
            client.ttsTimeouts[timeoutKey] = now + timeoutDuration;

            await interaction.reply({ content: `User ${user.tag} has been timed out from TTS for ${duration} minute(s). Reason: ${reason}`, ephemeral: true });
        
            const embed = new EmbedBuilder()
                .setTitle('TTS Timeout')
                .setDescription(`User ${user} (\`${user.id}\`) has been timed out from TTS for ${duration} minute(s).`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Moderator', value: `${member} (\`${member.id}\`)` }
                )
                .setColor('#FF0000')
                .setTimestamp();

            const auditlogChannel = guild.channels.cache.get(serverChannels.general);
            auditlogChannel.send({ embeds: [embed] }).catch(err => console.error('Failed to send audit log:', err));
        }
    }
};

// Voice state update handler to disconnect when all TTS users have left
if (!global.ttsVoiceHandlerAdded) {
    global.ttsVoiceHandlerAdded = true;
    const { Events } = require('discord.js');
    module.exports.voiceStateHandler = async (oldState, newState) => {
        // Only run if user left a channel (moved to different channel or disconnected)
        if (oldState.channelId && oldState.channelId !== newState.channelId) {
            const key = `${oldState.guild.id}_${oldState.channelId}`;
            
            // Check if this user was tracked for TTS in this channel
            if (ttsUsers[key] && ttsUsers[key].has(oldState.id)) {
                console.log(`TTS user ${oldState.member?.displayName || oldState.id} left channel ${oldState.channelId}`);
                ttsUsers[key].delete(oldState.id);
                
                // Get the channel to check remaining members
                const channel = oldState.guild.channels.cache.get(oldState.channelId);
                if (channel) {
                    // Check if any of the remaining users in the channel are TTS users
                    const remainingTTSUsers = channel.members.filter(member => 
                        ttsUsers[key] && ttsUsers[key].has(member.id) && !member.user.bot
                    );
                    
                    console.log(`Remaining TTS users in channel: ${remainingTTSUsers.size}`);
                    
                    // If no TTS users remain in the channel, disconnect the bot
                    if (remainingTTSUsers.size === 0) {
                        console.log(`No TTS users remain in channel ${oldState.channelId}, disconnecting bot`);
                        const connection = getVoiceConnection(oldState.guild.id);
                        if (connection) {
                            connection.destroy();
                            console.log(`Bot disconnected from voice channel ${oldState.channelId}`);
                        }
                        // Clean up the tracking for this channel
                        delete ttsUsers[key];
                    }
                } else {
                    // Channel doesn't exist anymore, clean up
                    console.log(`Channel ${oldState.channelId} no longer exists, cleaning up`);
                    const connection = getVoiceConnection(oldState.guild.id);
                    if (connection) {
                        connection.destroy();
                    }
                    delete ttsUsers[key];
                }
            }
        }
    };
}
